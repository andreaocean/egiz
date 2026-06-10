import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radii } from '../theme';

type Variant = 'primary' | 'success' | 'danger' | 'secondary';

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
};

const variantStyles: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: colors.primaryDark, text: '#fff' },
  success: { bg: colors.success, text: '#fff' },
  danger: { bg: colors.danger, text: '#fff' },
  secondary: { bg: '#e2e8f0', text: colors.text },
};

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  const v = variantStyles[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, opacity: pressed || disabled ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: 10,
  },
  text: {
    fontWeight: '700',
    fontSize: 16,
  },
});
