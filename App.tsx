import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation';
import { useStore } from './src/store';
import { DARK_THEME, LIGHT_THEME } from './src/constants';
import { auth } from './src/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const theme = useStore((s) => s.theme);
  const colors = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  const { setLoggedIn, loadUserData, logout } = useStore();

  // true while we're checking Firebase auth state on startup
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires once immediately on mount:
    //   - with a user object  → someone is already signed in (persisted session)
    //   - with null           → no session, show login screen
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Restore session: set uid first (needed by loadUserData), then fetch data
        setLoggedIn(false, firebaseUser.uid);
        await loadUserData();
        setLoggedIn(true, firebaseUser.uid);
      } else {
        // No session — make sure store is clean
        logout();
      }
      setAuthChecking(false);
    });

    // Cleanup listener on unmount
    return unsubscribe;
  }, []);

  // Show a full-screen loader while Firebase checks the persisted session
  // This prevents a flash of the Login screen on every app open
  if (authChecking) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
      />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}