import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme';

type Props = {
  score: number;
  status: string;
};

export function RiskMeter({ score, status }: Props) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 70 ? colors.danger : pct >= 40 ? colors.warning : pct >= 20 ? colors.success : colors.primary;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.row}>
        <Text style={[styles.score, { color }]}>{pct}%</Text>
        <Text style={[styles.status, { color }]}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  track: {
    height: 14,
    backgroundColor: '#e2e8f0',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.full },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  score: { fontSize: 36, fontWeight: '900' },
  status: { fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'right' },
});
