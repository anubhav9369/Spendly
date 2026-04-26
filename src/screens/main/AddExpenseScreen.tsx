import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Modal } from 'react-native';
import { useStore } from '../../store';
import { useTheme, useCurrency , useDesignTokens } from '../../hooks/useTheme';
import { CATEGORIES, PAYMENT_METHODS, AUTO_CATEGORY_MAP } from '../../constants';
import { CategoryType, PaymentMethod, IncomeSource } from '../../types';
import dayjs from 'dayjs';

const INCOME_SOURCES: { id: IncomeSource; label: string; emoji: string; color: string }[] = [
  { id: 'salary',     label: 'Salary',     emoji: '💼', color: '#3FAF8F' },
  { id: 'freelance',  label: 'Freelance',  emoji: '💻', color: '#6D5DF6' },
  { id: 'gift',       label: 'Gift',       emoji: '🎁', color: '#F472B6' },
  { id: 'refund',     label: 'Refund',     emoji: '↩️', color: '#43CBFF' },
  { id: 'investment', label: 'Investment', emoji: '📈', color: '#D4A937' },
  { id: 'other',      label: 'Other',      emoji: '💰', color: '#AEB6BF' },
];

// Simple inline calendar component — no external dependency needed
function InlineCalendar({ value, onChange, onClose, colors, D, isDark }: {
  value: string; onChange: (d: string) => void; onClose: () => void;
  colors: any; D: any; isDark: boolean;
}) {
  const initial = dayjs(value).isValid() ? dayjs(value) : dayjs();
  const [viewing, setViewing] = useState(initial.startOf('month'));

  const today = dayjs();
  const daysInMonth = viewing.daysInMonth();
  const firstDayOfWeek = viewing.startOf('month').day(); // 0=Sun

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const selectedDate = dayjs(value).isValid() ? dayjs(value) : null;
  const accent = '#3FAF8F';

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={cal.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[cal.container, { backgroundColor: isDark ? '#0C1F1B' : '#FFF', borderColor: isDark ? 'rgba(63,175,143,0.2)' : '#C4D9D4' }]}>
          {/* Month navigation */}
          <View style={cal.monthRow}>
            <TouchableOpacity onPress={() => setViewing(viewing.subtract(1, 'month'))} style={cal.navBtn}>
              <Text style={{ color: accent, fontSize: 20, fontWeight: '700' }}>‹</Text>
            </TouchableOpacity>
            <Text style={[cal.monthLabel, { color: colors.text }]}>{viewing.format('MMMM YYYY')}</Text>
            <TouchableOpacity onPress={() => setViewing(viewing.add(1, 'month'))} style={cal.navBtn}>
              <Text style={{ color: accent, fontSize: 20, fontWeight: '700' }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={cal.weekRow}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <Text key={d} style={[cal.weekDay, { color: colors.textSecondary }]}>{d}</Text>
            ))}
          </View>

          {/* Days grid */}
          <View style={cal.grid}>
            {days.map((d, i) => {
              if (!d) return <View key={`e-${i}`} style={cal.dayCell} />;
              const date = viewing.date(d);
              const isSel = selectedDate && date.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
              const isToday = date.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');
              const isFuture = date.isAfter(today, 'day');
              return (
                <TouchableOpacity
                  key={d}
                  style={[cal.dayCell, isSel && { backgroundColor: accent, borderRadius: 10 }, isToday && !isSel && { borderWidth: 1, borderColor: accent, borderRadius: 10 }]}
                  onPress={() => { if (!isFuture) { onChange(date.format('YYYY-MM-DD')); onClose(); } }}
                  disabled={isFuture}
                >
                  <Text style={{ color: isSel ? '#FFF' : isFuture ? (isDark ? '#2D4A44' : '#C4D9D4') : colors.text, fontWeight: isSel || isToday ? '700' : '400', fontSize: 14 }}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={[cal.todayBtn, { borderColor: accent }]} onPress={() => { onChange(today.format('YYYY-MM-DD')); onClose(); }}>
            <Text style={{ color: accent, fontWeight: '700', fontSize: 13 }}>Today</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function AddExpenseScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const D = useDesignTokens();
  const sym = useCurrency();
  const { addExpense, addIncomeEntry, expenses } = useStore();

  // Mode: expense or income
  const [mode, setMode] = useState<'expense' | 'income'>('expense');

  // Expense fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('food');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [payment, setPayment] = useState<PaymentMethod>('upi');
  const [isRecurring, setIsRecurring] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [showCal, setShowCal] = useState(false);

  // Income fields
  const [incAmount, setIncAmount] = useState('');
  const [incSource, setIncSource] = useState<IncomeSource>('other');
  const [incNote, setIncNote] = useState('');
  const [incDate, setIncDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [showIncCal, setShowIncCal] = useState(false);

  const selCat = CATEGORIES.find((c) => c.id === category)!;

  const handleNote = (t: string) => {
    setNote(t);
    const lower = t.toLowerCase();
    for (const [kw, cat] of Object.entries(AUTO_CATEGORY_MAP)) {
      if (lower.includes(kw)) { setCategory(cat); break; }
    }
  };

  const handleSaveExpense = () => {
    if (!amount || isNaN(parseFloat(amount))) { Alert.alert('Error', 'Enter a valid amount'); return; }
    addExpense({
      amount: parseFloat(amount), category, note, date,
      time: dayjs().format('HH:mm'), paymentMethod: payment, isRecurring,
    });
    setAmount(''); setNote(''); setCategory('food'); setPayment('upi'); setIsRecurring(false);
    Alert.alert('✅ Added!', `${sym}${amount} expense saved`, [
      { text: 'Add Another' },
      { text: 'Go Home', onPress: () => navigation.navigate('Home') },
    ]);
  };

  const handleSaveIncome = async () => {
    if (!incAmount || isNaN(parseFloat(incAmount)) || parseFloat(incAmount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount'); return;
    }
    await addIncomeEntry({
      amount: parseFloat(incAmount), source: incSource,
      note: incNote, date: incDate, time: dayjs().format('HH:mm'),
    });
    setIncAmount(''); setIncNote(''); setIncSource('other'); setIncDate(dayjs().format('YYYY-MM-DD'));
    Alert.alert('✅ Money Added!', `+${sym}${incAmount} added to your wallet`, [
      { text: 'Add Another' },
      { text: 'Go Home', onPress: () => navigation.navigate('Home') },
    ]);
  };

  const chipTextColor = isDark ? '#E8F5F2' : colors.text;

  return (
    <View style={[{ flex: 1, backgroundColor: D.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: D.headerBg }]}>
        <Text style={[styles.headerTitle, { color: D.headerText }]}>
          {mode === 'expense' ? 'Add Expense' : 'Add Money Received'}
        </Text>
      </View>

      {/* Mode toggle */}
      <View style={[styles.modeToggleWrap, { backgroundColor: D.cardBg, borderBottomColor: D.cardBorder }]}>
        {([
          { key: 'expense', label: '➖ Expense',  color: '#E45757' },
          { key: 'income',  label: '➕ Money In', color: '#3FAF8F' },
        ] as const).map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeTab, mode === m.key && { borderBottomColor: m.color, borderBottomWidth: 2.5 }]}
            onPress={() => setMode(m.key)}
          >
            <Text style={[styles.modeTabText, { color: mode === m.key ? m.color : colors.textSecondary }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── EXPENSE FORM ── */}
      {mode === 'expense' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          {/* Amount */}
          <View style={[styles.amountCard, { backgroundColor: D.cardBg }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.sym, { color: '#E45757' }]}>{sym}</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amount} onChangeText={setAmount}
                keyboardType="decimal-pad" placeholder="0"
                placeholderTextColor={colors.textTertiary} autoFocus
              />
            </View>
          </View>

          {/* Recent quick-add */}
          {expenses.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Quick Add (Recent)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {expenses.slice(0, 5).map((e) => {
                    const c = CATEGORIES.find((x) => x.id === e.category);
                    return (
                      <TouchableOpacity key={e.id}
                        style={[styles.chip, { backgroundColor: isDark ? '#132922' : D.cardBg, borderColor: isDark ? 'rgba(63,175,143,0.25)' : D.cardBorder }]}
                        onPress={() => { setAmount(String(e.amount)); setCategory(e.category); setNote(e.note); setPayment(e.paymentMethod); }}>
                        <Text style={{ color: chipTextColor, fontWeight: '500', fontSize: 13 }}>{c?.emoji} {sym}{e.amount}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Category */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <TouchableOpacity style={[styles.selector, { backgroundColor: D.cardBg, borderColor: D.cardBorder }]} onPress={() => setShowCats(!showCats)}>
              <View style={[styles.catIcon, { backgroundColor: selCat.color + '20' }]}><Text style={{ fontSize: 20 }}>{selCat.emoji}</Text></View>
              <Text style={[{ flex: 1, color: colors.text, fontWeight: '500' }]}>{selCat.label}</Text>
              <Text style={{ color: colors.textTertiary }}>{showCats ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showCats && (
              <View style={[styles.catGrid, { backgroundColor: D.inputBg }]}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c.id}
                    style={[styles.catGridItem, { backgroundColor: c.color + '20', borderColor: category === c.id ? c.color : 'transparent', borderWidth: 2 }]}
                    onPress={() => { setCategory(c.id); setShowCats(false); }}>
                    <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
                    <Text style={{ color: colors.text, fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 4 }}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Note</Text>
            <View style={[styles.noteInput, { backgroundColor: D.cardBg, borderColor: D.cardBorder }]}>
              <TextInput
                style={[{ color: colors.text, fontSize: 15 }]}
                value={note} onChangeText={handleNote}
                placeholder="e.g. Uber, Pizza Hut, Hostel Fee..."
                placeholderTextColor={colors.textTertiary} multiline
              />
            </View>
            {note.length > 0 && (
              <Text style={{ color: D.accent, fontSize: 11, marginTop: 4 }}>🤖 Auto-detected: {selCat.label}</Text>
            )}
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
            <TouchableOpacity
              style={[styles.selector, { backgroundColor: D.cardBg, borderColor: D.cardBorder }]}
              onPress={() => setShowCal(true)} activeOpacity={0.8}>
              <Text style={{ fontSize: 18 }}>📅</Text>
              <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' }}>
                {dayjs(date).isValid() ? dayjs(date).format('DD MMM YYYY, dddd') : date}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Change ›</Text>
            </TouchableOpacity>
          </View>

          {showCal && (
            <InlineCalendar value={date} onChange={setDate} onClose={() => setShowCal(false)} colors={colors} D={D} isDark={isDark} />
          )}

          {/* Payment */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Payment Method</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {PAYMENT_METHODS.map((pm) => (
                <TouchableOpacity key={pm.id}
                  style={[styles.pmChip, { backgroundColor: payment === pm.id ? D.btnPrimary : D.cardBg, borderColor: payment === pm.id ? D.accent : D.cardBorder }]}
                  onPress={() => setPayment(pm.id as PaymentMethod)}>
                  <Text style={{ fontSize: 16 }}>{pm.emoji}</Text>
                  <Text style={{ color: payment === pm.id ? '#FFF' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>{pm.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recurring */}
          <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Repeat Monthly</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Auto-log every month</Text>
            </View>
            <TouchableOpacity style={[styles.toggle, { backgroundColor: isRecurring ? D.accent : D.cardBorder }]} onPress={() => setIsRecurring(!isRecurring)}>
              <View style={[styles.toggleThumb, { transform: [{ translateX: isRecurring ? 22 : 2 }] }]} />
            </TouchableOpacity>
          </View>

          {/* Save */}
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: D.btnPrimary, borderWidth: 1, borderColor: D.btnPrimaryBorder }]} onPress={handleSaveExpense}>
            <Text style={[styles.saveBtnText, { color: D.btnPrimaryText }]}>💾 Save Expense</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── INCOME / MONEY IN FORM ── */}
      {mode === 'income' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          {/* Info banner */}
          <View style={[styles.infoBanner, { backgroundColor: 'rgba(63,175,143,0.08)', borderColor: 'rgba(63,175,143,0.25)' }]}>
            <Text style={{ fontSize: 18 }}>💡</Text>
            <Text style={{ flex: 1, color: '#3FAF8F', fontSize: 13 }}>
              Add any money you received — salary, a friend paying you back, gifts, etc. It will be added to your wallet balance.
            </Text>
          </View>

          {/* Amount */}
          <View style={[styles.amountCard, { backgroundColor: D.cardBg }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Amount Received</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.sym, { color: '#3FAF8F' }]}>{sym}</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={incAmount} onChangeText={setIncAmount}
                keyboardType="decimal-pad" placeholder="0"
                placeholderTextColor={colors.textTertiary} autoFocus
              />
            </View>
          </View>

          {/* Source */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Source</Text>
            <View style={[styles.catGrid, { backgroundColor: D.inputBg }]}>
              {INCOME_SOURCES.map((s) => (
                <TouchableOpacity key={s.id}
                  style={[styles.catGridItem, { backgroundColor: s.color + '20', borderColor: incSource === s.id ? s.color : 'transparent', borderWidth: 2 }]}
                  onPress={() => setIncSource(s.id)}>
                  <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
                  <Text style={{ color: colors.text, fontSize: 10, fontWeight: '600', textAlign: 'center', marginTop: 4 }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Note (optional)</Text>
            <View style={[styles.noteInput, { backgroundColor: D.cardBg, borderColor: D.cardBorder }]}>
              <TextInput
                style={[{ color: colors.text, fontSize: 15 }]}
                value={incNote} onChangeText={setIncNote}
                placeholder="e.g. Rahul paid me back, April salary..."
                placeholderTextColor={colors.textTertiary} multiline
              />
            </View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
            <TouchableOpacity
              style={[styles.selector, { backgroundColor: D.cardBg, borderColor: D.cardBorder }]}
              onPress={() => setShowIncCal(true)} activeOpacity={0.8}>
              <Text style={{ fontSize: 18 }}>📅</Text>
              <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' }}>
                {dayjs(incDate).isValid() ? dayjs(incDate).format('DD MMM YYYY, dddd') : incDate}
              </Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>Change ›</Text>
            </TouchableOpacity>
          </View>

          {showIncCal && (
            <InlineCalendar value={incDate} onChange={setIncDate} onClose={() => setShowIncCal(false)} colors={colors} D={D} isDark={isDark} />
          )}

          {/* Save */}
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#163D33', borderWidth: 1, borderColor: 'rgba(63,175,143,0.4)' }]} onPress={handleSaveIncome}>
            <Text style={[styles.saveBtnText, { color: '#3FAF8F' }]}>➕ Add to Wallet</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const cal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  container: { width: 320, borderRadius: 20, padding: 16, borderWidth: 1, elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { padding: 6, width: 36, alignItems: 'center' },
  monthLabel: { fontSize: 16, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100/7}%` as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  todayBtn: { marginTop: 12, borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
});

const styles = StyleSheet.create({
  modeToggleWrap: { flexDirection: 'row', borderBottomWidth: 1 },
  modeTab:        { flex: 1, paddingVertical: 13, alignItems: 'center' },
  modeTabText:    { fontSize: 14, fontWeight: '700' },
  infoBanner:     { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, padding: 14, borderRadius: 14, borderWidth: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  amountCard: { margin: 16, borderRadius: 20, padding: 20, elevation: 2 },
  sym: { fontSize: 32, fontWeight: '700' },
  amountInput: { fontSize: 48, fontWeight: '800', flex: 1 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  catIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12, borderRadius: 14, marginTop: 8 },
  catGridItem: { width: '22%', aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 4 },
  noteInput: { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 70 },
  pmChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  toggle: { width: 48, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },
  saveBtn: { margin: 16, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});