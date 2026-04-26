import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Platform, Modal, TextInput } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useStore } from '../../store';
import { useTheme } from '../../hooks/useTheme';

export default function ProfileScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { user, setUser, setTheme, logout, saveUserProfile } = useStore();
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [newName, setNewName] = useState(user.name);

  const handleSaveName = async () => {
    if (!newName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setUser({ name: newName.trim() });
    setEditNameVisible(false);
    // Persist name change to Firestore immediately
    await saveUserProfile();
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await signOut(auth); // sign out from Firebase
          logout();            // clear local store
        }
      },
    ]);
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Profile 👤</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Avatar */}
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={{ fontSize: 36, color: '#FFF' }}>{user.name[0]?.toUpperCase()}</Text>
          </View>
          <Text style={[{ color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 10 }]}>{user.name}</Text>
          <Text style={[{ color: colors.textSecondary, fontSize: 14 }]}>{user.email || 'No email set'}</Text>
        </View>

        {/* Stats */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <View style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Monthly Budget</Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>₹{user.monthlyBudget.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Currency </Text>
            <Text style={[styles.rowValue, { color: colors.text }]}>{user.currency}</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>SETTINGS</Text>

          {/* Dark Mode */}
          <View style={[styles.settingRow, { borderTopColor: colors.border }]}>
            <Text style={{ fontSize: 20 }}>🌙</Text>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch value={isDark} onValueChange={(v) => setTheme(v ? 'dark' : 'light')} trackColor={{ false: '#ccc', true: colors.primary }} />
          </View>

          {/* Edit Name */}
          <TouchableOpacity style={[styles.settingRow, { borderTopColor: colors.border }]} onPress={() => { setNewName(user.name); setEditNameVisible(true); }}>
            <Text style={{ fontSize: 20 }}>✏️</Text>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Edit Name</Text>
            <Text style={[{ color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          {/* Budget */}
          <TouchableOpacity style={[styles.settingRow, { borderTopColor: colors.border }]} onPress={() => navigation.navigate('Budget')}>
            <Text style={{ fontSize: 20 }}>💰</Text>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Budget Planner</Text>
            <Text style={[{ color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          {/* Currency */}
          <TouchableOpacity style={[styles.settingRow, { borderTopColor: colors.border }]} onPress={() =>
            Alert.alert('Select Currency', '', [
              { text: '₹ INR', onPress: async () => { setUser({ currency: 'INR' }); await saveUserProfile(); } },
              { text: '$ USD', onPress: async () => { setUser({ currency: 'USD' }); await saveUserProfile(); } },
              { text: '€ EUR', onPress: async () => { setUser({ currency: 'EUR' }); await saveUserProfile(); } },
              { text: '£ GBP', onPress: async () => { setUser({ currency: 'GBP' }); await saveUserProfile(); } },
              { text: 'Cancel', style: 'cancel' },
            ])
          }>
            <Text style={{ fontSize: 20 }}>💱</Text>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Currency</Text>
            <Text style={[{ color: colors.primary, fontWeight: '600' }]}>{user.currency}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: '#EF444415' }]} onPress={handleLogout}>
          <Text style={{ fontSize: 20 }}></Text>
          <Text style={[styles.settingLabel, { color: '#EF4444' }]}>Logout</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={[{ color: colors.textTertiary, fontSize: 12 }]}>Spendly v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={editNameVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Name</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.surfaceVariant }]} onPress={() => setEditNameVisible(false)}>
                <Text style={[{ color: colors.textSecondary, fontWeight: '600' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveName}>
                <Text style={[{ color: '#FFF', fontWeight: '700' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  sectionCard: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  groupTitle: { fontSize: 11, fontWeight: '700', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, letterSpacing: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderTopWidth: 1 },
  settingLabel: { flex: 1, fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, marginHorizontal: 16, borderRadius: 14, marginBottom: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalBox: { width: '100%', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});