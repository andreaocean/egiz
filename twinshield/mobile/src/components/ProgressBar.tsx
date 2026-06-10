import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';

type Props = {
  current: number;
  target: number;
  label?: string;
  samplesLabel?: string;
};

export function ProgressBar({ current, target, label, samplesLabel = 'samples' }: Props) {
  const pct = Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.meta}>
        {current} / {target} {samplesLabel} ({pct}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  track: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: radii.full,
  },
  meta: { marginTop: 6, fontSize: 12, color: colors.textMuted },
});
