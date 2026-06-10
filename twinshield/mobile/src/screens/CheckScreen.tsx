import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { checkRisk } from '../api/client';
import { BehaviorCapture } from '../components/BehaviorCapture';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { useLocale } from '../context/LocaleContext';
import { useUser } from '../context/UserContext';
import { useBehaviorSession } from '../hooks/useBehaviorSession';
import type { AppNavigation } from '../navigation/types';
import { colors, radii } from '../theme';
import { isLikelyEmulator } from '../utils/emulator';

type Props = { navigation: AppNavigation };

const defaultDevice = Platform.OS === 'ios' ? 'iOS' : 'Android';

export function CheckScreen({ navigation }: Props) {
  const { userId } = useUser();
  const { locale, t } = useLocale();
  const [text, setText] = useState('');
  const [device, setDevice] = useState(defaultDevice);
  const [location, setLocation] = useState('Bishkek');
  const [loading, setLoading] = useState(false);
  const [forceEmulator, setForceEmulator] = useState(false);

  const behavior = useBehaviorSession();

  const runCheck = async () => {
    if (!userId) {
      Alert.alert(t.common.error, t.check.noAccount);
      return;
    }
    setLoading(true);
    try {
      const emu = isLikelyEmulator() || forceEmulator;
      const payload = behavior.getBehavior(
        userId,
        device.trim() || defaultDevice,
        location.trim() || 'Bishkek',
        emu,
      );
      const data = await checkRisk(payload, locale);
      navigation.navigate('Result', { result: data });
    } catch (e) {
      Alert.alert(t.common.error, e instanceof Error ? e.message : 'Check failed');
    } finally {
      setLoading(false);
    }
  };

  const hackerSimulation = () => {
    setDevice('Unknown');
    setLocation('Tokyo');
    setText('aaaaaaaaaaaaaaaaaaaaaaaa');
    behavior.onTextChange('aaaaaaaaaaaaaaaaaaaaaaaa');
    for (let i = 0; i < 40; i += 1) {
      behavior.incrementTap();
    }
    behavior.recordSwipeVelocity(12, 2);
    setForceEmulator(true);
  };

  return (
    <ScreenLayout>
      <Text style={styles.title}>{t.check.title}</Text>
      <Text style={styles.hint}>{t.check.hint}</Text>

      <Pressable style={styles.simBtn} onPress={hackerSimulation}>
        <Text style={styles.simText}>⚡ {t.checkExtra.hackerSim}</Text>
      </Pressable>

      <View style={styles.row}>
        <Text style={styles.switchLabel}>{t.checkExtra.emulatorOn}</Text>
        <Switch value={forceEmulator} onValueChange={setForceEmulator} />
      </View>

      <Text style={styles.label}>{t.check.device}</Text>
      <TextInput value={device} onChangeText={setDevice} style={styles.input} />

      <Text style={styles.label}>{t.check.location}</Text>
      <TextInput value={location} onChangeText={setLocation} style={styles.input} />

      <BehaviorCapture
        text={text}
        onTextChange={(v) => {
          setText(v);
          behavior.onTextChange(v);
        }}
        onTap={behavior.incrementTap}
        onSwipeVelocity={behavior.recordSwipeVelocity}
        onTouchDuration={behavior.recordTouchDuration}
      />

      <PrimaryButton title={t.check.button} onPress={runCheck} loading={loading} disabled={!userId} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { color: colors.textMuted, marginTop: 8, marginBottom: 12, lineHeight: 22 },
  simBtn: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: radii.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  simText: { fontWeight: '800', color: '#92400e', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
  },
  switchLabel: { flex: 1, fontWeight: '600', color: colors.text, marginRight: 12 },
  label: { fontWeight: '600', marginTop: 10, marginBottom: 6, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    backgroundColor: '#fff',
  },
});
