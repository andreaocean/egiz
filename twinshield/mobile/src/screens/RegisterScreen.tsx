import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { API_URL, loginUser, registerUser } from '../api/client';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { useLocale } from '../context/LocaleContext';
import { useUser } from '../context/UserContext';
import type { AppNavigation } from '../navigation/types';
import { colors, radii, spacing } from '../theme';

type Props = { navigation: AppNavigation };

export function RegisterScreen({ navigation }: Props) {
  const { setUser } = useUser();
  const { locale, t, tf } = useLocale();
  const [email, setEmail] = useState('test@gmail.com');
  const [password, setPassword] = useState('hackathon');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'register' | 'login'>('register');

  const submit = async () => {
    setLoading(true);
    try {
      if (mode === 'register') {
        const data = await registerUser(email.trim(), password, locale);
        await setUser(data.user_id, data.email);
        Alert.alert(t.register.welcomeTitle, tf(t.register.welcomeBody, { id: data.user_id }), [
          { text: t.register.startTraining, onPress: () => navigation.navigate('Training') },
        ]);
      } else {
        const data = await loginUser(email.trim(), password, locale);
        await setUser(data.user_id, data.email);
        Alert.alert(
          t.register.signedInTitle,
          tf(t.register.signedInBody, { count: data.samples }),
          [{ text: t.common.ok, onPress: () => navigation.goHome() }],
        );
      }
    } catch (e) {
      Alert.alert(t.common.error, e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout>
      <Text style={styles.title}>
        {mode === 'register' ? t.register.createAccount : t.register.signIn}
      </Text>
      <Text style={styles.hint}>{t.register.hint}</Text>
      <Text style={styles.api}>API: {API_URL}</Text>

      <View style={styles.tabs}>
        <PrimaryButton
          title={t.register.signUpTab}
          variant={mode === 'register' ? 'primary' : 'secondary'}
          onPress={() => setMode('register')}
          style={styles.tab}
        />
        <PrimaryButton
          title={t.register.signInTab}
          variant={mode === 'login' ? 'primary' : 'secondary'}
          onPress={() => setMode('login')}
          style={styles.tab}
        />
      </View>

      <Text style={styles.label}>{t.common.email}</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <Text style={styles.label}>{t.common.password}</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      <PrimaryButton
        title={mode === 'register' ? t.register.createAccount : t.register.signIn}
        onPress={submit}
        loading={loading}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  hint: { marginTop: 8, color: colors.textMuted, lineHeight: 20 },
  api: { marginTop: 6, fontSize: 12, color: colors.primary },
  tabs: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  tab: { flex: 1, marginTop: 0 },
  label: { fontWeight: '600', marginTop: spacing.md, marginBottom: 6, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
