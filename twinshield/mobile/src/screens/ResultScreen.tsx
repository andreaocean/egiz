import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { translateAction, translateReason, translateRiskStatus } from '../i18n';
import { PrimaryButton } from '../components/PrimaryButton';
import { RiskMeter } from '../components/RiskMeter';
import { ScreenLayout } from '../components/ScreenLayout';
import { TwinCompareBars } from '../components/TwinCompareBars';
import { useLocale } from '../context/LocaleContext';
import type { AppNavigation } from '../navigation/types';
import { colors, radii, spacing } from '../theme';
import type { CheckResponse } from '../types';

type Props = { navigation: AppNavigation; result: CheckResponse };

export function ResultScreen({ navigation, result }: Props) {
  const { locale, t } = useLocale();
  const {
    risk_score,
    status,
    reasons,
    risk_factors,
    action,
    ai_explanation,
    adaptive_mfa,
    twin_compare,
    signals,
    trusted_device_match,
  } = result;

  const statusLabel = translateRiskStatus(locale, status);
  const actionLabel = translateAction(locale, action);

  return (
    <ScreenLayout>
      <Text style={styles.title}>{t.result.title}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t.result.riskScore}</Text>
        <RiskMeter score={risk_score} status={statusLabel} />
        <View style={styles.actionBox}>
          <Text style={styles.actionLabel}>{t.result.action}</Text>
          <Text style={styles.action}>{actionLabel}</Text>
        </View>
        {trusted_device_match ? (
          <Text style={styles.trust}>✓ Trusted device match</Text>
        ) : null}
      </View>

      {ai_explanation ? (
        <View style={styles.card}>
          <Text style={styles.section}>{t.result.aiTitle}</Text>
          <Text style={styles.aiText}>{ai_explanation}</Text>
        </View>
      ) : null}

      {adaptive_mfa ? (
        <View style={styles.card}>
          <Text style={styles.section}>{t.result.mfaTitle}</Text>
          <Text style={styles.mfaLevel}>
            {adaptive_mfa.level.toUpperCase()} {adaptive_mfa.required ? '· REQUIRED' : ''}
          </Text>
          <Text style={styles.mfaMsg}>{adaptive_mfa.message}</Text>
          <Text style={styles.labelSmall}>{t.result.mfaMethods}</Text>
          <Text style={styles.mono}>{adaptive_mfa.methods.join(' · ')}</Text>
        </View>
      ) : null}

      {signals ? (
        <View style={styles.card}>
          <Text style={styles.section}>{t.result.signalsTitle}</Text>
          <Text style={styles.signalLine}>
            {signals.emulator ? '⚠️' : '✓'} {t.result.signalEmulator}
          </Text>
          <Text style={styles.signalLine}>
            {signals.impossible_travel ? '⚠️' : '✓'} {t.result.signalTravel}
          </Text>
        </View>
      ) : null}

      {twin_compare ? (
        <View style={styles.card}>
          <Text style={styles.section}>{t.result.twinTitle}</Text>
          <TwinCompareBars data={twin_compare} />
        </View>
      ) : null}

      {risk_factors.length > 0 && (
        <>
          <Text style={styles.section}>{t.result.factors}</Text>
          {risk_factors.map((f) => (
            <View key={f.id} style={styles.factorRow}>
              <Text style={styles.factorPoints}>+{f.points}</Text>
              <Text style={styles.factorText}>{translateReason(locale, f.message, f.id)}</Text>
            </View>
          ))}
        </>
      )}

      <Text style={styles.section}>{t.result.why}</Text>
      {reasons.map((r) => (
        <View key={r} style={styles.reasonRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.reasonText}>{translateReason(locale, r)}</Text>
        </View>
      ))}

      <PrimaryButton title={t.result.home} onPress={() => navigation.goHome()} />
      <PrimaryButton
        title={t.result.again}
        variant="secondary"
        onPress={() => navigation.navigate('Check')}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  card: {
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  label: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  actionBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  action: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: 4 },
  trust: { marginTop: 10, color: colors.success, fontWeight: '700' },
  section: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  aiText: { fontSize: 14, lineHeight: 22, color: colors.text },
  mfaLevel: { fontWeight: '900', color: colors.primaryDark, marginBottom: 6 },
  mfaMsg: { fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  labelSmall: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  mono: { fontSize: 12, color: colors.text, fontFamily: 'monospace' },
  signalLine: { fontSize: 14, marginBottom: 6, color: colors.text },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: radii.sm,
    marginBottom: 8,
    gap: 10,
  },
  factorPoints: {
    fontWeight: '900',
    color: colors.danger,
    minWidth: 36,
  },
  factorText: { flex: 1, color: colors.text, lineHeight: 20 },
  reasonRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bullet: { fontSize: 16, lineHeight: 22 },
  reasonText: { flex: 1, fontSize: 15, color: colors.textMuted, lineHeight: 22 },
});
