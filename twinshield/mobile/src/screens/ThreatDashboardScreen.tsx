import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { fetchThreatDashboard } from '../api/client';
import { ScreenLayout } from '../components/ScreenLayout';
import { useLocale } from '../context/LocaleContext';
import { useUser } from '../context/UserContext';
import type { AppNavigation } from '../navigation/types';
import { colors, radii, spacing } from '../theme';

type Props = { navigation: AppNavigation };

export function ThreatDashboardScreen({ navigation: _navigation }: Props) {
  const { userId } = useUser();
  const { locale, t } = useLocale();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchThreatDashboard>> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setData(await fetchThreatDashboard(userId, locale));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, locale]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (!userId) {
    return (
      <ScreenLayout>
        <Text style={styles.muted}>{t.dashboard.guestHint}</Text>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll refreshing={loading} onRefresh={load}>
      <Text style={styles.title}>{t.threats.title}</Text>
      <Text style={styles.sub}>{t.threats.subtitle}</Text>

      {loading && !data ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
      ) : data ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.threats.live}</Text>
            {data.live_session ? (
              <>
                <Text style={styles.meta}>{data.live_session.device}</Text>
                <Text style={styles.small}>{data.live_session.last_ping}</Text>
              </>
            ) : (
              <Text style={styles.muted}>{t.threats.noLive}</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.threats.stats}</Text>
            <Text style={styles.meta}>
              {t.threats.avgRisk}: {data.stats.avg_risk_recent}
            </Text>
            <Text style={styles.meta}>
              {t.threats.highCount}: {data.stats.high_risk_events_recent}
            </Text>
            <Text style={styles.meta}>
              {t.threats.checks}: {data.stats.checks_recorded}
            </Text>
          </View>

          <Text style={styles.section}>Log</Text>
          {data.events.length === 0 ? (
            <Text style={styles.muted}>{t.threats.noEvents}</Text>
          ) : (
            data.events.map((e) => (
              <View key={e.id} style={styles.event}>
                <Text style={styles.eventScore}>{e.risk_score}%</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventStatus}>{e.status}</Text>
                  <Text style={styles.eventSum} numberOfLines={2}>
                    {e.summary}
                  </Text>
                  <Text style={styles.small}>{e.created_at}</Text>
                </View>
              </View>
            ))
          )}
        </>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  sub: { color: colors.textMuted, marginTop: 6, marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 12, fontWeight: '800', color: colors.textMuted, marginBottom: 8 },
  meta: { fontSize: 15, color: colors.text, marginBottom: 4 },
  small: { fontSize: 11, color: colors.textMuted },
  muted: { color: colors.textMuted, marginTop: 8 },
  section: { fontSize: 16, fontWeight: '800', marginBottom: 8, color: colors.text },
  event: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: radii.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventScore: { fontSize: 18, fontWeight: '900', color: colors.primaryDark, minWidth: 44 },
  eventStatus: { fontWeight: '700', color: colors.text },
  eventSum: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
