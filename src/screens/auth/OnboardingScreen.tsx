import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useStore } from '../../store';

const { width, height } = Dimensions.get('window');

// All slides now use the Splendly dark green palette
const SLIDES = [
  { id: '1', emoji: '💰', title: 'Track Every Rupee',     subtitle: 'Log expenses in seconds with smart category detection', accent: '#3FAF8F' },
  { id: '2', emoji: '📊', title: 'Beautiful Analytics',   subtitle: 'Charts and insights to understand your spending patterns', accent: '#3A86FF' },
  { id: '3', emoji: '🤖', title: 'AI-Powered Insights',   subtitle: 'Smart recommendations to save more every month', accent: '#3FAF8F' },
  { id: '4', emoji: '🎯', title: 'Budget Goals',          subtitle: 'Set budgets per category and get alerts before overspending', accent: '#D4A937' },
];

// ── Budget Setup Step ────────────────────────────────────────────────────────
function BudgetSetupStep({ onDone }: { onDone: () => void }) {
  const { setUser, saveUserProfile } = useStore();
  const [income, setIncome] = useState('');
  const [budget, setBudget] = useState('');

  const handleDone = async () => {
    const inc = parseFloat(income) || 0;
    const bud = parseFloat(budget) || 0;
    setUser({ monthlyIncome: inc, monthlyBudget: bud });
    setTimeout(async () => {
      await saveUserProfile();
      onDone();
    }, 50);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#060E0C' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.setupScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.setupEmoji}>🎯</Text>
        <Text style={styles.setupTitle}>Set Your Budget</Text>
        <Text style={styles.setupSubtitle}>
          This helps us track your savings rate.{'\n'}You can update these anytime from Profile.
        </Text>

        {/* Monthly Income */}
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Monthly Income (optional)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50000"
              placeholderTextColor="rgba(232,245,242,0.25)"
              value={income}
              onChangeText={setIncome}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>
          <Text style={styles.inputHint}>Used to calculate your savings rate</Text>
        </View>

        {/* Monthly Budget */}
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Monthly Spending Budget</Text>
          <View style={styles.inputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 30000"
              placeholderTextColor="rgba(232,245,242,0.25)"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
          <Text style={styles.inputHint}>How much you plan to spend this month</Text>
        </View>

        <TouchableOpacity style={styles.setupBtn} onPress={handleDone}>
          <Text style={styles.setupBtnText}>
            {income || budget ? "Let's Go 🚀" : 'Skip for now →'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Main Onboarding ──────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [showSetup, setShowSetup] = useState(false);
  const ref = useRef<FlatList>(null);
  const { setOnboarded, saveUserProfile } = useStore();

  const finish = async () => {
    setOnboarded(true);
    await saveUserProfile();
  };

  const next = () => {
    if (slideIndex < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: slideIndex + 1 });
      setSlideIndex(slideIndex + 1);
    } else {
      setShowSetup(true);
    }
  };

  const skipToSetup = () => setShowSetup(true);

  if (showSetup) {
    return <BudgetSetupStep onDone={finish} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#060E0C' }}>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setSlideIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Skip button — full text, top right */}
            <TouchableOpacity style={styles.skipBtn} onPress={skipToSetup}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            {/* Emoji icon box with accent border */}
            <View style={[styles.emojiBox, { borderColor: item.accent + '50' }]}>
              <Text style={{ fontSize: 64 }}>{item.emoji}</Text>
            </View>

            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
        keyExtractor={(i) => i.id}
      />

      {/* Bottom controls — outside FlatList so they don't scroll */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dotBase,
                slideIndex === i ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Next / Setup button */}
        <TouchableOpacity style={styles.nextBtn} onPress={next}>
          <Text style={styles.nextBtnText}>
            {slideIndex === SLIDES.length - 1 ? 'Set Up Budget 🎯' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Slide ────────────────────────────────────────────────────────────────
  slide: {
    height,
    backgroundColor: '#060E0C',
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(63,175,143,0.10)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(63,175,143,0.20)',
  },
  skipText: {
    color: '#3FAF8F',
    fontSize: 14,
    fontWeight: '600',
  },
  emojiBox: {
    width: 130,
    height: 130,
    borderRadius: 36,
    borderWidth: 1,
    backgroundColor: '#0C1F1B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    marginBottom: 48,
    shadowColor: '#3FAF8F',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E8F5F2',
    textAlign: 'center',
    marginBottom: 14,
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#6B9E96',
    textAlign: 'center',
    lineHeight: 24,
  },

  // ── Bottom nav ───────────────────────────────────────────────────────────
  bottom: {
    position: 'absolute',
    bottom: 50,
    left: 32,
    right: 32,
    alignItems: 'center',
    gap: 20,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dotBase: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: '#3FAF8F' },
  dotInactive: { width: 8, backgroundColor: 'rgba(63,175,143,0.25)' },
  nextBtn: {
    backgroundColor: '#163D33',
    paddingVertical: 18,
    paddingHorizontal: 56,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(63,175,143,0.4)',
    shadowColor: '#3FAF8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  nextBtnText: { color: '#3FAF8F', fontSize: 17, fontWeight: '700' },

  // ── Budget Setup ─────────────────────────────────────────────────────────
  setupScroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 48,
  },
  setupEmoji: { fontSize: 64, marginBottom: 20 },
  setupTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E8F5F2',
    marginBottom: 10,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: 15,
    color: '#6B9E96',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  inputBlock: { width: '100%', marginBottom: 24 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B9E96',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C1F1B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(63,175,143,0.15)',
    paddingHorizontal: 18,
    height: 58,
  },
  rupee: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3FAF8F',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#E8F5F2',
  },
  inputHint: {
    fontSize: 12,
    color: '#3D6B62',
    marginTop: 6,
    marginLeft: 4,
  },
  setupBtn: {
    marginTop: 16,
    backgroundColor: '#163D33',
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(63,175,143,0.4)',
    shadowColor: '#3FAF8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  setupBtnText: {
    color: '#3FAF8F',
    fontSize: 17,
    fontWeight: '700',
  },
});