import { useCallback, useRef, useState } from 'react';
import type { BehaviorPayload } from '../types';

export function useBehaviorSession() {
  const startTime = useRef(Date.now());
  const [keyCount, setKeyCount] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [swipeSpeed, setSwipeSpeed] = useState(1.2);
  const touchSamples = useRef<number[]>([]);

  const onTextChange = useCallback((value: string) => {
    setKeyCount(value.length);
  }, []);

  const incrementTap = useCallback(() => {
    setTapCount((c) => c + 1);
  }, []);

  const recordSwipeVelocity = useCallback((vx: number, vy: number) => {
    const mag = Math.hypot(vx, vy);
    const clamped = Math.min(Math.max(mag, 0.05), 8);
    setSwipeSpeed(clamped);
  }, []);

  const recordTouchDuration = useCallback((ms: number) => {
    const sec = Math.max(ms / 1000, 0.05);
    touchSamples.current = [...touchSamples.current, sec].slice(-8);
  }, []);

  const getBehavior = useCallback(
    (userId: string, device: string, location: string, isEmulator: boolean): BehaviorPayload => {
      const seconds = Math.max((Date.now() - startTime.current) / 1000, 0.5);
      const avgTouch =
        touchSamples.current.length > 0
          ? touchSamples.current.reduce((a, b) => a + b, 0) / touchSamples.current.length
          : 0.4;

      return {
        user_id: userId,
        typing_speed: keyCount / seconds,
        tap_speed: tapCount / seconds,
        swipe_speed: swipeSpeed,
        touch_duration: avgTouch,
        hour: new Date().getHours(),
        device,
        location,
        is_emulator: isEmulator,
      };
    },
    [keyCount, tapCount, swipeSpeed],
  );

  const resetSession = useCallback(() => {
    startTime.current = Date.now();
    setKeyCount(0);
    setTapCount(0);
    setSwipeSpeed(1.2);
    touchSamples.current = [];
  }, []);

  return {
    onTextChange,
    incrementTap,
    recordSwipeVelocity,
    recordTouchDuration,
    getBehavior,
    resetSession,
    keyCount,
    tapCount,
    swipeSpeed,
  };
}
