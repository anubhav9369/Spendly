import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Platform, Modal, TextInput, Alert,
} from 'react-native';
import { useStore } from '../../store';
import { useTheme, useCurrency, useDesignTokens } from '../../hooks/useTheme';
import { CATEGORIES } from '../../constants';
import { IncomeSource } from '../../types';
import dayjs from 'dayjs';

const { width } = Dimensions.get('window');
const CARD_W = width - 32;

// ─── Income sources config ────────────────────────────────────────────────
const INCOME_SOURCES: { id: IncomeSource; label: string; emoji: string; color: string }[] = [
  { id: 'salary',     label: 'Salary',      emoji: '💼', color: '#3FAF8F' },
  { id: 'freelance',  label: 'Freelance',   emoji: '💻', color: '#6D5DF6' },
  { id: 'gift',       label: 'Gift',        emoji: '🎁', color: '#F472B6' },
  { id: 'refund',     label: 'Refund',      emoji: '↩️', color: '#43CBFF' },
  { id: 'investment', label: 'Investment',  emoji: '📈', color: '#D4A937' },
  { id: 'other',      label: 'Other',       emoji: '💰', color: '#AEB6BF' },
];

// ─── Add Income Modal ─────────────────────────────────────────────────────
function AddIncomeModal({ visible, onClose, colors, D, isDark, sym }: {
  visible: boolean; onClose: () => void; colors: any; D: any; isDark: boolean; sym: string;
}) {
  const { addIncomeEntry } = useStore();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<IncomeSource>('salary');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount'); return;
    }
    await addIncomeEntry({ amount: parseFloat(amount), source, note, date, time: dayjs().format('HH:mm') });
    setAmount(''); setNote(''); setSource('salary'); setDate(dayjs().format('YYYY-MM-DD'));
    Alert.alert('✅ Income Added!', `${sym}${amount} recorded`, [{ text: 'OK', onPress: onClose }]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={[modal.sheet, { backgroundColor: isDark ? '#0C1F1B' : '#FFF', borderColor: isDark ? 'rgba(63,175,143,0.2)' : '#C4D9D4' }]}>
          <View style={modal.handle} />
          <Text style={[modal.title, { color: colors.text }]}>💰 Add Income</Text>
          <Text style={[modal.subtitle, { color: colors.textSecondary }]}>Record money you received</Text>

          <View style={[modal.inputWrap, { backgroundColor: D.inputBg, borderColor: D.inputBorder }]}>
            <Text style={[modal.rupee, { color: '#3FAF8F' }]}>{sym}</Text>
            <TextInput
              style={[modal.amtInput, { color: colors.text }]}
              value={amount} onChangeText={setAmount}
              keyboardType="decimal-pad" placeholder="0"
              placeholderTextColor={colors.textTertiary} autoFocus
            />
          </View>

          <Text style={[modal.label, { color: colors.textSecondary }]}>Source</Text>
          <View style={modal.sourceGrid}>
            {INCOME_SOURCES.map((s) => (
              <TouchableOpacity key={s.id}
                style={[modal.sourceChip, { backgroundColor: source === s.id ? s.color + '25' : D.inputBg, borderColor: source === s.id ? s.color : D.inputBorder }]}
                onPress={() => setSource(s.id)}>
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                <Text style={{ color: source === s.id ? s.color : colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 3 }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[modal.label, { color: colors.textSecondary }]}>Note (optional)</Text>
          <View style={[modal.noteInput, { backgroundColor: D.inputBg, borderColor: D.inputBorder }]}>
            <TextInput style={[{ color: colors.text, fontSize: 14 }]} value={note} onChangeText={setNote}
              placeholder="e.g. April salary, client payment..." placeholderTextColor={colors.textTertiary} />
          </View>

          <Text style={[modal.label, { color: colors.textSecondary }]}>Date</Text>
          <View style={[modal.noteInput, { backgroundColor: D.inputBg, borderColor: D.inputBorder, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
            <Text style={{ fontSize: 16 }}>📅</Text>
            <TextInput style={[{ flex: 1, color: colors.text, fontSize: 14 }]} value={date} onChangeText={setDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity style={[modal.btnCancel, { borderColor: D.cardBorder }]} onPress={onClose}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modal.btnSave, { backgroundColor: '#3FAF8F' }]} onPress={handleSave}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>+ Add Income</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Donut Chart ─────────────────────────────────────────────────────────
function DonutChart({ data, total, size = 180, stroke = 22, D }: {
  data: { pct: number; color: string }[]; total: number; size?: number; stroke?: number; D: any;
}) {
  return (
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, overflow: 'hidden', flexDirection: 'row' }}>
          {data.map((d, i) => <View key={i} style={{ width: `${d.pct}%`, height: size, backgroundColor: d.color }} />)}
        </View>
        <View style={{ width: size - stroke * 2, height: size - stroke * 2, borderRadius: (size - stroke * 2) / 2, backgroundColor: D.cardBg, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <Text style={{ color: D.textMuted, fontSize: 10 }}>TOTAL</Text>
          <Text style={{ color: D.textPrimary, fontSize: 14, fontWeight: '800' }}>
            ₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MonthOverMonthChart({ expenses, D, sym }: { expenses: any[]; D: any; sym: string }) {
  const months = [dayjs().subtract(2, 'month').format('YYYY-MM'), dayjs().subtract(1, 'month').format('YYYY-MM'), dayjs().format('YYYY-MM')];
  const monthLabels = months.map((m) => dayjs(m).format('MMM'));
  const MONTH_COLORS = ['rgba(108,99,255,0.4)', 'rgba(108,99,255,0.7)', '#6C63FF'];
  const BAR_H = 80;
  const topCats = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter((e) => months.includes(dayjs(e.date).format('YYYY-MM'))).forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat]) => cat);
  }, [expenses]);
  const catData = useMemo(() => topCats.map((cat) => {
    const info = CATEGORIES.find((c) => c.id === cat)!;
    const vals = months.map((m) => expenses.filter((e) => e.category === cat && dayjs(e.date).format('YYYY-MM') === m).reduce((s: number, e: any) => s + e.amount, 0));
    return { cat, info, vals };
  }), [topCats, expenses]);
  const overallMax = Math.max(...catData.flatMap((d) => d.vals), 1);
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
        {monthLabels.map((m, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: MONTH_COLORS[i] }} />
            <Text style={{ color: D.textMuted, fontSize: 11 }}>{m}</Text>
          </View>
        ))}
      </View>
      {catData.map(({ cat, info, vals }) => (
        <View key={cat} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Text style={{ fontSize: 16 }}>{info.emoji}</Text>
            <Text style={{ color: D.textPrimary, fontSize: 13, fontWeight: '600' }}>{info.label}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: BAR_H }}>
            {vals.map((v, i) => {
              const h = overallMax > 0 ? Math.max((v / overallMax) * BAR_H, v > 0 ? 4 : 0) : 0;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: BAR_H }}>
                  {v > 0 && <Text style={{ color: D.textMuted, fontSize: 9, marginBottom: 2 }}>{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}</Text>}
                  <View style={{ width: '100%', height: h, backgroundColor: MONTH_COLORS[i], borderRadius: 5 }} />
                  <Text style={{ color: D.textMuted, fontSize: 10, marginTop: 4 }}>{monthLabels[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
      {catData.length === 0 && <Text style={{ color: D.textMuted, textAlign: 'center', paddingVertical: 20 }}>Not enough data yet — add expenses to see trends</Text>}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const D = useDesignTokens();
  const sym = useCurrency();
  const { expenses, incomeEntries, getMonthTotal, getMonthIncome, deleteIncomeEntry } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'income'>('overview');
  const [showAddIncome, setShowAddIncome] = useState(false);

  const currentMonth   = dayjs().format('YYYY-MM');
  const lastMonth      = dayjs().subtract(1, 'month').format('YYYY-MM');
  const currentTotal   = getMonthTotal(currentMonth);
  const lastTotal      = getMonthTotal(lastMonth);
  const diff           = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;
  const avgDaily       = currentTotal / Math.max(dayjs().date(), 1);
  const currentMonthIncome = getMonthIncome(currentMonth);
  const netBalance     = currentMonthIncome - currentTotal;

  const currentExpenses = useMemo(() =>
    expenses.filter((e) => dayjs(e.date).format('YYYY-MM') === currentMonth),
    [expenses, currentMonth]);

  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    currentExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([cat, amt]) => ({
      cat, amt,
      pct: currentTotal > 0 ? (amt / currentTotal) * 100 : 0,
      color: CATEGORIES.find((c) => c.id === cat)?.color || '#999',
      emoji: CATEGORIES.find((c) => c.id === cat)?.emoji || '📦',
      label: CATEGORIES.find((c) => c.id === cat)?.label || cat,
    })).sort((a, b) => b.amt - a.amt);
  }, [currentExpenses, currentTotal]);

  const last7 = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = dayjs().subtract(6 - i, 'day');
      const dateStr = d.format('YYYY-MM-DD');
      const spent  = expenses.filter((e) => dayjs(e.date).format('YYYY-MM-DD') === dateStr).reduce((s, e) => s + e.amount, 0);
      const earned = incomeEntries.filter((e) => dayjs(e.date).format('YYYY-MM-DD') === dateStr).reduce((s, e) => s + e.amount, 0);
      return { label: d.format('ddd'), spent, earned, date: d.format('D') };
    }), [expenses, incomeEntries]);

  const topSpendingDays = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.date] = (map[e.date] || 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([date, amt]) => ({ date, amt }));
  }, [expenses]);

  const currentIncomeEntries = useMemo(() =>
    incomeEntries.filter((e) => dayjs(e.date).format('YYYY-MM') === currentMonth),
    [incomeEntries, currentMonth]);

  const twoMonthsAgo      = dayjs().subtract(2, 'month').format('YYYY-MM');
  const twoMonthsAgoTotal = getMonthTotal(twoMonthsAgo);
  const threeMonthMax     = Math.max(twoMonthsAgoTotal, lastTotal, currentTotal, 1);
  const maxBar            = Math.max(...last7.map((d) => Math.max(d.spent, d.earned)), 1);
  const BAR_H             = 120;

  const TABS = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'trends',   label: '📈 Trends' },
    { key: 'income',   label: '💰 Income' },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: D.headerBg }]}>
        <View>
          <Text style={[styles.headerTitle, { color: D.headerText }]}>Analytics 📊</Text>
          <Text style={[styles.headerSub, { color: D.headerSub }]}>{dayjs().format('MMMM YYYY')}</Text>
        </View>
        {currentMonthIncome > 0 && (
          <View style={[styles.netBadge, { backgroundColor: netBalance >= 0 ? 'rgba(63,175,143,0.15)' : 'rgba(228,87,87,0.15)', borderColor: netBalance >= 0 ? 'rgba(63,175,143,0.4)' : 'rgba(228,87,87,0.4)' }]}>
            <Text style={{ fontSize: 10, color: netBalance >= 0 ? '#3FAF8F' : '#E45757', fontWeight: '600' }}>NET</Text>
            <Text style={{ fontSize: 13, color: netBalance >= 0 ? '#3FAF8F' : '#E45757', fontWeight: '800' }}>
              {netBalance >= 0 ? '+' : ''}{sym}{Math.abs(netBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </View>
        )}
      </View>

      {/* Tab bar */}
      <View style={[styles.tabRow, { backgroundColor: D.cardBg, borderBottomColor: D.cardBorder }]}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key}
            style={[styles.tab, activeTab === tab.key && { borderBottomColor: D.accent, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, { color: activeTab === tab.key ? D.accent : D.textSec }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'This Month', val: `${sym}${currentTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: '📅', color: D.textPrimary },
                { label: 'vs Last Month', val: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, icon: diff >= 0 ? '📈' : '📉', color: diff >= 0 ? '#E45757' : '#3FAF8F' },
                { label: 'Daily Avg', val: `${sym}${avgDaily.toFixed(0)}`, icon: '☀️', color: D.textPrimary },
              ].map((s, i) => (
                <View key={i} style={[styles.summaryCard, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
                  <Text style={{ fontSize: 20 }}>{s.icon}</Text>
                  <Text style={[styles.summaryVal, { color: s.color }]}>{s.val}</Text>
                  <Text style={[styles.summaryLabel, { color: D.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Income vs Expense vs Saved row */}
            {currentMonthIncome > 0 && (
              <View style={[styles.card, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder, marginBottom: 12, flexDirection: 'row' }]}>
                {[
                  { label: 'INCOME', val: `+${sym}${currentMonthIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: '#3FAF8F' },
                  { label: 'SPENT',  val: `-${sym}${currentTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,  color: '#E45757' },
                  { label: netBalance >= 0 ? 'SAVED' : 'OVER', val: `${netBalance >= 0 ? '+' : ''}${sym}${Math.abs(netBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: netBalance >= 0 ? '#3FAF8F' : '#E45757' },
                ].map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={{ width: 1, backgroundColor: D.cardBorder }} />}
                    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                      <Text style={{ color: D.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>{item.label}</Text>
                      <Text style={{ color: item.color, fontWeight: '800', fontSize: 15, marginTop: 4 }}>{item.val}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}

            {/* Category Donut */}
            <View style={[styles.card, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: D.textPrimary }]}>Category Breakdown</Text>
              {catBreakdown.length > 0 ? (
                <>
                  <DonutChart data={catBreakdown.map((c) => ({ pct: c.pct, color: c.color }))} total={currentTotal} D={D} />
                  {catBreakdown.slice(0, 7).map((c, i) => (
                    <View key={i} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                      <Text style={{ flex: 1, color: D.textSec, fontSize: 13 }}>{c.emoji} {c.label}</Text>
                      <Text style={{ color: D.textPrimary, fontWeight: '600', fontSize: 13 }}>{sym}{c.amt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                      <Text style={{ color: D.textMuted, fontSize: 12, width: 38, textAlign: 'right' }}>{c.pct.toFixed(0)}%</Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={{ color: D.textMuted, textAlign: 'center', padding: 20 }}>No expenses this month yet</Text>
              )}
            </View>

            {/* Last 7 days */}
            <View style={[styles.card, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder, marginTop: 12 }]}>
              <Text style={[styles.cardTitle, { color: D.textPrimary }]}>Last 7 Days</Text>
              <View style={{ flexDirection: 'row', gap: 14, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#E45757' }} />
                  <Text style={{ color: D.textMuted, fontSize: 11 }}>Spent</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#3FAF8F' }} />
                  <Text style={{ color: D.textMuted, fontSize: 11 }}>Income</Text>
                </View>
              </View>
              <View style={styles.barChart}>
                {last7.map((d, i) => (
                  <View key={i} style={styles.barCol}>
                    {d.spent > 0 && <Text style={[styles.barVal, { color: D.textMuted }]}>{d.spent >= 1000 ? `${(d.spent / 1000).toFixed(1)}k` : d.spent}</Text>}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: BAR_H }}>
                      <View style={[styles.barTrack, { height: BAR_H, backgroundColor: D.cardBorder, flex: 1 }]}>
                        <View style={[styles.barFill, { height: (d.spent / maxBar) * BAR_H, backgroundColor: '#E45757', opacity: d.spent === Math.max(...last7.map((x) => x.spent)) ? 1 : 0.55 }]} />
                      </View>
                      {d.earned > 0 && (
                        <View style={[styles.barTrack, { height: BAR_H, backgroundColor: D.cardBorder, flex: 1 }]}>
                          <View style={[styles.barFill, { height: (d.earned / maxBar) * BAR_H, backgroundColor: '#3FAF8F' }]} />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.barLabel, { color: D.textMuted }]}>{d.label}</Text>
                    <Text style={[styles.barDate, { color: D.textMuted }]}>{d.date}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── TRENDS ── */}
        {activeTab === 'trends' && (
          <>
            <View style={[styles.card, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder, marginBottom: 12 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {[
                  { label: dayjs().subtract(2, 'month').format('MMM'), val: twoMonthsAgoTotal },
                  { label: dayjs().subtract(1, 'month').format('MMM'), val: lastTotal },
                  { label: dayjs().format('MMM'), val: currentTotal },
                ].map((m, i) => (
                  <View key={i} style={{ alignItems: 'center' }}>
                    <Text style={{ color: D.textSec, fontSize: 13 }}>{m.label}</Text>
                    <Text style={{ color: D.textPrimary, fontWeight: '800', fontSize: 16, marginTop: 4 }}>{sym}{m.val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 3, marginTop: 16 }}>
                {[twoMonthsAgoTotal, lastTotal, currentTotal].map((v, i) => (
                  <View key={i} style={{ flex: Math.max(v / threeMonthMax, 0.05), backgroundColor: ['rgba(108,99,255,0.4)', 'rgba(108,99,255,0.65)', '#6C63FF'][i], borderRadius: 4 }} />
                ))}
              </View>
            </View>
            <View style={[styles.card, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: D.textPrimary }]}>Category Trends — Last 3 Months</Text>
              <MonthOverMonthChart expenses={expenses} D={D} sym={sym} />
            </View>
          </>
        )}

        {/* ── INCOME ── */}
        {activeTab === 'income' && (
          <>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={[styles.summaryCard, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder, flex: 1 }]}>
                <Text style={{ fontSize: 20 }}>💰</Text>
                <Text style={[styles.summaryVal, { color: '#3FAF8F' }]}>+{sym}{currentMonthIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                <Text style={[styles.summaryLabel, { color: D.textMuted }]}>Income This Month</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder, flex: 1 }]}>
                <Text style={{ fontSize: 20 }}>{netBalance >= 0 ? '😊' : '😟'}</Text>
                <Text style={[styles.summaryVal, { color: netBalance >= 0 ? '#3FAF8F' : '#E45757' }]}>
                  {netBalance >= 0 ? '+' : ''}{sym}{Math.abs(netBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={[styles.summaryLabel, { color: D.textMuted }]}>{netBalance >= 0 ? 'Net Saved' : 'Overspent'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addIncomeBtn, { backgroundColor: D.cardBg, borderColor: 'rgba(63,175,143,0.4)', borderWidth: 1 }]}
              onPress={() => setShowAddIncome(true)}>
              <Text style={{ fontSize: 22 }}>➕</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#3FAF8F', fontWeight: '700', fontSize: 15 }}>Add Income / Money Received</Text>
                <Text style={{ color: D.textMuted, fontSize: 12, marginTop: 2 }}>Salary, freelance, gifts, refunds…</Text>
              </View>
              <Text style={{ color: '#3FAF8F', fontSize: 20 }}>›</Text>
            </TouchableOpacity>

            <View style={[styles.card, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder, marginTop: 12 }]}>
              <Text style={[styles.cardTitle, { color: D.textPrimary }]}>This Month's Income</Text>
              {currentIncomeEntries.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                  <Text style={{ fontSize: 40 }}>💸</Text>
                  <Text style={{ color: D.textPrimary, fontWeight: '700', marginTop: 10 }}>No income logged yet</Text>
                  <Text style={{ color: D.textMuted, fontSize: 13, marginTop: 4 }}>Tap above to add money received</Text>
                </View>
              ) : (
                currentIncomeEntries.map((entry) => {
                  const src = INCOME_SOURCES.find((s) => s.id === entry.source) || INCOME_SOURCES[5];
                  return (
                    <View key={entry.id} style={[styles.incomeRow, { borderColor: D.cardBorder }]}>
                      <View style={[styles.incomeIcon, { backgroundColor: src.color + '20' }]}>
                        <Text style={{ fontSize: 20 }}>{src.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: D.textPrimary, fontWeight: '600', fontSize: 14 }}>{entry.note || src.label}</Text>
                        <Text style={{ color: D.textMuted, fontSize: 12, marginTop: 2 }}>{src.label} · {dayjs(entry.date).format('DD MMM')}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={{ color: '#3FAF8F', fontWeight: '800', fontSize: 15 }}>+{sym}{entry.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                        <TouchableOpacity onPress={() => Alert.alert('Delete?', 'Remove this income entry?', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteIncomeEntry(entry.id) },
                        ])}>
                          <Text style={{ color: '#E45757', fontSize: 11 }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}


      </ScrollView>

      <AddIncomeModal visible={showAddIncome} onClose={() => setShowAddIncome(false)} colors={colors} D={D} isDark={isDark} sym={sym} />
    </View>
  );
}

const modal = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20 },
  title:      { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle:   { fontSize: 13, marginBottom: 20 },
  label:      { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  rupee:      { fontSize: 28, fontWeight: '700', marginRight: 6 },
  amtInput:   { fontSize: 40, fontWeight: '800', flex: 1 },
  sourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceChip: { width: '30%', alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  noteInput:  { borderRadius: 12, borderWidth: 1, padding: 12, minHeight: 44 },
  btnCancel:  { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  btnSave:    { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});

const styles = StyleSheet.create({
  header:       { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:  { fontSize: 20, fontWeight: '700' },
  headerSub:    { fontSize: 13, marginTop: 2 },
  netBadge:     { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  tabRow:       { flexDirection: 'row', borderBottomWidth: 1 },
  tab:          { flex: 1, paddingVertical: 11, alignItems: 'center' },
  tabText:      { fontSize: 11, fontWeight: '600' },
  summaryCard:  { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, elevation: 2 },
  summaryVal:   { fontSize: 14, fontWeight: '700' },
  summaryLabel: { fontSize: 10, textAlign: 'center' },
  card:         { borderRadius: 18, padding: 16, elevation: 2 },
  cardTitle:    { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  barChart:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 8 },
  barCol:       { alignItems: 'center', flex: 1 },
  barVal:       { fontSize: 9, marginBottom: 2 },
  barTrack:     { width: '100%', justifyContent: 'flex-end', borderRadius: 6, overflow: 'hidden' },
  barFill:      { width: '100%', borderRadius: 6 },
  barLabel:     { fontSize: 11, marginTop: 5 },
  barDate:      { fontSize: 9 },
  legendRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  legendDot:    { width: 10, height: 10, borderRadius: 5 },
  addIncomeBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16 },
  incomeRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  incomeIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});