import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useStore } from '../../store';
import { useTheme, useCurrency , useDesignTokens } from '../../hooks/useTheme';
import { CATEGORIES } from '../../constants';
import dayjs from 'dayjs';

export default function BudgetScreen({ navigation }: any) {
  const { colors } = useTheme();
  const D = useDesignTokens();
  const sym = useCurrency();
  const { user, setUser, budget, setBudget, getCategoryTotal, saveUserProfile } = useStore();

  const [totalBudget, setTotalBudget] = useState(
    user.monthlyBudget > 0 ? String(user.monthlyBudget) : ''
  );
  const [catBudgets, setCatBudgets] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    CATEGORIES.forEach((c) => { map[c.id] = String(budget?.categoryBudgets?.[c.id] || 0); });
    return map;
  });

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Profile');
  };

  const handleSave = async () => {
    const total = parseFloat(totalBudget) || 0;
    setUser({ monthlyBudget: total });
    await setBudget({
      month: dayjs().format('YYYY-MM'),
      totalBudget: total,
      categoryBudgets: Object.fromEntries(
        Object.entries(catBudgets).map(([k, v]) => [k, parseFloat(v) || 0])
      ),
    });
    await saveUserProfile();
    Alert.alert('✅ Saved', 'Budget updated!', [{ text: 'OK', onPress: handleBack }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[styles.header, { backgroundColor: D.headerBg, borderBottomWidth: 1, borderBottomColor: D.cardBorder }]}>
        <TouchableOpacity onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: D.headerText, fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: D.headerText }]}>Budget Planner 💰</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={{ color: D.accent, fontSize: 16, fontWeight: '700' }}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Monthly Total */}
        <View style={[styles.card, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Monthly Total Budget</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: D.accent }}>{sym}</Text>
            <TextInput
              style={[styles.amtInput, { color: colors.text }]}
              value={totalBudget}
              onChangeText={setTotalBudget}
              keyboardType="numeric"
              placeholder="30000"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
            {dayjs().format('MMMM YYYY')}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Budgets</Text>

        {CATEGORIES.map((cat) => {
          const spent = getCategoryTotal(cat.id);
          const budgetAmt = parseFloat(catBudgets[cat.id] || '0');
          const pct = budgetAmt > 0 ? Math.min((spent / budgetAmt) * 100, 100) : 0;
          const isOver = spent > budgetAmt && budgetAmt > 0;
          const isNear = pct > 75 && !isOver;

          return (
            <View key={cat.id} style={[styles.catCard, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: budgetAmt > 0 ? 10 : 0 }}>
                <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                  <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                </View>
                <Text style={{ flex: 1, color: colors.text, fontWeight: '600' }}>{cat.label}</Text>
                <View style={[styles.inputWrap, { backgroundColor: D.inputBg, borderWidth: 1, borderColor: D.inputBorder }]}>
                  <Text style={{ color: D.textSec, fontSize: 12 }}>{sym}</Text>
                  <TextInput
                    style={{ color: colors.text, fontSize: 15, fontWeight: '700', minWidth: 60 }}
                    value={catBudgets[cat.id]}
                    onChangeText={(v) => setCatBudgets((p) => ({ ...p, [cat.id]: v }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
              {budgetAmt > 0 && (
                <>
                  <View style={[styles.progressTrack, { backgroundColor: D.cardBorder }]}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: isOver ? '#EF4444' : isNear ? '#F59E0B' : cat.color }]} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ color: colors.textTertiary, fontSize: 11 }}>
                      Spent: {sym}{spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </Text>
                    <Text style={{ fontSize: 11, color: isOver ? '#EF4444' : isNear ? '#F59E0B' : D.accent }}>
                      {isOver ? '⚠️ Over budget' : `${pct.toFixed(0)}%`}
                    </Text>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  card: { borderRadius: 18, padding: 20, marginBottom: 16, elevation: 2 },
  cardLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  amtInput: { fontSize: 38, fontWeight: '800', flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  catCard: { borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1 },
  catIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});