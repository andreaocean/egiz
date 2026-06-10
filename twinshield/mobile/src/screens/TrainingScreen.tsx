import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput } from 'react-native';
import { trainBehavior } from '../api/client';
import { BehaviorCapture } from '../components/BehaviorCapture';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenLayout } from '../components/ScreenLayout';
import { useLocale } from '../context/LocaleContext';
import { useUser } from '../context/UserContext';
import { useBehaviorSession } from '../hooks/useBehaviorSession';
import type { AppNavigation } from '../navigation/types';
import { colors, radii } from '../theme';
import { isLikelyEmulator } from '../utils/emulator';

type Props = { navigation: AppNavigation };

const defaultDevice = Platform.OS === 'ios' ? 'iOS' : 'Android';
const MIN_SAMPLES = 3;

export function TrainingScreen({ navigation }: Props) {
  const { userId } = useUser();
  const { locale, t } = useLocale();
  const [text, setText] = useState('');
  const [device, setDevice] = useState(defaultDevice);
  const [location, setLocation] = useState('Bishkek');
  const [samples, setSamples] = useState(0);
  const [loading, setLoading] = useState(false);

  const behavior = useBehaviorSession();

  const train = async () => {
    if (!userId) {
      Alert.alert(t.common.error, t.training.noAccount);
      return;
    }
    setLoading(true);
    try {
      const payload = behavior.getBehavior(
        userId,
        device.trim() || defaultDevice,
        location.trim() || 'Bishkek',
        isLikelyEmulator(),
      );
      const data = await trainBehavior(payload, locale);
      setSamples(data.samples);
      behavior.resetSession();
      setText('');
      if (data.ready_for_check) {
        Alert.alert(t.training.profileReadyTitle, t.training.profileReadyBody, [
          { text: t.training.checkRiskBtn, onPress: () => navigation.navigate('Check') },
          { text: t.training.keepTraining, style: 'cancel' },
        ]);
      }
    } catch (e) {
      Alert.alert(t.common.error, e instanceof Error ? e.message : 'Train failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <Text style={styles.title}>{t.training.title}</Text>
      <Text style={styles.hint}>{t.training.hint}</Text>

      {!userId && <Text style={styles.warn}>{t.training.noAccount}</Text>}

      <ProgressBar
        current={samples}
        target={MIN_SAMPLES}
        label={t.training.progress}
        samplesLabel={t.common.samples}
      />

      <Text style={styles.label}>{t.training.device}</Text>
      <TextInput value={device} onChangeText={setDevice} style={styles.input} />

      <Text style={styles.label}>{t.training.location}</Text>
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

      <PrimaryButton title={t.training.newSession} variant="secondary" onPress={behavior.resetSession} />
      <PrimaryButton
        title={t.training.saveSample}
        variant="success"
        onPress={train}
        loading={loading}
        disabled={!userId}
      />
      <PrimaryButton title={t.training.checkRisk} onPress={() => navigation.navigate('Check')} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { color: colors.textMuted, marginTop: 8, lineHeight: 22, marginBottom: 8 },
  warn: { color: colors.warning, fontWeight: '700', marginBottom: 8 },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 6, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    backgroundColor: '#fff',
  },
});
