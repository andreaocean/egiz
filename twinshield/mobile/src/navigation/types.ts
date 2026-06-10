import type { CheckResponse } from '../types';

export type ScreenName = 'Dashboard' | 'Register' | 'Training' | 'Check' | 'Result' | 'Threats';

export type AppNavigation = {
  navigate: (screen: ScreenName, params?: { result?: CheckResponse }) => void;
  goBack: () => void;
  goHome: () => void;
  canGoBack: boolean;
};
