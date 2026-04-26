import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { useStore } from '../../store';
import { useTheme, useCurrency } from '../../hooks/useTheme';
import { CATEGORIES } from '../../constants';
import { Expense, IncomeEntry } from '../../types';
import dayjs from 'dayjs';

export default function HomeScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const sym = useCurrency();
  const { user, expenses, incomeEntries, getMonthTotal, getTodayTotal, getWalletBalance, getSavingsRate, getMonthIncome } = useStore();

  const monthTotal       = getMonthTotal();
  const todayTotal       = getTodayTotal();
  const balance          = getWalletBalance();
  const savingsRate      = getSavingsRate();
  const lastMonth        = getMonthTotal(dayjs().subtract(1, 'month').format('YYYY-MM'));
  const diff             = lastMonth > 0 ? ((monthTotal - lastMonth) / lastMonth) * 100 : 0;
  const budgetPct        = user.monthlyBudget > 0 ? Math.min((monthTotal / user.monthlyBudget) * 100, 100) : 0;
  const monthExtraIncome = getMonthIncome();

  // Merge expenses + income entries, sort by date desc, take top 6
  const recent = useMemo(() => {
    const expRows = expenses.map((e) => ({ ...e, _type: 'expense' as const }));
    const incRows = (incomeEntries || []).map((e) => ({ ...e, _type: 'income' as const }));
    return [...expRows, ...incRows]
      .sort((a, b) => {
        const dA = dayjs(`${a.date} ${(a as any).time || '00:00'}`);
        const dB = dayjs(`${b.date} ${(b as any).time || '00:00'}`);
        return dB.valueOf() - dA.valueOf();
      })
      .slice(0, 6);
  }, [expenses, incomeEntries]);

  const insights = useMemo(() => {
    const list: { icon: string; text: string; color: string }[] = [];
    if (budgetPct > 85) list.push({ icon: '⚠️', text: `Used ${budgetPct.toFixed(0)}% of monthly budget`, color: '#E45757' });
    else if (budgetPct > 65) list.push({ icon: '📊', text: `Used ${budgetPct.toFixed(0)}% of your budget`, color: '#D4A937' });
    if (diff > 20) list.push({ icon: '📈', text: `Spending up ${diff.toFixed(0)}% vs last month`, color: '#D4A937' });
    else if (diff < -10) list.push({ icon: '🎉', text: `Spending down ${Math.abs(diff).toFixed(0)}% vs last month`, color: '#3FAF8F' });
    if (savingsRate > 0) list.push({ icon: '💚', text: `Saving ${savingsRate.toFixed(0)}% of your income`, color: '#3FAF8F' });
    if (list.length === 0) list.push({ icon: '✅', text: 'Spending looks healthy this month!', color: '#3FAF8F' });
    return list;
  }, [budgetPct, diff, savingsRate]);

  // ── Design tokens ──────────────────────────────────────────────────────────
  const D = isDark ? {
    bg:          '#060E0C',
    headerBg:    '#060E0C',
    cardBg:      '#0C1F1B',
    cardBorder:  'rgba(63,175,143,0.12)',
    // wallet card: dark green with top-center bright spotlight
    walletBg:    '#0D2922',
    walletBorder:'rgba(63,175,143,0.22)',
    walletShine: 'rgba(63,175,143,0.22)',   // used as top highlight tint
    accent:      '#3FAF8F',
    accentGlow:  'rgba(63,175,143,0.18)',
    textPrimary: '#E8F5F2',
    textSec:     '#6B9E96',
    textMuted:   '#3D6B62',
    statsBg:     'rgba(0,0,0,0.35)',
    statsBorder: 'rgba(63,175,143,0.10)',
  } : {
    bg:          '#F0F7F5',
    headerBg:    colors.primary,
    cardBg:      '#FFFFFF',
    cardBorder:  colors.border,
    walletBg:    colors.primary,
    walletBorder:'transparent',
    walletShine: 'rgba(255,255,255,0.15)',
    accent:      '#FFFFFF',
    accentGlow:  'transparent',
    textPrimary: colors.text,
    textSec:     colors.textSecondary,
    textMuted:   colors.textTertiary,
    statsBg:     'rgba(255,255,255,0.15)',
    statsBorder: 'rgba(255,255,255,0.2)',
  };

  const saveColor = savingsRate >= 20 ? '#3FAF8F' : savingsRate >= 10 ? '#D4A937' : '#E45757';

  return (
    <View style={[styles.container, { backgroundColor: D.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={[styles.header, { backgroundColor: D.headerBg }]}>
          <View>
            <Text style={[styles.greeting, { color: isDark ? D.textPrimary : '#FFF' }]}>
              Good day, {user.name.split(' ')[0]} 👋
            </Text>
            <Text style={[styles.date, { color: isDark ? D.textMuted : 'rgba(255,255,255,0.6)' }]}>
              {dayjs().format('dddd, MMM D')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={[styles.avatar, {
              backgroundColor: isDark ? '#132922' : 'rgba(255,255,255,0.18)',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(63,175,143,0.25)' : 'rgba(255,255,255,0.3)',
            }]}
          >
            <Text style={{ fontSize: 17, color: isDark ? '#3FAF8F' : '#FFF', fontWeight: '700' }}>
              {user.name[0]?.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Wallet Balance Card — the star of the screen ─────────── */}
        <View style={styles.walletOuter}>
          {/* Ambient glow behind the card */}
          {isDark && <View style={styles.walletAmbient} />}

          <View style={[styles.walletCard, {
            backgroundColor: D.walletBg,
            borderColor: D.walletBorder,
            shadowColor: '#3FAF8F',
            shadowOpacity: isDark ? 0.25 : 0.1,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
          }]}>
            {/* Top shine strip — the "light hitting the card" effect */}
            {isDark && (
              <View style={styles.walletTopShine} />
            )}

            <View style={styles.walletLabelRow}>
              <Text style={styles.walletLabel}>WALLET BALANCE</Text>
            </View>

            <Text style={[styles.walletAmt, { color: balance < 0 ? '#E45757' : '#FFF' }]}>
              {balance < 0 ? '-' : ''}{sym}{Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>

            {/* Extra income badge */}
            {monthExtraIncome > 0 && (
              <View style={styles.incomeReceivedBadge}>
                <Text style={styles.incomeReceivedText}>
                  +{sym}{monthExtraIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })} received this month
                </Text>
              </View>
            )}

            {/* Stats inner glass box */}
            <View style={[styles.statsBox, {
              backgroundColor: D.statsBg,
              borderColor: D.statsBorder,
            }]}>
              {[
                { label: 'This Month', value: monthTotal,            icon: '📅', negative: false },
                { label: 'Today',      value: todayTotal,            icon: '☀️', negative: false },
                { label: 'Budget Left',value: Math.max(balance, 0),  icon: '🎯', negative: false },
              ].map((s, i) => (
                <View key={i} style={[styles.statItem, i < 2 && {
                  borderRightWidth: 1,
                  borderRightColor: D.statsBorder,
                }]}>
                  <Text style={{ fontSize: 16 }}>{s.icon}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statVal}>
                    {sym}{s.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              ))}
            </View>

            {/* Progress */}
            <View style={[styles.progressTrack, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.3)',
            }]}>
              <View style={[styles.progressFill, {
                width: `${budgetPct}%` as any,
                backgroundColor: budgetPct > 85 ? '#E45757' : budgetPct > 65 ? '#D4A937' : '#3FAF8F',
                shadowColor: '#3FAF8F',
                shadowOpacity: isDark ? 0.7 : 0,
                shadowRadius: 4,
              }]} />
            </View>
            <Text style={styles.progressLabel}>Budget used: {budgetPct.toFixed(0)}%</Text>
          </View>
        </View>

        {/* ── Savings Rate ────────────────────────────────────────────── */}
        {user.monthlyIncome > 0 && (
          <View style={[styles.card, {
            backgroundColor: D.cardBg,
            borderColor: D.cardBorder,
            marginHorizontal: 16, marginBottom: 4,
          }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardLabel, { color: D.textMuted }]}>SAVINGS RATE</Text>
              <Text style={[styles.savingsRate, { color: saveColor }]}>
                {savingsRate.toFixed(1)}%
              </Text>
              <Text style={[styles.savingsDetail, { color: D.textMuted }]}>
                {sym}{Math.max(0, user.monthlyIncome - monthTotal).toLocaleString('en-IN', { maximumFractionDigits: 0 })} saved of {sym}{user.monthlyIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })} income
              </Text>
            </View>
            <View style={[styles.rateBadge, {
              borderColor: saveColor,
              backgroundColor: saveColor + '10',
            }]}>
              <Text style={{ fontSize: 22 }}>
                {savingsRate >= 20 ? '😊' : savingsRate >= 10 ? '😐' : '😟'}
              </Text>
            </View>
          </View>
        )}

        {/* ── Quick Actions ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: D.textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {[
              { icon: '➕', label: 'Add',       color: '#6D5DF6', onPress: () => navigation.navigate('Add') },
              { icon: '📊', label: 'Analytics', color: '#3A86FF', onPress: () => navigation.navigate('Analytics') },
              { icon: '💰', label: 'Budget',    color: '#3FAF8F', onPress: () => navigation.navigate('Budget') },
              { icon: '📜', label: 'History',   color: '#D4A937', onPress: () => navigation.navigate('History') },
            ].map((a, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.actionBtn, {
                  backgroundColor: isDark ? '#0A1C18' : D.cardBg,
                  borderColor: isDark ? 'rgba(63,175,143,0.10)' : D.cardBorder,
                }]}
                onPress={a.onPress}
                activeOpacity={0.72}
              >
                <View style={[styles.actionIcon, { backgroundColor: a.color + '1A' }]}>
                  <Text style={{ fontSize: 20 }}>{a.icon}</Text>
                </View>
                <Text style={[styles.actionLabel, { color: D.textSec }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Smart Insights ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: D.textPrimary }]}>💡 Smart Insights</Text>
          {insights.map((ins, i) => (
            <View key={i} style={[styles.insightCard, {
              backgroundColor: ins.color + (isDark ? '0D' : '12'),
              borderLeftColor: ins.color,
              borderColor: isDark ? ins.color + '20' : 'transparent',
              borderWidth: isDark ? 1 : 0,
              borderLeftWidth: 3,
            }]}>
              <Text style={{ fontSize: 16 }}>{ins.icon}</Text>
              <Text style={[styles.insightText, { color: D.textPrimary }]}>{ins.text}</Text>
              <Text style={{ color: D.textMuted, fontSize: 16 }}>›</Text>
            </View>
          ))}
        </View>

        {/* ── Recent Transactions ─────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: D.textPrimary }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={{ color: '#3FAF8F', fontSize: 13, fontWeight: '600' }}>See All</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <View style={[styles.card, {
              backgroundColor: D.cardBg, borderColor: D.cardBorder,
              padding: 32, alignItems: 'center', gap: 6,
            }]}>
              <Text style={{ fontSize: 40 }}>💸</Text>
              <Text style={{ color: D.textPrimary, fontWeight: '700', marginTop: 8 }}>No expenses yet</Text>
              <Text style={{ color: D.textMuted, fontSize: 13 }}>Tap + to add your first</Text>
            </View>
          ) : (
            recent.map((e) =>
              e._type === 'income'
                ? <IncomeRow key={`inc-${e.id}`} entry={e as any} sym={sym} isDark={isDark} D={D} />
                : <ExpenseRow key={e.id} expense={e as any} sym={sym} isDark={isDark} D={D} />
            )
          )}
        </View>

      </ScrollView>
    </View>
  );
}

function ExpenseRow({ expense, sym, isDark, D }: { expense: Expense; sym: string; isDark: boolean; D: any }) {
  const cat = CATEGORIES.find((c) => c.id === expense.category);
  return (
    <View style={[styles.expRow, { backgroundColor: D.cardBg, borderColor: D.cardBorder }]}>
      <View style={[styles.expIcon, { backgroundColor: (cat?.color || '#999') + '1A' }]}>
        <Text style={{ fontSize: 20 }}>{cat?.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.expNote, { color: D.textPrimary }]} numberOfLines={1}>
          {expense.note || cat?.label}
        </Text>
        <Text style={[styles.expMeta, { color: D.textMuted }]}>
          {dayjs(expense.date).format('MMM D')} · {expense.paymentMethod.toUpperCase()}
        </Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#E45757' }}>
        -{sym}{expense.amount.toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

function IncomeRow({ entry, sym, isDark, D }: { entry: IncomeEntry; sym: string; isDark: boolean; D: any }) {
  const sourceEmojis: Record<string, string> = {
    salary: '💼', freelance: '💻', gift: '🎁', refund: '↩️', investment: '📈', other: '💰',
  };
  const sourceLabels: Record<string, string> = {
    salary: 'Salary', freelance: 'Freelance', gift: 'Gift', refund: 'Refund', investment: 'Investment', other: 'Received',
  };
  return (
    <View style={[styles.expRow, { backgroundColor: D.cardBg, borderColor: 'rgba(63,175,143,0.2)' }]}>
      <View style={[styles.expIcon, { backgroundColor: 'rgba(63,175,143,0.12)' }]}>
        <Text style={{ fontSize: 20 }}>{sourceEmojis[entry.source] || '💰'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.expNote, { color: D.textPrimary }]} numberOfLines={1}>
          {entry.note || sourceLabels[entry.source] || 'Money Received'}
        </Text>
        <Text style={[styles.expMeta, { color: D.textMuted }]}>
          {dayjs(entry.date).format('MMM D')} · {sourceLabels[entry.source] || 'Income'}
        </Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#3FAF8F' }}>
        +{sym}{entry.amount.toLocaleString('en-IN')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 14, paddingHorizontal: 20,
  },
  greeting: { fontSize: 20, fontWeight: '700' },
  date: { fontSize: 13, marginTop: 3 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  // Wallet
  walletOuter: { marginHorizontal: 16, marginTop: 10, marginBottom: 14 },
  // AFTER
  walletAmbient: {
    position: 'absolute', alignSelf: 'center',
    width: '70%', height: 80, borderRadius: 60,
    backgroundColor: 'rgba(63,175,143,0.03)',
    top: -5,
    shadowColor: '#3FAF8F', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
  },
  walletCard: { borderRadius: 22, padding: 22, borderWidth: 1, overflow: 'hidden' },
 
  walletTopShine: {
    position: 'absolute', top: 0, left: '25%', right: '25%', height: 1,
    backgroundColor: 'rgba(63,175,143,0.18)',
    shadowColor: '#3FAF8F', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 1 },
  },
  walletLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: 2, fontWeight: '600' },
  walletAmt: { fontSize: 40, fontWeight: '800', color: '#FFF', marginTop: 8, marginBottom: 18 },
  statsBox: { flexDirection: 'row', borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.3 },
  statVal: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 7 },
  incomeReceivedBadge: {
    alignSelf: 'flex-start', marginBottom: 14,
    backgroundColor: 'rgba(63,175,143,0.12)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(63,175,143,0.3)',
  },
  incomeReceivedText: { color: '#3FAF8F', fontSize: 11, fontWeight: '600' },

  // Generic card
  card: { borderRadius: 16, padding: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  savingsRate: { fontSize: 30, fontWeight: '800' },
  savingsDetail: { fontSize: 11, marginTop: 3 },
  rateBadge: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 8, borderWidth: 1 },
  actionIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '600' },

  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 13, marginBottom: 8 },
  insightText: { flex: 1, fontSize: 13, fontWeight: '500' },

  expRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 8, gap: 12, borderWidth: 1 },
  expIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  expNote: { fontSize: 14, fontWeight: '600' },
  expMeta: { fontSize: 12, marginTop: 2 },
});