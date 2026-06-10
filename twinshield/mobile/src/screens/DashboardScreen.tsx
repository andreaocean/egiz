import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import {
  API_URL,
  addTrustedDevice,
  checkHealth,
  fetchProfile,
  sendHeartbeat,
} from '../api/client';
import { LanguagePicker } from '../components/LanguagePicker';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenLayout } from '../components/ScreenLayout';
import { useLocale } from '../context/LocaleContext';
import { useUser } from '../context/UserContext';
import type { AppNavigation } from '../navigation/types';
import { colors, radii, spacing } from '../theme';
import type { UserProfile } from '../types';

type Props = { navigation: AppNavigation };

export function DashboardScreen({ navigation }: Props) {
  const { userId, email, clearUser } = useUser();
  const { locale, t, tf } = useLocale();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await checkHealth();
      setApiOk(true);
      if (userId) {
        setProfile(await fetchProfile(userId, locale));
      } else {
        setProfile(null);
      }
    } catch {
      setApiOk(false);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId, locale]);

  useEffect(() => {
    load();
  }, [load]);

  const samples = profile?.samples ?? 0;
  const minSamples = profile?.min_samples ?? 3;
  const deviceLabel = Platform.OS === 'ios' ? 'iOS' : 'Android';
  const hb = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;
    const ping = () => {
      sendHeartbeat(userId, deviceLabel, locale).catch(() => {});
    };
    ping();
    hb.current = setInterval(ping, 15000);
    return () => {
      if (hb.current) clearInterval(hb.current);
    };
  }, [userId, deviceLabel, locale]);

  const trustDevice = async () => {
    if (!userId) return;
    try {
      await addTrustedDevice(userId, deviceLabel, locale);
      Alert.alert(t.common.ok, deviceLabel);
      load();
    } catch (e) {
      Alert.alert(t.common.error, e instanceof Error ? e.message : '');
    }
  };

  return (
    <ScreenLayout scroll style={styles.scroll} refreshing={loading} onRefresh={load}>
      <LanguagePicker />

      <View style={styles.hero}>
        <Text style={styles.badge}>{t.dashboard.badge}</Text>
        <Text style={styles.title}>{t.brand}</Text>
        <Text style={styles.sub}>{t.dashboard.subtitle}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.dashboard.network}</Text>
        <Text style={styles.apiLine}>{API_URL}</Text>
        <View style={[styles.pill, apiOk === true && styles.pillOk, apiOk === false && styles.pillBad]}>
          {loading && apiOk === null ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.pillText}>
              {apiOk === true
                ? t.dashboard.backendOnline
                : apiOk === false
                  ? t.dashboard.backendOffline
                  : t.dashboard.checking}
            </Text>
          )}
        </View>
        {apiOk === false && !loading ? (
          <Text style={styles.setupHint}>{t.dashboard.setupHint}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.dashboard.profile}</Text>
        {userId ? (
          <>
            <Text style={styles.meta}>ID: {userId}</Text>
            <Text style={styles.meta}>{email}</Text>
            <ProgressBar
              current={samples}
              target={minSamples}
              label={t.dashboard.trainingProgress}
              samplesLabel={t.common.samples}
            />
            {profile?.ready_for_check ? (
              <Text style={styles.ready}>{t.dashboard.ready}</Text>
            ) : (
              <Text style={styles.hint}>
                {tf(t.dashboard.sessionsNeeded, { count: Math.max(0, minSamples - samples) })}
              </Text>
            )}
            <PrimaryButton
              title={t.dashboard.signOut}
              variant="secondary"
              onPress={() => clearUser().then(load)}
            />
          </>
        ) : (
          <Text style={styles.hint}>{t.dashboard.guestHint}</Text>
        )}
      </View>

      <PrimaryButton title={t.dashboard.signUpIn} onPress={() => navigation.navigate('Register')} />
      <PrimaryButton
        title={t.dashboard.trainProfile}
        variant="success"
        onPress={() => navigation.navigate('Training')}
        disabled={!userId}
      />
      <PrimaryButton
        title={t.dashboard.checkRisk}
        variant="primary"
        onPress={() => navigation.navigate('Check')}
        disabled={!userId}
      />
      <PrimaryButton
        title={t.dashboard.threatDashboard}
        variant="secondary"
        onPress={() => navigation.navigate('Threats')}
        disabled={!userId}
      />
      <PrimaryButton
        title={t.dashboard.trustDevice}
        variant="secondary"
        onPress={trustDevice}
        disabled={!userId}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.md },
  hero: {
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  badge: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textOnDark,
    marginTop: 6,
  },
  sub: {
    fontSize: 15,
    color: '#cbd5e1',
    marginTop: 8,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  apiLine: { fontSize: 12, color: colors.primary, marginBottom: 8 },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    backgroundColor: '#f1f5f9',
  },
  pillOk: { backgroundColor: '#dcfce7' },
  pillBad: { backgroundColor: '#fee2e2' },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.text },
  setupHint: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: '#b45309',
  },
  meta: { fontSize: 15, color: colors.text, marginBottom: 4 },
  hint: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  ready: { fontSize: 14, color: colors.success, fontWeight: '700', marginTop: 8 },
});
