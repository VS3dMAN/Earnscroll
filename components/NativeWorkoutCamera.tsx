import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import { useTimeBank } from '@/contexts/TimeBank';
import { Flame, Zap, Timer, Play, StopCircle, Lock, SwitchCamera, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

// --- TYPES ---
type ExerciseType = 'squats' | 'pushups' | 'planks';
type Phase = 'idle' | 'up' | 'down' | 'holding';
type Keypoint = { x: number; y: number; s: number };

// A keypoint must clear this confidence to be trusted. Raised from 0.3 — the lower
// value let low-confidence (often wrong) joints drive rep counting.
const CONFIDENCE_THRESHOLD = 0.4;
// Require this many confident keypoints overall before we believe a person is in frame.
const MIN_KEYPOINTS_VISIBLE = 6;

// Angle thresholds for each exercise (degrees)
const SQUAT_DOWN_ANGLE = 100;  // knee must bend to at least this
const SQUAT_UP_ANGLE = 155;    // knee must straighten past this
const PUSHUP_DOWN_ANGLE = 90;  // elbow must bend to at least this
const PUSHUP_UP_ANGLE = 160;   // elbow must straighten past this
const PLANK_MIN_ANGLE = 155;   // body alignment (shoulder-hip-ankle)
const PLANK_MAX_ANGLE = 195;

// Rotation-invariant posture validation (uses angles between body parts, not absolute coords)
// Squats: hip angle (shoulder-hip-knee) stays large when torso is upright relative to thigh
const SQUAT_HIP_ANGLE_MIN = 70;   // shoulder-hip-knee must be > this (very permissive — natural squat form)
// Pushups: body must be extended/straight (shoulder-hip-ankle angle stays large)
const PUSHUP_BODY_ANGLE_MIN = 110; // shoulder-hip-ankle must be > this (body roughly straight)

// Debounce durations (ms)
const REP_DEBOUNCE_MS = 500;
const PLANK_TICK_MS = 1000;

// Require consecutive frames confirming the phase before committing
const PHASE_CONFIRM_FRAMES = 2;

// A real rep takes time. The down->up transition must last at least MIN (else it's
// jitter / a flicker, not a rep) and at most MAX (else the user got stuck / left).
const MIN_REP_DURATION_MS = 400;
const MAX_REP_DURATION_MS = 10000;

// Exponential moving average on the rep-driving joint angle. Lower alpha = smoother
// (less weight on the newest, noisiest frame) but slightly laggier.
const ANGLE_EMA_ALPHA = 0.5;

// Throttle how often the worklet reports tracking quality back to the JS UI (~12fps).
const TRACKING_PUSH_INTERVAL_MS = 80;

const KP = {
    LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6,
    LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
    LEFT_WRIST: 9, RIGHT_WRIST: 10,
    LEFT_HIP: 11, RIGHT_HIP: 12,
    LEFT_KNEE: 13, RIGHT_KNEE: 14,
    LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
};

export default function NativeWorkoutCamera() {
    const { hasPermission, requestPermission } = useCameraPermission();
    const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
    const device = useCameraDevice(cameraFacing);
    const { addMinutes, isUserPro, userFreeExercise, earningRatios, addExerciseToHistory } = useTimeBank();
    const router = useRouter();

    // Only run the camera when the Workout tab is focused AND the app is in the foreground.
    const isFocused = useIsFocused();
    const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            setIsAppActive(state === 'active');
        });
        return () => sub.remove();
    }, []);
    const isCameraActive = isFocused && isAppActive;

    // UI State
    const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squats');
    const [isRecording, setIsRecording] = useState(false);
    const [count, setCount] = useState(0);
    const [feedback, setFeedback] = useState("Ready");
    const [showSelector, setShowSelector] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [modelStatus, setModelStatus] = useState<string>('Loading model...');
    // How many keypoints the model is confidently seeing right now (0–17).
    const [trackingQuality, setTrackingQuality] = useState<number>(0);

    // AI & Worklets — using react-native-worklets-core for VisionCamera compatibility
    const plugin = useTensorflowModel(require('../assets/models/movenet_lightning.tflite'));
    const { resize } = useResizePlugin();
    const currentPhase = useSharedValue<string>('idle');
    const lastActionTime = useSharedValue<number>(0);
    const pendingPhase = useSharedValue<string>('');
    const pendingFrames = useSharedValue<number>(0);
    // EMA state for the rep-driving joint angle, the moment the user entered "down",
    // and the last time we pushed tracking quality to JS.
    const smoothedAngle = useSharedValue<number>(-1);
    const downEnteredAt = useSharedValue<number>(0);
    const lastTrackingPush = useSharedValue<number>(0);

    // Shared values so the worklet always reads current state
    const isRecordingShared = useSharedValue(false);
    const selectedExerciseShared = useSharedValue<string>('squats');
    useEffect(() => { isRecordingShared.value = isRecording; }, [isRecording]);
    useEffect(() => {
        selectedExerciseShared.value = selectedExercise;
        // New exercise → drop the smoothed angle so it re-seeds cleanly.
        smoothedAngle.value = -1;
        // Pushups and planks are done with the phone propped to the side, so the
        // back camera is the natural choice; squats face the phone (front camera).
        setCameraFacing(selectedExercise === 'squats' ? 'front' : 'back');
    }, [selectedExercise]);

    // Track model loading state
    useEffect(() => {
        if (plugin.state === 'loading') {
            setModelStatus('Loading AI model...');
        } else if (plugin.state === 'error') {
            setModelStatus('Failed to load AI model');
        } else if (plugin.state === 'loaded' && plugin.model) {
            setModelStatus('');
            console.log('✓ TFLite model loaded successfully');
            console.log('  Inputs:', JSON.stringify(plugin.model.inputs?.map(t => ({ name: t.name, shape: t.shape, dataType: t.dataType }))));
            console.log('  Outputs:', JSON.stringify(plugin.model.outputs?.map(t => ({ name: t.name, shape: t.shape, dataType: t.dataType }))));
        }
    }, [plugin.state, plugin.model]);

    useEffect(() => {
        if (!hasPermission) requestPermission();
    }, [hasPermission]);

    // Track count with ref for speech announcements
    const countRef = useRef(0);

    // --- LOGIC: Rep Counting (Runs on JS Thread) ---
    const handleRep = useCallback((exercise: string) => {
        const newCount = countRef.current + 1;
        countRef.current = newCount;
        setCount(newCount);

        // Announce rep count via speech
        if (exercise !== 'planks') {
            Speech.speak(String(newCount), { rate: 1.2, pitch: 1.0 });
        }

        // For Squats/Pushups, we award minutes immediately
        if (exercise !== 'planks') {
            const ex = exercise as 'squats' | 'pushups';
            const earned = isUserPro ? earningRatios[ex] : 1;
            addMinutes(earned);
            addExerciseToHistory(ex, 1);
            setFeedback(`${exercise.toUpperCase()} +${earned}m`);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    }, [isUserPro, earningRatios, addMinutes, addExerciseToHistory]);

    const handleFeedbackUpdate = useCallback((msg: string) => {
        setFeedback(msg);
    }, []);

    const handleTrackingQuality = useCallback((q: number) => {
        setTrackingQuality(q);
    }, []);

    // Create worklet-safe JS callbacks using react-native-worklets-core
    const onRep = Worklets.createRunOnJS(handleRep);
    const onFeedback = Worklets.createRunOnJS(handleFeedbackUpdate);
    const onTracking = Worklets.createRunOnJS(handleTrackingQuality);

    // Reset all per-session detection state. Called when a workout starts.
    const resetDetectionState = () => {
        currentPhase.value = 'idle';
        pendingPhase.value = '';
        pendingFrames.value = 0;
        smoothedAngle.value = -1;
        downEnteredAt.value = 0;
        lastActionTime.value = 0;
    };

    // --- LOGIC: Finish Workout ---
    const finishWorkout = () => {
        setIsRecording(false);

        // Calculate Plank Earnings at end (based on total seconds held).
        // `count` is seconds held. `earningRatios.planks` is minutes earned per
        // minute of planking (e.g. 3 = a 3:1 ratio), matching squats/pushups where
        // the ratio is minutes-per-rep. Convert seconds -> minutes, then apply ratio.
        if (selectedExercise === 'planks' && count > 0) {
            const plankRatio = isUserPro ? (earningRatios.planks ?? 3) : 3;
            const earned = Math.floor((count / 60) * plankRatio);
            if (earned > 0) {
                addMinutes(earned);
                addExerciseToHistory('planks', count);
                setFeedback(`PLANK +${earned}m`);
            }
        }

        setShowSelector(true);
        triggerCelebration();
    };

    const triggerCelebration = () => {
        setShowConfetti(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setShowConfetti(false), 3000);
    };

    // --- AI FRAME PROCESSOR (Worklet) ---
    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        if (plugin.model == null) return;
        if (!isRecordingShared.value) return;

        try {
            // Center-crop the frame to a square BEFORE scaling to 192x192. MoveNet
            // expects square input; scaling a non-square frame to a square stretches
            // X and Y by different factors and distorts every joint angle. Cropping
            // first keeps the scale uniform so angles stay accurate. (If reps ever
            // stop counting entirely, this `crop` is the first thing to remove.)
            const fw = frame.width;
            const fh = frame.height;
            const side = fw < fh ? fw : fh;
            const cropX = Math.round((fw - side) / 2);
            const cropY = Math.round((fh - side) / 2);

            const resized = resize(frame, {
                crop: { x: cropX, y: cropY, width: side, height: side },
                scale: { width: 192, height: 192 },
                pixelFormat: 'rgb',
                dataType: 'uint8',
            });
            const outputs = plugin.model.runSync([resized]);
            const raw = outputs[0];
            if (!raw || raw.length < 51) return;

            // MoveNet Lightning: output shape [1, 1, 17, 3] flattened to 51 floats
            // Each keypoint: [y, x, confidence_score]
            const getKP = (i: number): Keypoint => {
                const idx = i * 3;
                return {
                    y: Number(raw[idx] ?? 0),
                    x: Number(raw[idx + 1] ?? 0),
                    s: Number(raw[idx + 2] ?? 0),
                };
            };

            // Angle calculation — returns -1 if any keypoint has low confidence
            const getAngle = (a: Keypoint, b: Keypoint, c: Keypoint): number => {
                if (a.s < CONFIDENCE_THRESHOLD || b.s < CONFIDENCE_THRESHOLD || c.s < CONFIDENCE_THRESHOLD) return -1;
                const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
                let angle = Math.abs(radians * 180.0 / Math.PI);
                if (angle > 180.0) angle = 360 - angle;
                return angle;
            };

            // Pick best side (highest avg confidence)
            const pickBestSide = (leftIdxs: number[], rightIdxs: number[]): Keypoint[] => {
                let leftConf = 0;
                let rightConf = 0;
                const leftKPs: Keypoint[] = [];
                const rightKPs: Keypoint[] = [];
                for (let i = 0; i < leftIdxs.length; i++) {
                    const l = getKP(leftIdxs[i]);
                    const r = getKP(rightIdxs[i]);
                    leftConf += l.s;
                    rightConf += r.s;
                    leftKPs.push(l);
                    rightKPs.push(r);
                }
                return leftConf >= rightConf ? leftKPs : rightKPs;
            };

            // Exponential moving average on the rep-driving angle. Invalid (-1) readings
            // don't pollute the average; the last good value is kept.
            const smooth = (rawAngle: number): number => {
                if (rawAngle < 0) return smoothedAngle.value;
                if (smoothedAngle.value < 0) {
                    smoothedAngle.value = rawAngle;
                    return rawAngle;
                }
                const s = ANGLE_EMA_ALPHA * rawAngle + (1 - ANGLE_EMA_ALPHA) * smoothedAngle.value;
                smoothedAngle.value = s;
                return s;
            };

            // Confirm phase: only commit a phase change after PHASE_CONFIRM_FRAMES consecutive detections
            const trySetPhase = (newPhase: string): boolean => {
                if (pendingPhase.value === newPhase) {
                    pendingFrames.value += 1;
                    if (pendingFrames.value >= PHASE_CONFIRM_FRAMES) {
                        currentPhase.value = newPhase;
                        pendingPhase.value = '';
                        pendingFrames.value = 0;
                        return true;
                    }
                    return false;
                } else {
                    pendingPhase.value = newPhase;
                    pendingFrames.value = 1;
                    return false;
                }
            };

            // --- Person-presence gate. Don't count anything if we can't see enough of the body. ---
            let confident = 0;
            for (let i = 0; i < 17; i++) {
                if (getKP(i).s >= CONFIDENCE_THRESHOLD) confident++;
            }

            // Report tracking quality to the UI (throttled) so the user knows whether
            // the camera can actually see them.
            const nowTrack = Date.now();
            if (nowTrack - lastTrackingPush.value >= TRACKING_PUSH_INTERVAL_MS) {
                lastTrackingPush.value = nowTrack;
                onTracking(confident);
            }

            if (confident < MIN_KEYPOINTS_VISIBLE) {
                onFeedback("Step into frame");
                pendingPhase.value = '';
                pendingFrames.value = 0;
                smoothedAngle.value = -1;
                return;
            }

            const now = Date.now();
            const exercise = selectedExerciseShared.value;

            if (exercise === 'squats') {
                // Get all keypoints needed for squats
                const [shoulderS, hipS, kneeS] = pickBestSide(
                    [KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_KNEE],
                    [KP.RIGHT_SHOULDER, KP.RIGHT_HIP, KP.RIGHT_KNEE]
                );
                const [hipJ, knee, ankle] = pickBestSide(
                    [KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE],
                    [KP.RIGHT_HIP, KP.RIGHT_KNEE, KP.RIGHT_ANKLE]
                );

                // POSTURE CHECK (rotation-invariant): hip angle (shoulder-hip-knee)
                // must be > threshold = torso is upright relative to thigh
                const hipAngle = getAngle(shoulderS, hipS, kneeS);
                if (hipAngle >= 0 && hipAngle < SQUAT_HIP_ANGLE_MIN) {
                    onFeedback("Stand upright");
                    pendingPhase.value = '';
                    pendingFrames.value = 0;
                    smoothedAngle.value = -1;
                    return;
                }

                const rawKnee = getAngle(hipJ, knee, ankle);
                if (rawKnee < 0) {
                    // Can't see the leg reliably — hold state, don't count.
                    onFeedback("Show your legs");
                    return;
                }
                const kneeAngle = smooth(rawKnee);

                if (kneeAngle < SQUAT_DOWN_ANGLE && (currentPhase.value === 'up' || currentPhase.value === 'idle')) {
                    if (trySetPhase('down')) {
                        downEnteredAt.value = now;
                        onFeedback("SQUAT DOWN!");
                    }
                } else if (kneeAngle > SQUAT_UP_ANGLE && currentPhase.value === 'down') {
                    if (trySetPhase('up')) {
                        const dur = now - downEnteredAt.value;
                        if (now - lastActionTime.value > REP_DEBOUNCE_MS && dur >= MIN_REP_DURATION_MS && dur <= MAX_REP_DURATION_MS) {
                            lastActionTime.value = now;
                            onRep('squats');
                        }
                    }
                }
            } else if (exercise === 'pushups') {
                // POSTURE CHECK (rotation-invariant): body alignment (shoulder-hip-ankle)
                // must be > threshold = body is extended/straight (prone position)
                const [shoulderB, hipB, ankleB] = pickBestSide(
                    [KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_ANKLE],
                    [KP.RIGHT_SHOULDER, KP.RIGHT_HIP, KP.RIGHT_ANKLE]
                );
                const bodyAngle = getAngle(shoulderB, hipB, ankleB);
                if (bodyAngle >= 0 && bodyAngle < PUSHUP_BODY_ANGLE_MIN) {
                    onFeedback("Get in pushup position");
                    pendingPhase.value = '';
                    pendingFrames.value = 0;
                    smoothedAngle.value = -1;
                    return;
                }

                const [shoulderJ, elbow, wrist] = pickBestSide(
                    [KP.LEFT_SHOULDER, KP.LEFT_ELBOW, KP.LEFT_WRIST],
                    [KP.RIGHT_SHOULDER, KP.RIGHT_ELBOW, KP.RIGHT_WRIST]
                );
                const rawElbow = getAngle(shoulderJ, elbow, wrist);
                if (rawElbow < 0) {
                    onFeedback("Show your arms");
                    return;
                }
                const elbowAngle = smooth(rawElbow);

                if (elbowAngle < PUSHUP_DOWN_ANGLE && (currentPhase.value === 'up' || currentPhase.value === 'idle')) {
                    if (trySetPhase('down')) {
                        downEnteredAt.value = now;
                        onFeedback("PUSH UP!");
                    }
                } else if (elbowAngle > PUSHUP_UP_ANGLE && currentPhase.value === 'down') {
                    if (trySetPhase('up')) {
                        const dur = now - downEnteredAt.value;
                        if (now - lastActionTime.value > REP_DEBOUNCE_MS && dur >= MIN_REP_DURATION_MS && dur <= MAX_REP_DURATION_MS) {
                            lastActionTime.value = now;
                            onRep('pushups');
                        }
                    }
                }
            } else if (exercise === 'planks') {
                const [shoulderJ, hipJ, ankle] = pickBestSide(
                    [KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_ANKLE],
                    [KP.RIGHT_SHOULDER, KP.RIGHT_HIP, KP.RIGHT_ANKLE]
                );
                const rawBody = getAngle(shoulderJ, hipJ, ankle);
                if (rawBody < 0) {
                    onFeedback("Show your full body");
                    return;
                }
                const bodyAngle = smooth(rawBody);

                if (bodyAngle > PLANK_MIN_ANGLE && bodyAngle < PLANK_MAX_ANGLE) {
                    if (now - lastActionTime.value > PLANK_TICK_MS) {
                        lastActionTime.value = now;
                        onRep('planks');
                        onFeedback("Holding...");
                    }
                } else {
                    onFeedback("Straighten Back!");
                }
            }
        } catch (e) {
            // Silently handle frame processing errors
        }
    }, [plugin, onRep, onFeedback, onTracking]);

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Camera permission required</Text>
                <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
                    <Text style={styles.permButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!device) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>No camera device found</Text>
            </View>
        );
    }

    // Derive a tracking-quality indicator from the confident-keypoint count.
    const trackingColor = trackingQuality >= 10 ? '#22C55E' : trackingQuality >= MIN_KEYPOINTS_VISIBLE ? '#F59E0B' : '#EF4444';
    const trackingLabel = trackingQuality >= 10 ? 'Tracking: Good' : trackingQuality >= MIN_KEYPOINTS_VISIBLE ? 'Move into frame' : "Can't see you";

    return (
        <View style={styles.container}>
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isCameraActive}
                frameProcessor={frameProcessor}
                pixelFormat="yuv"
            />

            <View style={styles.overlay}>
                {modelStatus !== '' && (
                    <View style={styles.modelStatusContainer}>
                        <Text style={styles.modelStatusText}>{modelStatus}</Text>
                    </View>
                )}

                {!showSelector && (
                    <View style={styles.hud}>
                        <Text style={styles.exerciseTitle}>{selectedExercise.toUpperCase()}</Text>
                        <Text style={styles.bigCount}>
                            {selectedExercise === 'planks'
                                ? `${Math.floor(count / 60)}:${(count % 60).toString().padStart(2, '0')}`
                                : count}
                        </Text>
                        <View style={styles.feedbackContainer}>
                            <Text style={styles.feedbackText}>{feedback}</Text>
                        </View>
                        <View style={styles.trackingBar}>
                            <View style={[styles.trackingDot, { backgroundColor: trackingColor }]} />
                            <Text style={styles.trackingText}>{trackingLabel}</Text>
                        </View>
                    </View>
                )}

                {showSelector && (
                    <ScrollView contentContainerStyle={styles.selectorContainer}>
                        <Text style={styles.selectorHeader}>// SELECT PROTOCOL</Text>
                        {['squats', 'pushups', 'planks'].map((ex) => {
                            const isLocked = !isUserPro && userFreeExercise !== ex;
                            return (
                                <TouchableOpacity
                                    key={ex}
                                    style={[styles.card, selectedExercise === ex && styles.cardActive, isLocked && styles.cardLocked]}
                                    onPress={() => {
                                        if (isLocked) {
                                            router.push('/go-pro');
                                        } else {
                                            setSelectedExercise(ex as ExerciseType);
                                        }
                                    }}
                                >
                                    <View style={styles.cardContent}>
                                        <View>
                                            <Text style={styles.cardTitle}>{ex.toUpperCase()}</Text>
                                            <Text style={styles.cardSub}>{ex === 'squats' ? 'LEGS • POWER' : ex === 'pushups' ? 'ARM • STRENGTH' : 'CORE • STABILITY'}</Text>
                                        </View>
                                        {isLocked ? (
                                            <View style={styles.lockedBadge}>
                                                <Crown size={20} color="#FFD700" />
                                                <Text style={styles.lockedBadgeText}>PRO</Text>
                                            </View>
                                        ) :
                                            ex === 'squats' ? <Flame size={40} color="#00D9FF" /> :
                                                ex === 'pushups' ? <Zap size={40} color="#00D9FF" /> :
                                                    <Timer size={40} color="#00D9FF" />}
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                )}

                <TouchableOpacity
                    style={styles.flipButton}
                    onPress={() => setCameraFacing(f => f === 'front' ? 'back' : 'front')}
                >
                    <SwitchCamera size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: isRecording ? '#EF4444' : '#22C55E' }]}
                        onPress={() => {
                            if (isRecording) finishWorkout();
                            else {
                                setCount(0);
                                countRef.current = 0;
                                setTrackingQuality(0);
                                resetDetectionState();
                                setIsRecording(true);
                                setShowSelector(false);
                                setFeedback("GO!");
                            }
                        }}
                    >
                        {isRecording ? <StopCircle color="#fff" size={32} /> : <Play color="#fff" size={32} />}
                        <Text style={styles.mainButtonText}>{isRecording ? 'FINISH' : 'START'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {showConfetti && <ConfettiCannon count={200} origin={{ x: -10, y: 0 }} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    text: { color: 'white', textAlign: 'center', marginTop: 100, fontSize: 16 },
    permButton: { marginTop: 20, alignSelf: 'center', backgroundColor: '#22C55E', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    permButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    overlay: { flex: 1, paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20 },
    modelStatusContainer: { alignItems: 'center', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, alignSelf: 'center' },
    modelStatusText: { color: '#FF9800', fontSize: 14, fontWeight: 'bold' },
    hud: { alignItems: 'center', marginTop: 40 },
    exerciseTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 16, letterSpacing: 2, fontWeight: 'bold' },
    bigCount: { color: '#00D9FF', fontSize: 100, fontWeight: '900', textShadowColor: 'rgba(0,217,255,0.5)', textShadowRadius: 20 },
    feedbackContainer: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 8 },
    feedbackText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    trackingBar: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginTop: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
    trackingDot: { width: 10, height: 10, borderRadius: 5 },
    trackingText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    selectorContainer: { marginTop: 20, gap: 16 },
    selectorHeader: { color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
    card: { backgroundColor: '#12182C', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
    cardActive: { borderColor: '#00D9FF', backgroundColor: 'rgba(0, 217, 255, 0.05)' },
    cardLocked: { opacity: 0.6, borderColor: 'rgba(255, 215, 0, 0.3)' },
    lockedBadge: { alignItems: 'center', gap: 4 },
    lockedBadgeText: { color: '#FFD700', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    cardSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold' },
    flipButton: { position: 'absolute', top: 60, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    controls: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
    mainButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20, paddingHorizontal: 48, borderRadius: 100, elevation: 10 },
    mainButtonText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
});
