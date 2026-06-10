import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TwinCompare } from '../types';
import { colors, radii, spacing } from '../theme';

const KEYS = ['typing_speed', 'tap_speed', 'swipe_speed', 'touch_duration'] as const;
const LABELS: Record<(typeof KEYS)[number], string> = {
  typing_speed: 'Typing',
  tap_speed: 'Tap',
  swipe_speed: 'Swipe',
  touch_duration: 'Touch',
};

type Props = { data: TwinCompare };

export function TwinCompareBars({ data }: Props) {
  const maxAbs = Math.max(
    1,
    ...KEYS.map((k) => Math.abs(data.delta_pct[k] ?? 0)),
  );

  return (
    <View style={styles.wrap}>
      {KEYS.map((k) => {
        const d = data.delta_pct[k] ?? 0;
        const w = Math.min(100, (Math.abs(d) / maxAbs) * 100);
        const neg = d < 0;
        return (
          <View key={k} style={styles.row}>
            <Text style={styles.label}>{LABELS[k]}</Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${w}%` },
                  { backgroundColor: neg ? colors.primary : colors.danger },
                ]}
              />
            </View>
            <Text style={styles.delta}>{d > 0 ? '+' : ''}{d}%</Text>
          </View>
        );
      })}
      <Text style={styles.caption}>Δ% vs your trained twin (baseline)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  row: { marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  track: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.full },
  delta: { fontSize: 11, color: colors.text, marginTop: 2, fontWeight: '600' },
  caption: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
