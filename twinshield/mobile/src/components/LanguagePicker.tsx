import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LOCALES, type Locale } from '../i18n';
import { useLocale } from '../context/LocaleContext';
import { colors, radii, spacing } from '../theme';

export function LanguagePicker() {
  const { locale, setLocale, t } = useLocale();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t.language.title}</Text>
      <View style={styles.row}>
        {LOCALES.map((item) => {
          const active = locale === item.code;
          return (
            <Pressable
              key={item.code}
              onPress={() => setLocale(item.code as Locale)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item.code === 'en' ? t.language.en : item.code === 'ru' ? t.language.ru : t.language.ky}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  chipText: { fontWeight: '600', color: colors.text, fontSize: 14 },
  chipTextActive: { color: '#fff' },
});
