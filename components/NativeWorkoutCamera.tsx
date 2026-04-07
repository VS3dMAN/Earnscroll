import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { useTimeBank } from '@/contexts/TimeBank';
import { Flame, Zap, Timer, Play, StopCircle, Lock } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

// --- TYPES ---
type ExerciseType = 'squats' | 'pushups' | 'planks';
type Phase = 'idle' | 'up' | 'down' | 'holding';
type Keypoint = { x: number; y: number; s: number };

const CONFIDENCE_THRESHOLD = 0.3;

// Angle thresholds for each exercise (degrees)
const SQUAT_DOWN_ANGLE = 80;
const SQUAT_UP_ANGLE = 160;
const PUSHUP_DOWN_ANGLE = 90;
const PUSHUP_UP_ANGLE = 160;
const PLANK_MIN_ANGLE = 160;
const PLANK_MAX_ANGLE = 200;

// Debounce durations (ms)
const REP_DEBOUNCE_MS = 500;
const PLANK_TICK_MS = 1000;

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
    const device = useCameraDevice('front');
    const { addMinutes, isUserPro, userFreeExercise, earningRatios, addExerciseToHistory } = useTimeBank();

    // UI State
    const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('squats');
    const [isRecording, setIsRecording] = useState(false);
    const [count, setCount] = useState(0);
    const [feedback, setFeedback] = useState("Ready");
    const [showSelector, setShowSelector] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);

    // AI & Worklets
    const plugin = useTensorflowModel(require('../assets/models/movenet_lightning.tflite'));
    const { resize } = useResizePlugin();
    const currentPhase = useSharedValue<Phase>('idle');
    const lastActionTime = useSharedValue<number>(0);

    useEffect(() => {
        if (!hasPermission) requestPermission();
    }, [hasPermission]);

    // --- LOGIC: Rep Counting (Runs on JS Thread) ---
    const handleRep = (exercise: ExerciseType) => {
        setCount(c => c + 1);

        // For Squats/Pushups, we award minutes immediately
        if (exercise !== 'planks') {
            const earned = isUserPro ? earningRatios[exercise] : 1;
            addMinutes(earned);
            addExerciseToHistory(exercise, 1);
            setFeedback(`${exercise.toUpperCase()} +${earned}m`);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
    };

    const handleFeedbackUpdate = (msg: string) => setFeedback(msg);

    // --- LOGIC: Finish Workout ---
    const finishWorkout = () => {
        setIsRecording(false);

        // Calculate Plank Earnings at end (based on total seconds held)
        if (selectedExercise === 'planks' && count > 0) {
            const plankRatio = isUserPro ? (earningRatios.planks ?? 3) : 3;
            const earned = Math.floor(count / plankRatio);
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

    // --- MATH (Worklet) ---
    const getAngle = (a: Keypoint, b: Keypoint, c: Keypoint): number | null => {
        'worklet';
        if (a.s < CONFIDENCE_THRESHOLD || b.s < CONFIDENCE_THRESHOLD || c.s < CONFIDENCE_THRESHOLD) return null;
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return angle;
    };

    // --- AI FRAME PROCESSOR (Worklet) ---
    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';
        if (plugin.model == null || !isRecording) return;

        try {
            const resized = resize(frame, { scale: { width: 192, height: 192 }, pixelFormat: 'rgb', dataType: 'uint8' });
            const outputs = plugin.model.runSync([resized]);
            const data = outputs[0] as unknown as { [key: number]: number };

            // 17 keypoints * 3 values each = 51 values expected
            const getKP = (i: number): Keypoint => {
                const idx = i * 3;
                return { y: Number(data[idx] ?? 0), x: Number(data[idx + 1] ?? 0), s: Number(data[idx + 2] ?? 0) };
            };
            const now = Date.now();

            if (selectedExercise === 'squats') {
                const hip = getKP(KP.LEFT_HIP);
                const knee = getKP(KP.LEFT_KNEE);
                const ankle = getKP(KP.LEFT_ANKLE);
                const angle = getAngle(hip, knee, ankle);

                if (angle !== null) {
                    if (angle < SQUAT_DOWN_ANGLE && (currentPhase.value === 'up' || currentPhase.value === 'idle')) {
                        currentPhase.value = 'down';
                        runOnJS(handleFeedbackUpdate)("UP!");
                    } else if (angle > SQUAT_UP_ANGLE && currentPhase.value === 'down') {
                        if (now - lastActionTime.value > REP_DEBOUNCE_MS) {
                            currentPhase.value = 'up';
                            lastActionTime.value = now;
                            runOnJS(handleRep)('squats');
                        }
                    }
                }
            }
            else if (selectedExercise === 'pushups') {
                const shoulder = getKP(KP.LEFT_SHOULDER);
                const elbow = getKP(KP.LEFT_ELBOW);
                const wrist = getKP(KP.LEFT_WRIST);
                const angle = getAngle(shoulder, elbow, wrist);

                if (angle !== null) {
                    if (angle < PUSHUP_DOWN_ANGLE && (currentPhase.value === 'up' || currentPhase.value === 'idle')) {
                        currentPhase.value = 'down';
                        runOnJS(handleFeedbackUpdate)("UP!");
                    } else if (angle > PUSHUP_UP_ANGLE && currentPhase.value === 'down') {
                        if (now - lastActionTime.value > REP_DEBOUNCE_MS) {
                            currentPhase.value = 'up';
                            lastActionTime.value = now;
                            runOnJS(handleRep)('pushups');
                        }
                    }
                }
            }
            else if (selectedExercise === 'planks') {
                const shoulder = getKP(KP.LEFT_SHOULDER);
                const hip = getKP(KP.LEFT_HIP);
                const ankle = getKP(KP.LEFT_ANKLE);
                const angle = getAngle(shoulder, hip, ankle);

                if (angle !== null) {
                    if (angle > PLANK_MIN_ANGLE && angle < PLANK_MAX_ANGLE) {
                        if (now - lastActionTime.value > PLANK_TICK_MS) {
                            lastActionTime.value = now;
                            runOnJS(handleRep)('planks');
                        }
                    } else {
                        runOnJS(handleFeedbackUpdate)("Straighten Back!");
                    }
                }
            }
        } catch {
            // Frame processing error — skip this frame silently
        }
    }, [plugin, isRecording, selectedExercise]);

    if (!hasPermission || !device) return <View style={styles.container}><Text style={styles.text}>No Camera</Text></View>;

    return (
        <View style={styles.container}>
            <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} frameProcessor={frameProcessor} pixelFormat="yuv" />

            <View style={styles.overlay}>
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
                                    onPress={() => !isLocked && setSelectedExercise(ex as ExerciseType)}
                                >
                                    <View style={styles.cardContent}>
                                        <View>
                                            <Text style={styles.cardTitle}>{ex.toUpperCase()}</Text>
                                            <Text style={styles.cardSub}>{ex === 'squats' ? 'LEGS • POWER' : ex === 'pushups' ? 'ARM • STRENGTH' : 'CORE • STABILITY'}</Text>
                                        </View>
                                        {isLocked ? <Lock size={32} color="#FFD700" /> :
                                            ex === 'squats' ? <Flame size={40} color="#00D9FF" /> :
                                                ex === 'pushups' ? <Zap size={40} color="#00D9FF" /> :
                                                    <Timer size={40} color="#00D9FF" />}
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                )}

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.mainButton, { backgroundColor: isRecording ? '#EF4444' : '#22C55E' }]}
                        onPress={() => {
                            if (isRecording) finishWorkout();
                            else { setCount(0); currentPhase.value = 'idle'; setIsRecording(true); setShowSelector(false); setFeedback("GO!"); }
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
    text: { color: 'white', textAlign: 'center', marginTop: 100 },
    overlay: { flex: 1, paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20 },
    hud: { alignItems: 'center', marginTop: 40 },
    exerciseTitle: { color: 'rgba(255,255,255,0.5)', fontSize: 16, letterSpacing: 2, fontWeight: 'bold' },
    bigCount: { color: '#00D9FF', fontSize: 100, fontWeight: '900', textShadowColor: 'rgba(0,217,255,0.5)', textShadowRadius: 20 },
    feedbackContainer: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    feedbackText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    selectorContainer: { marginTop: 20, gap: 16 },
    selectorHeader: { color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
    card: { backgroundColor: '#12182C', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
    cardActive: { borderColor: '#00D9FF', backgroundColor: 'rgba(0, 217, 255, 0.05)' },
    cardLocked: { opacity: 0.5 },
    cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    cardSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold' },
    controls: { position: 'absolute', bottom: 50, left: 0, right: 0, alignItems: 'center' },
    mainButton: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20, paddingHorizontal: 48, borderRadius: 100, elevation: 10 },
    mainButtonText: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 }
});