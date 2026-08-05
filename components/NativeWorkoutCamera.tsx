import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, AppState } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Camera, runAtTargetFps, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel, type TensorflowModelDelegate } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, Worklets } from 'react-native-worklets-core';
import { useTimeBank } from '@/contexts/TimeBank';
import { useAnalytics } from '@/contexts/Analytics';
import { Flame, Zap, Timer, Play, StopCircle, Lock, SwitchCamera, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import PoseSkeletonOverlay from '@/components/PoseSkeletonOverlay';
import {
    KP,
    POSE_FLOAT_COUNT,
    bestSideAngle,
    countConfidentKeypoints,
} from '@/utils/poseMath';
import {
    POSE_BUFFER_LENGTH,
    POSE_IDX_FRAME_H,
    POSE_IDX_FRAME_W,
    POSE_IDX_KEYPOINTS,
    POSE_IDX_ROTATION,
    POSE_IDX_TIMESTAMP,
    POSE_IDX_VALID,
    rotationForOrientation,
} from '@/utils/poseProjection';

// --- TYPES ---
type ExerciseType = 'squats' | 'pushups' | 'planks';
type Phase = 'idle' | 'up' | 'down' | 'holding';

// Require this many confident keypoints overall before we believe a person is in frame.
const MIN_KEYPOINTS_VISIBLE = 6;

// MoveNet SinglePose Thunder takes a 256x256 uint8 input (Lightning was 192x192).
const MODEL_INPUT_SIZE = 256;

// Thunder is ~2-3x the per-frame cost of Lightning, so run inference well below the
// camera's framerate rather than on every frame. Rep detection needs far less than
// 30fps: PHASE_CONFIRM_FRAMES = 2 is still a ~133ms confirmation window at 15fps, and
// MIN_REP_DURATION_MS = 400 is ~6 inference frames, so neither needed retuning.
const INFERENCE_TARGET_FPS = 15;

// CPU. The `android-gpu` delegate needs the react-native-fast-tflite Expo config
// plugin with `enableAndroidGpuLibraries`, which this app does not currently declare
// in app.json — without it the OpenCL libs aren't in the APK and the delegate can't
// load. See the model-load effect below, which validates whatever delegate is set.
const INFERENCE_DELEGATE: TensorflowModelDelegate = 'default';

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
//
// Raised from 0.5 with the Thunder swap. Alpha is a per-*sample* weight, so dropping
// the sample rate to INFERENCE_TARGET_FPS doubles the wall-clock lag it introduces:
// 0.5 was ~66ms of lag at 30fps but ~133ms at 15fps. Thunder is also less jittery than
// Lightning, so there is less noise left to suppress. 0.7 restores roughly the original
// ~95ms response. PHASE_CONFIRM_FRAMES still guards against single-frame flickers.
const ANGLE_EMA_ALPHA = 0.7;

// Throttle how often the worklet reports tracking quality back to the JS UI (~12fps).
const TRACKING_PUSH_INTERVAL_MS = 80;

export default function NativeWorkoutCamera() {
    const { hasPermission, requestPermission } = useCameraPermission();
    const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
    const device = useCameraDevice(cameraFacing);
    const { addMinutes, isUserPro, userFreeExercise, earningRatios, addExerciseToHistory } = useTimeBank();
    const { trackEvent, log } = useAnalytics();
    const router = useRouter();
    const workoutStartTime = useRef<number>(0);

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
    const plugin = useTensorflowModel(require('../assets/models/movenet_thunder.tflite'), INFERENCE_DELEGATE);
    const { resize } = useResizePlugin();
    // Latest keypoints, published every inference frame for the skeleton overlay.
    // Read on the UI thread by PoseSkeletonOverlay — never crosses to the JS thread.
    const poseBuffer = useSharedValue<number[]>(new Array(POSE_BUFFER_LENGTH).fill(0));
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
            log('error', 'tflite_model_load_failed', { camera_facing: cameraFacing });
        } else if (plugin.state === 'loaded' && plugin.model) {
            setModelStatus('');
            const model = plugin.model;
            console.log('✓ TFLite model loaded successfully');
            console.log('  Delegate:', model.delegate);
            console.log('  Inputs:', JSON.stringify(model.inputs?.map(t => ({ name: t.name, shape: t.shape, dataType: t.dataType }))));
            console.log('  Outputs:', JSON.stringify(model.outputs?.map(t => ({ name: t.name, shape: t.shape, dataType: t.dataType }))));

            // Verify the swapped-in model is shaped the way the frame processor assumes:
            // 256x256x3 uint8 in, [1, 1, 17, 3] (y, x, score) out. A mismatch here means
            // the wrong .tflite got bundled, so fail loudly rather than silently mis-index.
            const input = model.inputs?.[0];
            const output = model.outputs?.[0];
            const inputOk = input?.shape?.join('x') === `1x${MODEL_INPUT_SIZE}x${MODEL_INPUT_SIZE}x3`;
            const outputOk = output?.shape?.join('x') === '1x1x17x3';
            if (!inputOk || !outputOk) {
                console.warn(`✗ Unexpected model tensor shapes — in: ${input?.shape}, out: ${output?.shape}`);
                setModelStatus('AI model shape mismatch');
                log('error', 'tflite_model_shape_unexpected', {
                    input_shape: String(input?.shape),
                    output_shape: String(output?.shape),
                });
                return;
            }

            // One-shot sanity inference on a blank frame. This is what catches a
            // delegate that loads fine but emits empty/NaN output — the failure mode
            // GPU/NNAPI delegates hit on models they don't fully support.
            try {
                const probe = model.runSync([new Uint8Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3)])[0];
                let finite = 0;
                for (let i = 0; i < POSE_FLOAT_COUNT; i++) {
                    if (Number.isFinite(Number(probe?.[i]))) finite++;
                }
                if (finite < POSE_FLOAT_COUNT) {
                    console.warn(`✗ Delegate "${model.delegate}" produced non-finite output (${finite}/${POSE_FLOAT_COUNT} usable) — switch INFERENCE_DELEGATE back to 'default'.`);
                    log('error', 'tflite_delegate_bad_output', { delegate: model.delegate, finite_values: finite });
                } else {
                    console.log(`  Sanity inference OK on "${model.delegate}" (${finite}/${POSE_FLOAT_COUNT} finite outputs)`);
                }
            } catch (e) {
                console.warn('✗ Sanity inference threw:', e);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plugin.state, plugin.model]);

    // We deliberately do NOT auto-request the camera permission on mount.
    // Google's Privacy & Data policy expects a pre-permission disclosure
    // before the OS dialog is shown. Permission is requested only when the
    // user taps "Use camera" on the pre-permission card below.

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
        const durationSeconds = Math.round((Date.now() - workoutStartTime.current) / 1000);
        trackEvent('workout_completed', {
            exercise: selectedExercise,
            rep_count: count,
            duration_seconds: durationSeconds,
        });

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
        const model = plugin.model;
        if (model == null) return;

        // Throttle inference to INFERENCE_TARGET_FPS. Everything below — including the
        // overlay publish — runs at that rate, not the camera's framerate.
        try {
            runAtTargetFps(INFERENCE_TARGET_FPS, () => {
                'worklet';
                // Center-crop the frame to a square BEFORE scaling to 256x256. MoveNet
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
                    scale: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE },
                    pixelFormat: 'rgb',
                    dataType: 'uint8',
                });
                const outputs = model.runSync([resized]);
                const raw = outputs[0];
                if (!raw || raw.length < POSE_FLOAT_COUNT) return;

                // MoveNet Thunder: output shape [1, 1, 17, 3] flattened to 51 floats.
                // Each keypoint: [y, x, confidence_score] — identical layout to
                // Lightning, so every index and threshold below is unchanged.

                // --- Publish keypoints for the skeleton overlay. ---
                // Deliberately outside the isRecording gate: the overlay must be live
                // before START so the user can frame themselves. This writes to a
                // shared value read on the UI thread, and never touches rep state.
                const payload = new Array<number>(POSE_BUFFER_LENGTH);
                payload[POSE_IDX_TIMESTAMP] = frame.timestamp;
                payload[POSE_IDX_FRAME_W] = fw;
                payload[POSE_IDX_FRAME_H] = fh;
                payload[POSE_IDX_ROTATION] = rotationForOrientation(frame.orientation);
                payload[POSE_IDX_VALID] = 1;
                for (let i = 0; i < POSE_FLOAT_COUNT; i++) {
                    payload[POSE_IDX_KEYPOINTS + i] = Number(raw[i] ?? 0);
                }
                poseBuffer.value = payload;

                // --- Everything below is rep counting; only runs while recording. ---
                if (!isRecordingShared.value) return;

                // Exponential moving average on the rep-driving angle. Invalid (-1)
                // readings don't pollute the average; the last good value is kept.
                // Stays in the closure (unlike the pure helpers in utils/poseMath)
                // because it reads and writes worklet shared state.
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
                // Reads scores straight out of the flat output — no object per keypoint.
                const confident = countConfidentKeypoints(raw);

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
                    // POSTURE CHECK (rotation-invariant): hip angle (shoulder-hip-knee)
                    // must be > threshold = torso is upright relative to thigh
                    const hipAngle = bestSideAngle(
                        raw,
                        KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_KNEE,
                        KP.RIGHT_SHOULDER, KP.RIGHT_HIP, KP.RIGHT_KNEE,
                    );
                    if (hipAngle >= 0 && hipAngle < SQUAT_HIP_ANGLE_MIN) {
                        onFeedback("Stand upright");
                        pendingPhase.value = '';
                        pendingFrames.value = 0;
                        smoothedAngle.value = -1;
                        return;
                    }

                    const rawKnee = bestSideAngle(
                        raw,
                        KP.LEFT_HIP, KP.LEFT_KNEE, KP.LEFT_ANKLE,
                        KP.RIGHT_HIP, KP.RIGHT_KNEE, KP.RIGHT_ANKLE,
                    );
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
                    const bodyAngle = bestSideAngle(
                        raw,
                        KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_ANKLE,
                        KP.RIGHT_SHOULDER, KP.RIGHT_HIP, KP.RIGHT_ANKLE,
                    );
                    if (bodyAngle >= 0 && bodyAngle < PUSHUP_BODY_ANGLE_MIN) {
                        onFeedback("Get in pushup position");
                        pendingPhase.value = '';
                        pendingFrames.value = 0;
                        smoothedAngle.value = -1;
                        return;
                    }

                    const rawElbow = bestSideAngle(
                        raw,
                        KP.LEFT_SHOULDER, KP.LEFT_ELBOW, KP.LEFT_WRIST,
                        KP.RIGHT_SHOULDER, KP.RIGHT_ELBOW, KP.RIGHT_WRIST,
                    );
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
                    const rawBody = bestSideAngle(
                        raw,
                        KP.LEFT_SHOULDER, KP.LEFT_HIP, KP.LEFT_ANKLE,
                        KP.RIGHT_SHOULDER, KP.RIGHT_HIP, KP.RIGHT_ANKLE,
                    );
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
            });
        } catch (e) {
            // Silently handle frame processing errors
        }
    }, [plugin, onRep, onFeedback, onTracking]);

    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <View style={styles.prePermCard}>
                    <Text style={styles.prePermTitle}>Use camera to count reps</Text>
                    <Text style={styles.prePermBody}>
                        EarnScroll uses your camera to count your reps in real time. Frames are processed on-device only — nothing is uploaded, saved, or shared.
                    </Text>
                    <View style={styles.prePermActions}>
                        <TouchableOpacity
                            style={styles.prePermSecondary}
                            onPress={() => router.replace('/(tabs)')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.prePermSecondaryText}>Not now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.permButton}
                            onPress={requestPermission}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.permButtonText}>Use camera</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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

            {/* Live skeleton. Sits directly on the preview and is driven entirely from
                the UI thread, so it stays smooth regardless of JS-thread load. */}
            <PoseSkeletonOverlay pose={poseBuffer} mirrored={cameraFacing === 'front'} />

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
                        <Text style={styles.selectorHeader}>{'// SELECT PROTOCOL'}</Text>
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
                                workoutStartTime.current = Date.now();
                                trackEvent('workout_started', { exercise: selectedExercise });
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
    permButton: { backgroundColor: '#22C55E', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, flex: 1.2, alignItems: 'center' },
    permButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    prePermCard: { marginTop: 80, marginHorizontal: 20, padding: 24, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    prePermTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    prePermBody: { color: 'rgba(255,255,255,0.75)', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 24 },
    prePermActions: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
    prePermSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center' },
    prePermSecondaryText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
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
