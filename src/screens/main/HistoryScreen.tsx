import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useStore } from '../../store';
import { useTheme, useCurrency , useDesignTokens } from '../../hooks/useTheme';
import { CATEGORIES } from '../../constants';
import { Expense } from '../../types';
import dayjs from 'dayjs';

export default function HistoryScreen({ navigation }: any) {
  const { colors } = useTheme();
  const D = useDesignTokens();
  const sym = useCurrency();
  const { expenses, deleteExpense } = useStore();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  const filtered = useMemo(() => {
    let r = [...expenses];
    if (search) r = r.filter((e) => e.note.toLowerCase().includes(search.toLowerCase()) || e.category.includes(search.toLowerCase()));
    if (filterCat !== 'all') r = r.filter((e) => e.category === filterCat);
    return r;
  }, [expenses, search, filterCat]);

  const grouped = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    filtered.forEach((e) => {
      const k = dayjs(e.date).format('YYYY-MM-DD');
      if (!map[k]) map[k] = [];
      map[k].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => dayjs(b).unix() - dayjs(a).unix());
  }, [filtered]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <View style={[{ flex: 1, backgroundColor: D.bg }]}>
      <View style={[styles.header, { backgroundColor: D.headerBg }]}>
        <Text style={styles.headerTitle}>History 📜</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{filtered.length} transactions</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: D.inputBg }]}>
        <View style={[styles.searchInner, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={[{ flex: 1, color: colors.text, fontSize: 14 }]}
            placeholder="Search..." placeholderTextColor={colors.textTertiary}
            value={search} onChangeText={setSearch}
          />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: colors.textTertiary }}>✕</Text></TouchableOpacity> : null}
        </View>
      </View>

      {/* Total */}
      <View style={[styles.totalBar, { backgroundColor: D.accentDim }]}>
        <Text style={[{ color: D.accent, fontWeight: '600', fontSize: 13 }]}>Total: {sym}{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
      </View>

      <FlatList
        data={grouped}
        keyExtractor={([d]) => d}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={[{ color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 12 }]}>No transactions</Text>
          </View>
        }
        renderItem={({ item: [date, exps] }) => (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={[{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }]}>
                {dayjs(date).isSame(dayjs(), 'day') ? 'Today' : dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day') ? 'Yesterday' : dayjs(date).format('dddd, MMM D')}
              </Text>
              <Text style={[{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }]}>
                {sym}{exps.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            </View>
            {exps.map((e) => {
              const cat = CATEGORIES.find((c) => c.id === e.category);
              return (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.expRow, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}
                  onLongPress={() => Alert.alert('Delete', 'Delete this expense?', [
                    { text: 'Cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(e.id) },
                  ])}
                >
                  <View style={[styles.catIcon, { backgroundColor: (cat?.color || '#999') + '20' }]}>
                    <Text style={{ fontSize: 20 }}>{cat?.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ color: colors.text, fontWeight: '600', fontSize: 14 }]} numberOfLines={1}>{e.note || cat?.label}</Text>
                    <Text style={[{ color: colors.textTertiary, fontSize: 12, marginTop: 2 }]}>{e.time} · {e.paymentMethod.toUpperCase()}{e.isRecurring ? ' · 🔄' : ''}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[{ color: colors.danger, fontWeight: '700', fontSize: 14 }]}>-{sym}{e.amount.toLocaleString('en-IN')}</Text>
                    <View style={[{ backgroundColor: (cat?.color || '#999') + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 }]}>
                      <Text style={[{ color: cat?.color || '#999', fontSize: 10, fontWeight: '600' }]}>{cat?.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 16, paddingHorizontal: 20, gap: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  searchBar: { paddingHorizontal: 16, paddingVertical: 10 },
  searchInner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 42, borderRadius: 12 },
  totalBar: { paddingHorizontal: 16, paddingVertical: 8 },
  expRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, gap: 12, elevation: 1 },
  catIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
