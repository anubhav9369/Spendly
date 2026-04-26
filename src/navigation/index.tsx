import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store';

import LoginScreen from '../screens/auth/LoginScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import HomeScreen from '../screens/main/HomeScreen';
import AddExpenseScreen from '../screens/main/AddExpenseScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import BudgetScreen from '../screens/main/BudgetScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home:      { active: '⌂',  inactive: '⌂'  },
  Analytics: { active: '▨',  inactive: '▨'  },
  History:   { active: '≡',  inactive: '≡'  },
  'Profile ': { active: '◯', inactive: '◯' },
};

function CustomTabBar({ state, navigation }: any) {
  const { colors, isDark } = useTheme();

  const tabBg    = isDark ? 'rgba(6,14,12,0.97)'  : '#FFFFFF';
  const borderC  = isDark ? 'rgba(63,175,143,0.10)' : colors.border;
  const activeC  = isDark ? '#3FAF8F' : colors.primary;
  const inactiveC = isDark ? '#3D6B62' : colors.textTertiary;

  const tabs = [
    { name: 'Home',      label: 'Home',      icon: '🏠' },
    { name: 'Analytics', label: 'Analytics', icon: '📊' },
    { name: 'Add',       label: '',          icon: ''   },
    { name: 'History',   label: 'History',   icon: '📜' },
    { name: 'Profile',   label: 'Profile',   icon: '👤' },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: tabBg, borderTopColor: borderC }]}>
      {state.routes.map((route: any, i: number) => {
        const focused = state.index === i;
        const isAdd   = route.name === 'Add';

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            {isAdd ? (
              /* ── Floating Add Button ── */
              <View style={styles.fabWrap}>
                <View style={[styles.fabGlow, isDark && styles.fabGlowDark]} />
                <View style={[styles.fab, {
                  backgroundColor: isDark ? '#1A5C4A' : colors.primary,
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark ? 'rgba(63,175,143,0.5)' : 'transparent',
                  shadowColor: '#3FAF8F',
                  shadowOpacity: isDark ? 0.55 : 0.3,
                  shadowRadius: isDark ? 16 : 8,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 10,
                }]}>
                  <Text style={{ color: isDark ? '#3FAF8F' : '#FFF', fontSize: 28, fontWeight: '300', marginTop: -2 }}>+</Text>
                </View>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.45 }}>{tabs[i].icon}</Text>
                <Text style={[styles.tabLabel, { color: focused ? activeC : inactiveC }]}>
                  {tabs[i].label}
                </Text>
                {focused && (
                  <View style={[styles.activeDot, { backgroundColor: activeC, shadowColor: activeC }]} />
                )}
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(p) => <CustomTabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Add"       component={AddExpenseScreen} />
      <Tab.Screen name="History"   component={HistoryScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoggedIn, isOnboarded } = useStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main"   component={MainTabs} />
            <Stack.Screen name="Budget" component={BudgetScreen} options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    borderTopWidth: 1,
    elevation: 20,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 3, letterSpacing: 0.2 },
  activeDot: {
    width: 4, height: 4, borderRadius: 2, marginTop: 3,
    shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },
  fabWrap: { alignItems: 'center', justifyContent: 'center', marginTop: -22 },
  fabGlow: { position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: 'transparent' },
  fabGlowDark: {
    backgroundColor: 'rgba(63,175,143,0.12)',
    shadowColor: '#3FAF8F', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
  },
  fab: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
