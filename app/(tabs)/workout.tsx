import React, { Suspense } from 'react';
import { StyleSheet, View, Text, Platform, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { useTimeBank } from '@/contexts/TimeBank';

const isExpoGo = Constants.appOwnership === 'expo';

const NativeWorkoutCamera = isExpoGo
    ? null
    : React.lazy(() => import('@/components/NativeWorkoutCamera'));

function ExpoGoFallback() {
    return (
        <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackTitle}>Camera Workout</Text>
            <Text style={styles.fallbackText}>
                The AI-powered workout camera requires a development build.
            </Text>
            <Text style={styles.fallbackHint}>
                Run "npx expo run:android" or "npx expo run:ios" to use this feature.
            </Text>
        </View>
    );
}

export default function WorkoutScreen() {
    const { isUserPro } = useTimeBank();

    if (isExpoGo || !NativeWorkoutCamera) {
        return (
            <View style={styles.container}>
                <ExpoGoFallback />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Suspense fallback={<ActivityIndicator color="#00D9FF" size="large" style={styles.loader} />}>
                <NativeWorkoutCamera />
            </Suspense>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    fallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    fallbackTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    fallbackText: {
        color: '#ccc',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 12,
    },
    fallbackHint: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        fontFamily: Platform.select({ android: 'monospace', ios: 'Courier', default: 'monospace' }),
    },
    loader: {
        flex: 1,
    },
});
