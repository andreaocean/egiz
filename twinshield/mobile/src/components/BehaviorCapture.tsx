import React, { useRef } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocale } from '../context/LocaleContext';

type Props = {
  text: string;
  onTextChange: (v: string) => void;
  onTap: () => void;
  onSwipeVelocity: (vx: number, vy: number) => void;
  onTouchDuration: (ms: number) => void;
};

export function BehaviorCapture({
  text,
  onTextChange,
  onTap,
  onSwipeVelocity,
  onTouchDuration,
}: Props) {
  const { t } = useLocale();
  const pressStart = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, g) => {
        onSwipeVelocity(g.vx, g.vy);
      },
    }),
  ).current;

  return (
    <View>
      <Text style={styles.label}>{t.capture.phrase}</Text>
      <TextInput
        placeholder={t.capture.phrasePlaceholder}
        value={text}
        onChangeText={onTextChange}
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 16 }]}>{t.capture.swipe}</Text>
      <View style={styles.swipePad} {...pan.panHandlers}>
        <Text style={styles.swipeHint}>{t.capture.swipeHint}</Text>
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>{t.capture.tap}</Text>
      <Pressable
        onPressIn={() => {
          pressStart.current = Date.now();
        }}
        onPressOut={() => {
          onTouchDuration(Date.now() - pressStart.current);
        }}
        onPress={onTap}
        style={({ pressed }) => [styles.tapBtn, pressed && styles.tapBtnPressed]}
      >
        <Text style={styles.tapText}>{t.capture.tapButton}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  swipePad: {
    height: 100,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  swipeHint: {
    color: '#2563eb',
    fontWeight: '600',
  },
  tapBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  tapBtnPressed: {
    opacity: 0.85,
  },
  tapText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
