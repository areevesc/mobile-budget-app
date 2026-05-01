import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase, getAccounts } from './src/lib/db';
import { initNotificationHandler, requestNotificationPermissions } from './src/lib/notifications';
import { AppNavigator } from './src/navigation';
import { OnboardingScreen } from './src/components/OnboardingScreen';
import { COLORS } from './src/lib/utils';

const AppResetContext = createContext<() => void>(() => {});
export const useAppReset = () => useContext(AppResetContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

type AppState = 'loading' | 'onboarding' | 'ready';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');

  useEffect(() => {
    async function initialize() {
      try {
        await initDatabase();
        initNotificationHandler();
        requestNotificationPermissions();
        // Check if user has done any setup (has accounts)
        const accounts = getAccounts();
        if (accounts.length === 0) {
          setAppState('onboarding');
        } else {
          setAppState('ready');
        }
      } catch (error) {
        console.error('DB init error:', error);
        setAppState('ready');
      }
    }
    initialize();
  }, []);

  if (appState === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppResetContext.Provider value={() => setAppState('onboarding')}>
            <StatusBar style="light" backgroundColor={COLORS.background} />
            {appState === 'onboarding' ? (
              <OnboardingScreen onComplete={() => setAppState('ready')} />
            ) : (
              <AppNavigator />
            )}
          </AppResetContext.Provider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
