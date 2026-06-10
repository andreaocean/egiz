import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'egiz_session';

type Session = {
  userId: string;
  email: string;
};

type UserState = {
  userId: string | null;
  email: string | null;
  ready: boolean;
  setUser: (userId: string, email: string) => Promise<void>;
  clearUser: () => Promise<void>;
};

const UserContext = createContext<UserState | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const session = JSON.parse(raw) as Session;
        setUserId(session.userId);
        setEmail(session.email);
      })
      .finally(() => setReady(true));
  }, []);

  const setUser = useCallback(async (id: string, em: string) => {
    setUserId(id);
    setEmail(em);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: id, email: em }));
  }, []);

  const clearUser = useCallback(async () => {
    setUserId(null);
    setEmail(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ userId, email, ready, setUser, clearUser }),
    [userId, email, ready, setUser, clearUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser must be used within UserProvider');
  }
  return ctx;
}
