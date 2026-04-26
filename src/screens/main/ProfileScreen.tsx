import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Platform, Modal, TextInput, ActivityIndicator, Share,
} from 'react-native';
import { signOut, deleteUser } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { auth } from '../../services/firebase';
import { useStore } from '../../store';
import { useTheme, useDesignTokens } from '../../hooks/useTheme';
import { CATEGORIES } from '../../constants';
import dayjs from 'dayjs';

function buildCSV(expenses: any[], month: string): string {
  const header = 'Date,Time,Category,Note,Amount,Payment Method,Recurring\n';
  const rows = expenses
    .filter((e) => dayjs(e.date).format('YYYY-MM') === month)
    .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
    .map((e) => {
      const cat = CATEGORIES.find((c) => c.id === e.category)?.label || e.category;
      const note = `"${(e.note || '').replace(/"/g, '""')}"`;
      return `${e.date},${e.time},${cat},${note},${e.amount},${e.paymentMethod},${e.isRecurring ? 'Yes' : 'No'}`;
    })
    .join('\n');
  return header + rows;
}

function EditNumberModal({ visible, title, subtitle, value, onClose, onSave }: {
  visible: boolean; title: string; subtitle: string;
  value: string; onClose: () => void; onSave: (v: string) => void;
}) {
  const D = useDesignTokens();
  const [val, setVal] = useState(value);
  React.useEffect(() => { if (visible) setVal(value); }, [visible, value]);
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ms.overlay}>
        <View style={[ms.box, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
          <Text style={[ms.title, { color: D.textPrimary }]}>{title}</Text>
          <Text style={[ms.sub, { color: D.textSec }]}>{subtitle}</Text>
          <View style={[ms.inputRow, { backgroundColor: D.inputBg, borderColor: D.cardBorder }]}>
            <Text style={[ms.rupee, { color: D.accent }]}>{'₹'}</Text>
            <TextInput
              style={[ms.input, { color: D.textPrimary }]}
              value={val} onChangeText={setVal}
              keyboardType="numeric" autoFocus
              placeholderTextColor={D.textMuted}
            />
          </View>
          <View style={ms.btns}>
            <TouchableOpacity style={[ms.btn, { backgroundColor: D.inputBg }]} onPress={onClose}>
              <Text style={{ color: D.textSec, fontWeight: '600' }}>{'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ms.btn, { backgroundColor: D.btnPrimary, borderWidth: 1, borderColor: D.btnPrimaryBorder }]} onPress={() => onSave(val)}>
              <Text style={{ color: D.btnPrimaryText, fontWeight: '700' }}>{'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const D = useDesignTokens();
  const { user, setUser, setTheme, logout, saveUserProfile, expenses } = useStore();

  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [editIncome, setEditIncome] = useState(false);
  const [editBudget, setEditBudget] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour, setNotifHour] = useState('21');
  const [notifMin, setNotifMin] = useState('00');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const currentMonth = dayjs().format('YYYY-MM');
  const monthLabel = dayjs().format('MMMM YYYY');
  const monthExpenses = expenses.filter((e) => dayjs(e.date).format('YYYY-MM') === currentMonth);
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const savingsRate = user.monthlyIncome > 0
    ? Math.max(0, Math.min(100, ((user.monthlyIncome - monthTotal) / user.monthlyIncome) * 100))
    : null;

  const saveColor = savingsRate !== null
    ? (savingsRate >= 20 ? '#22C55E' : savingsRate >= 10 ? '#F59E0B' : '#EF4444')
    : '#22C55E';
  const saveBg = savingsRate !== null
    ? (savingsRate >= 20 ? '#22C55E20' : savingsRate >= 10 ? '#F59E0B20' : '#EF444420')
    : '#22C55E20';

  const handleSaveName = async () => {
    if (!newName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setUser({ name: newName.trim() });
    setEditName(false);
    await saveUserProfile();
  };

  const handleSaveIncome = async (val: string) => {
    setUser({ monthlyIncome: parseFloat(val) || 0 });
    setEditIncome(false);
    setTimeout(saveUserProfile, 50);
  };

  const handleSaveBudget = async (val: string) => {
    setUser({ monthlyBudget: parseFloat(val) || 0 });
    setEditBudget(false);
    setTimeout(saveUserProfile, 50);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await signOut(auth); logout(); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This will permanently delete your account and all your data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Account', style: 'destructive',
        onPress: () => {
          Alert.alert('Are you absolutely sure?', 'All expenses, budgets and settings will be erased forever.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Yes, Delete', style: 'destructive',
              onPress: async () => {
                try {
                  const uid = auth.currentUser?.uid;
                  if (uid) {
                    for (const sub of ['expenses', 'quickAdds', 'settings']) {
                      const snap = await getDocs(collection(db, 'users', uid, sub));
                      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
                    }
                    await deleteDoc(doc(db, 'users', uid));
                  }
                  if (auth.currentUser) await deleteUser(auth.currentUser);
                  logout();
                } catch (err: any) {
                  if (err?.code === 'auth/requires-recent-login') {
                    Alert.alert('Re-authentication Required', 'Please log out and log back in, then try again.');
                  } else {
                    Alert.alert('Error', 'Failed to delete account. Please try again.');
                  }
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const handleDownload = async () => {
    if (monthExpenses.length === 0) { Alert.alert('No Data', `No expenses for ${monthLabel}.`); return; }
    setDownloading(true);
    try {
      const csv = buildCSV(expenses, currentMonth);
      const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
      await Share.share({
        title: `Spendly ${monthLabel} Report`,
        message: `Spendly — ${monthLabel} Report\nTotal: ${user.currency} ${total.toLocaleString('en-IN')}\nTransactions: ${monthExpenses.length}\n\n--- CSV ---\n${csv}`,
      });
    } catch { Alert.alert('Error', 'Could not share the report.'); }
    finally { setDownloading(false); }
  };

  const handleNotifToggle = (val: boolean) => {
    setNotifEnabled(val);
    if (val) {
      Alert.alert('Daily Reminder On', `You will be reminded at ${notifHour}:${notifMin} every day to log your expenses.`, [{ text: 'Got it' }]);
    }
  };

  const handleSaveTime = () => {
    const h = parseInt(notifHour);
    const m = parseInt(notifMin);
    if (isNaN(h) || h < 0 || h > 23) { Alert.alert('Invalid', 'Hour must be 0 to 23'); return; }
    if (isNaN(m) || m < 0 || m > 59) { Alert.alert('Invalid', 'Minutes must be 0 to 59'); return; }
    setNotifHour(String(h).padStart(2, '0'));
    setNotifMin(String(m).padStart(2, '0'));
    setShowTimePicker(false);
    Alert.alert('Reminder Updated', `Daily reminder set for ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[styles.header, { backgroundColor: D.headerBg }]}>
        <Text style={[styles.headerTitle, { color: D.headerText }]}>{'Profile'}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={[styles.avatar, { backgroundColor: D.btnPrimary, borderWidth: 1, borderColor: D.btnPrimaryBorder }]}>
            <Text style={{ fontSize: 36, color: D.accent }}>{user.name[0]?.toUpperCase()}</Text>
          </View>
          <Text style={{ color: D.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 10 }}>{user.name}</Text>
          <Text style={{ color: D.textSec, fontSize: 12, marginTop: 2, paddingHorizontal: 20, textAlign: 'center' }} numberOfLines={2}>{user.email}</Text>
          {savingsRate !== null && (
            <View style={[styles.savingsBadge, { backgroundColor: saveBg }]}>
              <Text style={{ color: saveColor, fontWeight: '700', fontSize: 13 }}>
                {`Saving ${savingsRate.toFixed(1)}% this month`}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
          <TouchableOpacity style={[styles.row, { borderBottomColor: D.cardBorder, borderBottomWidth: 1 }]} onPress={() => setEditBudget(true)}>
            <View>
              <Text style={[styles.rowLabel, { color: D.textSec }]}>{'Budget'}</Text>
              <Text style={{ color: D.textMuted, fontSize: 11 }}>{'Tap to edit'}</Text>
            </View>
            <Text style={[styles.rowValue, { color: D.accent }]}>{`\u20B9${(user.monthlyBudget || 0).toLocaleString('en-IN')} \u203A`}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => setEditIncome(true)}>
            <View>
              <Text style={[styles.rowLabel, { color: D.textSec }]}>{'Monthly Income'}</Text>
              <Text style={{ color: D.textMuted, fontSize: 11 }}>{'Used for savings rate · Tap to edit'}</Text>
            </View>
            <Text style={[styles.rowValue, { color: D.accent }]}>
              {user.monthlyIncome > 0 ? `\u20B9${user.monthlyIncome.toLocaleString('en-IN')}` : 'Set \u203A'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
          <Text style={[styles.groupTitle, { color: D.textMuted }]}>{'SETTINGS'}</Text>

          <View style={[styles.settingRow, { borderTopColor: D.cardBorder }]}>
            <Text style={{ fontSize: 20 }}>{'🌙'}</Text>
            <Text style={[styles.settingLabel, { color: D.textPrimary }]}>{'Dark Mode'}</Text>
            <Switch value={isDark} onValueChange={(v) => setTheme(v ? 'dark' : 'light')} trackColor={{ false: '#ccc', true: D.accent }} />
          </View>

          <View style={[styles.settingRow, { borderTopColor: D.cardBorder }]}>
            <Text style={{ fontSize: 20 }}>{'🔔'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: D.textPrimary, fontSize: 15, fontWeight: '500' }}>{'Daily Reminder'}</Text>
              <Text style={{ color: D.textMuted, fontSize: 11, marginTop: 2 }}>
                {notifEnabled ? `Reminds you at ${notifHour}:${notifMin} every day` : 'Get reminded to log expenses daily'}
              </Text>
            </View>
            <Switch value={notifEnabled} onValueChange={handleNotifToggle} trackColor={{ false: '#ccc', true: D.accent }} />
          </View>

          {notifEnabled && (
            <TouchableOpacity style={[styles.settingRow, { borderTopColor: D.cardBorder }]} onPress={() => setShowTimePicker(true)}>
              <Text style={{ fontSize: 20 }}>{'⏰'}</Text>
              <Text style={[styles.settingLabel, { color: D.textPrimary }]}>{'Reminder Time'}</Text>
              <Text style={{ color: D.accent, fontWeight: '700', fontSize: 15 }}>{`${notifHour}:${notifMin} \u203A`}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.settingRow, { borderTopColor: D.cardBorder }]} onPress={() => { setNewName(user.name); setEditName(true); }}>
            <Text style={{ fontSize: 20 }}>{'✏️'}</Text>
            <Text style={[styles.settingLabel, { color: D.textPrimary }]}>{'Edit Name'}</Text>
            <Text style={{ color: D.textMuted }}>{'\u203A'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingRow, { borderTopColor: D.cardBorder }]} onPress={() => navigation.navigate('Budget')}>
            <Text style={{ fontSize: 20 }}>{'💰'}</Text>
            <Text style={[styles.settingLabel, { color: D.textPrimary }]}>{'Budget Planner'}</Text>
            <Text style={{ color: D.textMuted }}>{'\u203A'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingRow, { borderTopColor: D.cardBorder }]} onPress={handleDownload} disabled={downloading} activeOpacity={0.7}>
            <Text style={{ fontSize: 20 }}>{'📥'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: D.textPrimary, fontSize: 15, fontWeight: '500' }}>{'Download Month History'}</Text>
              <Text style={{ color: D.textMuted, fontSize: 11, marginTop: 2 }}>{`${monthLabel} · ${monthExpenses.length} transactions`}</Text>
            </View>
            {downloading
              ? <ActivityIndicator size="small" color={D.accent} />
              : <Text style={{ color: D.textMuted }}>{'\u203A'}</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]} onPress={handleLogout}>
          <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>{'🚪  Logout'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: '#EF444430' }]} onPress={handleDeleteAccount}>
          <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{'Delete Account'}</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={{ color: D.textMuted, fontSize: 12, textAlign: 'center' }}>{'Spendly v1.0.0'}</Text>
        </View>

      </ScrollView>

      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={[ms.box, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
            <Text style={[ms.title, { color: D.textPrimary }]}>{'Set Reminder Time'}</Text>
            <Text style={[ms.sub, { color: D.textSec }]}>{'You will get a daily notification at this time to log your expenses.'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              <View style={[ms.timeBox, { backgroundColor: D.inputBg, borderColor: D.cardBorder }]}>
                <TextInput style={[ms.timeInput, { color: D.textPrimary }]} value={notifHour} onChangeText={setNotifHour} keyboardType="number-pad" maxLength={2} placeholderTextColor={D.textMuted} placeholder="21" />
                <Text style={{ color: D.textMuted, fontSize: 11 }}>{'Hour (0-23)'}</Text>
              </View>
              <Text style={{ color: D.textPrimary, fontSize: 30, fontWeight: '800' }}>{':'}</Text>
              <View style={[ms.timeBox, { backgroundColor: D.inputBg, borderColor: D.cardBorder }]}>
                <TextInput style={[ms.timeInput, { color: D.textPrimary }]} value={notifMin} onChangeText={setNotifMin} keyboardType="number-pad" maxLength={2} placeholderTextColor={D.textMuted} placeholder="00" />
                <Text style={{ color: D.textMuted, fontSize: 11 }}>{'Min (0-59)'}</Text>
              </View>
            </View>
            <View style={ms.btns}>
              <TouchableOpacity style={[ms.btn, { backgroundColor: D.inputBg }]} onPress={() => setShowTimePicker(false)}>
                <Text style={{ color: D.textSec, fontWeight: '600' }}>{'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ms.btn, { backgroundColor: D.btnPrimary, borderWidth: 1, borderColor: D.btnPrimaryBorder }]} onPress={handleSaveTime}>
                <Text style={{ color: D.btnPrimaryText, fontWeight: '700' }}>{'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editName} transparent animationType="fade">
        <View style={ms.overlay}>
          <View style={[ms.box, { backgroundColor: D.cardBg, borderWidth: 1, borderColor: D.cardBorder }]}>
            <Text style={[ms.title, { color: D.textPrimary }]}>{'Edit Name'}</Text>
            <TextInput
              style={[ms.input, ms.nameinput, { color: D.textPrimary, borderColor: D.cardBorder, backgroundColor: D.inputBg }]}
              value={newName} onChangeText={setNewName}
              placeholder="Your name" placeholderTextColor={D.textMuted} autoFocus
            />
            <View style={ms.btns}>
              <TouchableOpacity style={[ms.btn, { backgroundColor: D.inputBg }]} onPress={() => setEditName(false)}>
                <Text style={{ color: D.textSec, fontWeight: '600' }}>{'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ms.btn, { backgroundColor: D.btnPrimary, borderWidth: 1, borderColor: D.btnPrimaryBorder }]} onPress={handleSaveName}>
                <Text style={{ color: D.btnPrimaryText, fontWeight: '700' }}>{'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <EditNumberModal visible={editIncome} title="Monthly Income" subtitle="Used to calculate your savings rate. Not shared with anyone." value={user.monthlyIncome > 0 ? String(user.monthlyIncome) : ''} onClose={() => setEditIncome(false)} onSave={handleSaveIncome} />
      <EditNumberModal visible={editBudget} title="Monthly Budget" subtitle="Your total spending limit for the month." value={user.monthlyBudget > 0 ? String(user.monthlyBudget) : ''} onClose={() => setEditBudget(false)} onSave={handleSaveBudget} />

    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  savingsBadge: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  sectionCard: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '700' },
  groupTitle: { fontSize: 11, fontWeight: '700', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, letterSpacing: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderTopWidth: 1 },
  settingLabel: { flex: 1, fontSize: 15 },
  actionBtn: { alignItems: 'center', justifyContent: 'center', padding: 16, marginHorizontal: 16, borderRadius: 14, marginBottom: 8, borderWidth: 1 },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  box: { width: '100%', borderRadius: 20, padding: 24 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  sub: { fontSize: 13, marginBottom: 20, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 52, marginBottom: 20 },
  rupee: { fontSize: 20, fontWeight: '700', marginRight: 8 },
  input: { flex: 1, fontSize: 20, fontWeight: '700' },
  nameinput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 20, flex: undefined },
  btns: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timeBox: { alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, minWidth: 80 },
  timeInput: { fontSize: 32, fontWeight: '800', textAlign: 'center', width: 70 },
});