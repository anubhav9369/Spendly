import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useStore } from '../../store';

export default function LoginScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser, setLoggedIn, loadUserData, saveUserProfile } = useStore();

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found': return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password': return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use': return 'This email is already registered. Please sign in instead.';
      case 'auth/invalid-email': return 'Please enter a valid email address.';
      case 'auth/invalid-credential': return 'Incorrect email or password. Please try again.';
      case 'auth/too-many-requests': return 'Too many failed attempts. Please wait a moment and try again.';
      case 'auth/network-request-failed': return 'Network error. Please check your internet connection.';
      case 'auth/weak-password': return 'Password is too weak. Please use at least 6 characters.';
      default: return 'Something went wrong. Please try again.';
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (isSignUp && !name.trim()) { Alert.alert('Error', 'Please enter your name'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, { displayName: name.trim() });
        setLoggedIn(false, result.user.uid);
        setUser({ name: name.trim(), email: email.trim(), monthlyBudget: 0 });
        await saveUserProfile();
        setLoggedIn(true, result.user.uid);
      } else {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        setLoggedIn(false, result.user.uid);
        await loadUserData();
        const { user } = useStore.getState();
        if (!user.email) {
          setUser({
            name: result.user.displayName || email.split('@')[0],
            email: result.user.email || email.trim(),
          });
        }
        setLoggedIn(true, result.user.uid);
      }
    } catch (error: any) {
      const code = error?.code ?? '';
      Alert.alert('Error', getErrorMessage(code));
      setLoggedIn(false, '');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setName(''); setEmail(''); setPassword('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Branding */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Spendly</Text>
            <Text style={styles.tagline}>Spend Wisely </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {isSignUp ? 'Start your journey to smarter spending' : 'Sign in to continue'}
            </Text>

            {/* Name — sign up only */}
            {isSignUp && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="rgba(232,245,242,0.3)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(232,245,242,0.3)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min 6 characters"
                  placeholderTextColor="rgba(232,245,242,0.3)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#E8F5F2" />
                : <Text style={styles.btnText}>
                    {isSignUp ? '🚀 Create Account' : '→ Sign In'}
                  </Text>
              }
            </TouchableOpacity>

            {/* Switch mode */}
            <TouchableOpacity style={styles.switchBtn} onPress={switchMode}>
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.switchLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Your data is private and encrypted</Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060E0C',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },

  // ── Header / Logo ─────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 16,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#E8F5F2',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#4D7870',
    marginTop: 6,
    letterSpacing: 1.5,
    fontWeight: '500',
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#0C1F1B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(63,175,143,0.12)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#E8F5F2',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#4D7870',
    marginBottom: 28,
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    color: '#6B9E96',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0A1915',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(63,175,143,0.15)',
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: { fontSize: 17 },
  input: {
    flex: 1,
    color: '#E8F5F2',
    fontSize: 15,
  },

  // ── Button ────────────────────────────────────────────────────────────────
  btn: {
    backgroundColor: '#163D33',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(63,175,143,0.4)',
    shadowColor: '#3FAF8F',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnText: {
    color: '#3FAF8F',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Switch / Footer ───────────────────────────────────────────────────────
  switchBtn: { alignItems: 'center', marginTop: 20 },
  switchText: { color: '#4D7870', fontSize: 14 },
  switchLink: { color: '#3FAF8F', fontWeight: '700' },
  footer: {
    textAlign: 'center',
    color: '#2A4F48',
    fontSize: 12,
    marginTop: 32,
    letterSpacing: 0.5,
  },
});