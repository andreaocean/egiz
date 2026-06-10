import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LocaleProvider, useLocale } from './src/context/LocaleContext';
import { UserProvider, useUser } from './src/context/UserContext';
import type { AppNavigation, ScreenName } from './src/navigation/types';
import { CheckScreen } from './src/screens/CheckScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { ThreatDashboardScreen } from './src/screens/ThreatDashboardScreen';
import { TrainingScreen } from './src/screens/TrainingScreen';
import { colors } from './src/theme';
import type { CheckResponse } from './src/types';

function AppShell() {
  const { ready: userReady } = useUser();
  const { ready: localeReady, t } = useLocale();
  const [screen, setScreen] = useState<ScreenName>('Dashboard');
  const [history, setHistory] = useState<ScreenName[]>([]);
  const [result, setResult] = useState<CheckResponse | null>(null);

  const navTitles: Record<ScreenName, string> = {
    Dashboard: t.nav.dashboard,
    Register: t.nav.register,
    Training: t.nav.training,
    Check: t.nav.check,
    Result: t.nav.result,
    Threats: t.nav.threats,
  };

  const navigation: AppNavigation = useMemo(
    () => ({
      navigate: (name, params) => {
        if (params?.result) {
          setResult(params.result);
        }
        setScreen((current) => {
          if (current !== name) {
            setHistory((h) => [...h, current]);
          }
          return name;
        });
      },
      goBack: () => {
        setHistory((h) => {
          const prev = h[h.length - 1] ?? 'Dashboard';
          setScreen(prev);
          return h.slice(0, -1);
        });
      },
      goHome: () => {
        setScreen('Dashboard');
        setHistory([]);
        setResult(null);
      },
      canGoBack: history.length > 0,
    }),
    [history],
  );

  if (!userReady || !localeReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />
        <View style={styles.header}>
          {navigation.canGoBack ? (
            <Pressable onPress={navigation.goBack} hitSlop={12}>
              <Text style={styles.back}>{t.nav.back}</Text>
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.headerTitle}>{navTitles[screen]}</Text>
          <View style={styles.backPlaceholder} />
        </View>
        <View style={styles.body}>
          {screen === 'Dashboard' && <DashboardScreen navigation={navigation} />}
          {screen === 'Register' && <RegisterScreen navigation={navigation} />}
          {screen === 'Training' && <TrainingScreen navigation={navigation} />}
          {screen === 'Check' && <CheckScreen navigation={navigation} />}
          {screen === 'Threats' && <ThreatDashboardScreen navigation={navigation} />}
          {screen === 'Result' && result && (
            <ResultScreen navigation={navigation} result={result} />
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <UserProvider>
        <AppShell />
      </UserProvider>
    </LocaleProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.bg,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textOnDark,
  },
  back: { color: '#93c5fd', fontWeight: '600', fontSize: 15, width: 72 },
  backPlaceholder: { width: 72 },
  body: { flex: 1, backgroundColor: colors.surface },
});
