import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, LayoutChangeEvent, StyleSheet, Text, TextInput, TouchableOpacity, View, NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/Theme';
import { AppWindow } from 'lucide-react-native';

const EarnScrollModule = Platform.OS !== 'web' ? NativeModules.EarnScrollModule : null;

// Mirror of the native `blocked_packages` list. Native (EncryptedSharedPreferences)
// is the source of truth; this AsyncStorage copy is a fallback so the UI can paint
// the correct toggle states immediately on mount even if the native read is slow.
const BLOCKED_PACKAGES_KEY = '@blocked_packages';

type InstalledApp = {
  label: string;
  package: string;
};

type RenderItemProps = {
  item: InstalledApp;
};

function normalizeQuery(text: string): string {
  return text.trim().toLowerCase();
}

export default function TargetsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [lockedTargets, setLockedTargets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutSize, setLayoutSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const isDark = theme?.isDark ?? false;

  const accent = isDark ? '#22D3EE' : '#00AACC';
  const backgroundColor = isDark ? theme.background : '#F0F0F0';
  const cardBg = isDark ? '#0F1626' : '#FFFFFF';
  const primaryText = isDark ? (theme?.text ?? '#F5F7FB') : '#333333';
  const labelColor = isDark ? (theme?.textSecondary ?? 'rgba(245, 247, 251, 0.72)') : 'rgba(51, 51, 51, 0.66)';
  const searchBorder = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(51, 51, 51, 0.55)';
  const searchBg = isDark ? 'rgba(0, 0, 0, 0.35)' : '#FFFFFF';
  const searchText = primaryText;
  const rowShadowColor = isDark ? 'transparent' : 'rgba(2, 6, 23, 0.12)';

  // Load Installed Apps
  useEffect(() => {
    async function loadApps() {
      if (EarnScrollModule?.getInstalledApps) {
        try {
          const apps: InstalledApp[] = await EarnScrollModule.getInstalledApps();
          // Sort alphabetically
          apps.sort((a, b) => a.label.localeCompare(b.label));
          setInstalledApps(apps);
        } catch (e) {
          console.error('Failed to load apps', e);
        }
      }
    }
    loadApps();
  }, []);

  // Hydrate the currently-blocked list on mount. Without this, lockedTargets starts
  // empty and the first toggle would overwrite the native blocklist with a single
  // entry — silently un-blocking everything else. Native is the source of truth;
  // AsyncStorage is the fallback for first paint.
  useEffect(() => {
    let cancelled = false;
    async function hydrateBlocked() {
      let blocked: string[] | null = null;

      if (EarnScrollModule?.getBlockedPackages) {
        try {
          const native: string[] = await EarnScrollModule.getBlockedPackages();
          if (Array.isArray(native)) blocked = native;
        } catch (e) {
          console.error('Failed to read native blocked packages', e);
        }
      }

      if (blocked === null) {
        try {
          const stored = await AsyncStorage.getItem(BLOCKED_PACKAGES_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.every((p) => typeof p === 'string')) {
              blocked = parsed;
            }
          }
        } catch {
          // Corrupt/missing fallback — leave as empty.
        }
      }

      if (!cancelled && blocked !== null) {
        setLockedTargets(blocked);
      }
    }
    hydrateBlocked();
    return () => {
      cancelled = true;
    };
  }, []);

  // Update Native Blocker
  const updateNativeBlocker = useCallback((currentLockedTargets: string[]) => {
    // SIMPLIFIED: Send simple array of strings ["com.foo", "com.bar"]
    const jsonPayload = JSON.stringify(currentLockedTargets);
    if (EarnScrollModule?.setBlockedPackages) {
      EarnScrollModule.setBlockedPackages(jsonPayload);
      console.log("Sent blocklist to Native Loop:", jsonPayload);
    }
    // Persist a fallback copy so the UI can rehydrate on next launch.
    AsyncStorage.setItem(BLOCKED_PACKAGES_KEY, jsonPayload).catch(() => {});
  }, []);

  const onRootLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      setLayoutSize({ width, height });
    },
    []
  );

  const toggleTarget = useCallback(async (pkg: string) => {
    const isCurrentlyLocked = lockedTargets.includes(pkg);

    // When blocking (not unblocking), check if accessibility service is enabled
    if (!isCurrentlyLocked && Platform.OS === 'android' && EarnScrollModule?.isAccessibilityServiceEnabled) {
      try {
        const enabled = await EarnScrollModule.isAccessibilityServiceEnabled();
        if (!enabled) {
          Alert.alert(
            'Enable App Blocker',
            'EarnScroll needs accessibility access to block distracting apps when your time runs out. Please enable "EarnScroll" in the next screen.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => EarnScrollModule.openAccessibilitySettings(),
              },
            ]
          );
          return; // Don't toggle until permission is granted
        }
      } catch {
        // Native module error, proceed with toggle
      }
    }

    setLockedTargets((prev) => {
      const next = isCurrentlyLocked ? prev.filter((p) => p !== pkg) : [...prev, pkg];
      console.log("TOGGLE: " + pkg + " | New List: " + JSON.stringify(next));
      updateNativeBlocker(next);
      return next;
    });
  }, [updateNativeBlocker, lockedTargets]);

  const data = useMemo(() => {
    const q = normalizeQuery(searchQuery);
    if (!q) return installedApps;
    return installedApps.filter((app) => app.label.toLowerCase().includes(q));
  }, [searchQuery, installedApps]);

  const renderItem = useCallback(
    ({ item }: RenderItemProps) => {
      const isLocked = lockedTargets.includes(item.package);

      return (
        <View style={styles.rowWrap} testID={`target-row-${item.package}`}>
          <LinearGradient
            colors={
              isDark
                ? isLocked
                  ? ['rgba(34, 211, 238, 0.16)', 'rgba(15, 22, 38, 0.92)']
                  : ['rgba(255, 255, 255, 0.06)', 'rgba(15, 22, 38, 0.90)']
                : isLocked
                  ? ['rgba(0, 170, 204, 0.16)', '#FFFFFF']
                  : ['rgba(0, 170, 204, 0.06)', '#FFFFFF']
            }
            style={[
              styles.rowCard,
              {
                backgroundColor: cardBg,
                borderColor: isLocked
                  ? isDark
                    ? 'rgba(34, 211, 238, 0.55)'
                    : 'rgba(0, 170, 204, 0.45)'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'rgba(51, 51, 51, 0.10)',
              },
              !isDark
                ? {
                  shadowColor: rowShadowColor,
                  shadowOpacity: 1,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 2,
                }
                : null,
            ]}
          >
            <View style={styles.left}>
              <View
                style={[
                  styles.iconHalo,
                  {
                    backgroundColor: isLocked
                      ? isDark
                        ? 'rgba(34, 211, 238, 0.16)'
                        : 'rgba(0, 170, 204, 0.14)'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.07)'
                        : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              >
                {/* Using generic AppWindow icon as requested */}
                <AppWindow size={24} color={isLocked ? accent : labelColor} />
              </View>
              <View style={styles.textBlock}>
                <Text style={[styles.appName, { color: primaryText }]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.appMeta, { color: labelColor }]} numberOfLines={1}>
                  {isLocked ? 'Target acquired' : 'Awaiting designation'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => toggleTarget(item.package)}
              activeOpacity={0.85}
              style={[
                styles.toggle,
                isLocked
                  ? { backgroundColor: accent }
                  : isDark
                    ? { backgroundColor: 'rgba(255, 255, 255, 0.10)' }
                    : { backgroundColor: 'rgba(51, 51, 51, 0.10)' },
              ]}
              accessibilityRole="switch"
              accessibilityState={{ checked: isLocked }}
              testID={`target-toggle-${item.package}`}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: isLocked
                      ? '#FFFFFF'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.62)'
                        : 'rgba(51, 51, 51, 0.62)',
                  },
                ]}
              >
                {isLocked ? 'BLOCK' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      );
    },
    [accent, cardBg, isDark, labelColor, lockedTargets, primaryText, rowShadowColor, toggleTarget]
  );

  return (
    <View
      onLayout={onRootLayout}
      style={[
        styles.screen,
        {
          backgroundColor,
          paddingTop: insets.top + 28,
          paddingBottom: 16,
        },
      ]}
      testID="targets-screen"
    >
      {!isDark ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="targets-blueprint-bg">
          <LinearGradient
            colors={['rgba(0, 170, 204, 0.10)', 'rgba(240, 240, 240, 0.0)', 'rgba(0, 170, 204, 0.06)']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          {Array.from({ length: Math.floor(layoutSize.width / 28) }, (_, i) => {
            const x = (i + 1) * 28;
            const isMajor = (i + 1) % 5 === 0;
            return (
              <View
                key={`v-${x}`}
                style={[
                  styles.blueprintLineV,
                  isMajor ? styles.blueprintLineMajor : styles.blueprintLineMinor,
                  { left: x },
                ]}
              />
            );
          })}

          {Array.from({ length: Math.floor(layoutSize.height / 28) }, (_, i) => {
            const y = (i + 1) * 28;
            const isMajor = (i + 1) % 5 === 0;
            return (
              <View
                key={`h-${y}`}
                style={[
                  styles.blueprintLineH,
                  isMajor ? styles.blueprintLineMajor : styles.blueprintLineMinor,
                  { top: y },
                ]}
              />
            );
          })}

          <View style={styles.blueprintCornerTL} />
          <View style={styles.blueprintCornerTR} />
          <View style={styles.blueprintCornerBL} />
          <View style={styles.blueprintCornerBR} />
        </View>
      ) : null}

      <View style={styles.headerBlock}>
        <Text style={[styles.headerEyebrow, { color: primaryText }]}>{'// DESIGNATE TARGETS'}</Text>

        <View style={[styles.searchWrap, { borderColor: searchBorder, backgroundColor: searchBg }]}>

          <Text style={[styles.searchPrompt, { color: accent }]}>›</Text>
          <TextInput
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
            }}
            placeholder="> SEARCH_APPS_HERE"
            placeholderTextColor={accent}
            autoCorrect={false}
            autoCapitalize="none"
            style={[styles.searchInput, { color: searchText }]}
            selectionColor={accent}
            testID="targets-search"
          />
        </View>

        <Text style={[styles.headerSubtitle, { color: labelColor }]}>Lock onto distractions. Flip the switch to block.</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.package}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        testID="targets-list"
        ListEmptyComponent={
          <Text style={{ color: labelColor, textAlign: 'center', marginTop: 20 }}>
            {Platform.OS === 'web'
              ? "App blocking is only available on Android"
              : installedApps.length === 0
                ? "Loading apps..."
                : "No apps found"}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 18,
  },
  blueprintLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  blueprintLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  blueprintLineMinor: {
    backgroundColor: 'rgba(0, 170, 204, 0.07)',
  },
  blueprintLineMajor: {
    backgroundColor: 'rgba(0, 170, 204, 0.14)',
  },
  blueprintCornerTL: {
    position: 'absolute',
    left: 18,
    top: 18,
    width: 18,
    height: 18,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: 'rgba(0, 170, 204, 0.35)',
    borderTopLeftRadius: 10,
  },
  blueprintCornerTR: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: 18,
    height: 18,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: 'rgba(0, 170, 204, 0.35)',
    borderTopRightRadius: 10,
  },
  blueprintCornerBL: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    width: 18,
    height: 18,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(0, 170, 204, 0.35)',
    borderBottomLeftRadius: 10,
  },
  blueprintCornerBR: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 18,
    height: 18,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(0, 170, 204, 0.35)',
    borderBottomRightRadius: 10,
  },
  headerBlock: {
    marginBottom: 16,
  },
  headerEyebrow: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: 18,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginTop: 12,
  },
  searchWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchPrompt: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 13,
    padding: 0,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 6,
  },
  rowWrap: {
    marginBottom: 12,
  },
  rowCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  iconHalo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
  },
  appName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  appMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 3,
  },
  toggle: {
    height: 32,
    minWidth: 84,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  toggleText: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: 11,
    letterSpacing: 1.1,
  },
});
