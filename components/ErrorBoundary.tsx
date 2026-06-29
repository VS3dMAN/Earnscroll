import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * App-wide error boundary. Without this, a render error in any one screen would
 * crash the entire app to a blank screen. Here we catch it, show a recovery UI,
 * and let the user retry (which re-mounts the subtree).
 *
 * The fallback intentionally uses plain styles (no theme/context) so it still
 * renders even if a context provider is what failed.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              The app hit an unexpected error. Your earned time and history are safe.
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={styles.errorDetail}>{this.state.error.message}</Text>
            )}
            <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.8}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: '#94A3B8', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  errorDetail: { color: '#F87171', fontSize: 12, textAlign: 'center', marginBottom: 24, fontFamily: 'monospace' },
  button: { backgroundColor: '#22C55E', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 100 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
