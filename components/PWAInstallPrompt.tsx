import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { X, Download } from 'lucide-react-native';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PROMPT_COOLDOWN_DAYS = 7;
const PROMPT_DELAY_MS = 3000;

const checkIsIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const shouldShowPrompt = (storageKey: string): boolean => {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return true;
  const daysSince = (Date.now() - new Date(stored).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > PROMPT_COOLDOWN_DAYS;
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = checkIsIOS();

    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (shouldShowPrompt('pwa-prompt-dismissed')) {
        setTimeout(() => setShowPrompt(true), PROMPT_DELAY_MS);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIOS && shouldShowPrompt('pwa-prompt-dismissed-ios')) {
      setTimeout(() => setShowPrompt(true), PROMPT_DELAY_MS);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      localStorage.setItem('pwa-prompt-dismissed-ios', new Date().toISOString());
    }
  };

  if (!showPrompt || Platform.OS !== 'web') {
    return null;
  }

  const isIOS = checkIsIOS();

  return (
    <View style={styles.container}>
      <View style={styles.promptCard}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          accessibilityLabel="Dismiss install prompt"
        >
          <X size={20} color="#6B7280" />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <Download size={40} color="#4F46E5" />
        </View>

        <Text style={styles.title}>Install EarnScroll</Text>
        <Text style={styles.description}>
          {isIOS
            ? 'Install this app on your home screen for quick and easy access. Tap the Share button, then "Add to Home Screen".'
            : 'Install EarnScroll on your device for quick access and offline functionality.'
          }
        </Text>

        {!isIOS && deferredPrompt && (
          <TouchableOpacity
            style={styles.installButton}
            onPress={handleInstallClick}
            accessibilityLabel="Install app"
          >
            <Text style={styles.installButtonText}>Install Now</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          accessibilityLabel="Maybe later"
        >
          <Text style={styles.dismissButtonText}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  installButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
  installButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
