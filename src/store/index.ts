import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc, setDoc, getDoc, collection,
  updateDoc, deleteDoc, getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Expense, Budget, User, CategoryType, QuickAdd, IncomeEntry } from '../types';
import dayjs from 'dayjs';

let idCounter = 1;
const genId = (prefix = 'exp') => `${prefix}_${Date.now()}_${idCounter++}`;

interface AppState {
  user: User;
  expenses: Expense[];
  incomeEntries: IncomeEntry[];
  budget: Budget | null;
  quickAdds: QuickAdd[];
  theme: 'light' | 'dark';
  isOnboarded: boolean;
  isLoggedIn: boolean;
  uid: string;

  setUser: (u: Partial<User>) => void;
  setLoggedIn: (v: boolean, uid?: string) => void;
  setTheme: (t: 'light' | 'dark') => void;
  setOnboarded: (v: boolean) => void;
  logout: () => void;

  loadUserData: () => Promise<void>;
  saveUserProfile: () => Promise<void>;

  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, e: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudget: (b: Budget) => Promise<void>;

  // Income entries
  addIncomeEntry: (e: Omit<IncomeEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteIncomeEntry: (id: string) => Promise<void>;
  getMonthIncome: (month?: string) => number;

  // Quick-adds
  addQuickAdd: (q: Omit<QuickAdd, 'id'>) => Promise<void>;
  updateQuickAdd: (id: string, q: Partial<QuickAdd>) => Promise<void>;
  deleteQuickAdd: (id: string) => Promise<void>;

  // Selectors
  getMonthExpenses: (month?: string) => Expense[];
  getMonthTotal: (month?: string) => number;
  getTodayTotal: () => number;
  getCategoryTotal: (cat: CategoryType, month?: string) => number;
  getWalletBalance: () => number;
  getSavingsRate: (month?: string) => number;
}

const DEFAULT_USER: User = {
  name: 'User',
  email: '',
  currency: 'INR',
  monthlyBudget: 0,
  monthlyIncome: 0,
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: DEFAULT_USER,
      expenses: [],
      incomeEntries: [],
      budget: null,
      quickAdds: [],
      theme: 'dark',
      isOnboarded: false,
      isLoggedIn: false,
      uid: '',

      setUser: (u) => set((s) => ({ user: { ...s.user, ...u } })),
      setLoggedIn: (v, uid = '') => set({ isLoggedIn: v, uid }),
      setTheme: (t) => set({ theme: t }),
      setOnboarded: (v) => set({ isOnboarded: v }),

      logout: () => set({
        isLoggedIn: false,
        uid: '',
        expenses: [],
        incomeEntries: [],
        budget: null,
        quickAdds: [],
        isOnboarded: false,
        user: DEFAULT_USER,
      }),

      // ── Load ALL user data from Firestore ──────────────────────────────────
      loadUserData: async () => {
        const { uid } = get();
        if (!uid) return;
        try {
          // Profile
          const profileSnap = await getDoc(doc(db, 'users', uid));
          if (profileSnap.exists()) {
            const d = profileSnap.data();
            set({
              user: {
                name: d.name || 'User',
                email: d.email || '',
                currency: d.currency || 'INR',
                monthlyBudget: d.monthlyBudget ?? 0,
                monthlyIncome: d.monthlyIncome ?? 0,
              },
              isOnboarded: d.isOnboarded ?? false,
            });
          }

          // Expenses
          const expSnap = await getDocs(collection(db, 'users', uid, 'expenses'));
          const expenses: Expense[] = [];
          expSnap.forEach((d) => expenses.push({ id: d.id, ...d.data() } as Expense));
          expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          set({ expenses });

          // Budget settings
          const budgetSnap = await getDoc(doc(db, 'users', uid, 'settings', 'budget'));
          if (budgetSnap.exists()) set({ budget: budgetSnap.data() as Budget });

          // Quick-adds
          const qaSnap = await getDocs(collection(db, 'users', uid, 'quickAdds'));
          const quickAdds: QuickAdd[] = [];
          qaSnap.forEach((d) => quickAdds.push({ id: d.id, ...d.data() } as QuickAdd));
          set({ quickAdds });

          // Income entries
          const incSnap = await getDocs(collection(db, 'users', uid, 'incomeEntries'));
          const incomeEntries: IncomeEntry[] = [];
          incSnap.forEach((d) => incomeEntries.push({ id: d.id, ...d.data() } as IncomeEntry));
          incomeEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          set({ incomeEntries });
        } catch (e) {
          console.error('loadUserData error:', e);
        }
      },

      // ── Save profile to Firestore ──────────────────────────────────────────
      saveUserProfile: async () => {
        const { uid, user, isOnboarded } = get();
        if (!uid) return;
        try {
          await setDoc(doc(db, 'users', uid), {
            name: user.name,
            email: user.email,
            currency: user.currency,
            monthlyBudget: user.monthlyBudget,
            monthlyIncome: user.monthlyIncome,
            isOnboarded,
          }, { merge: true });
        } catch (e) {
          console.error('saveUserProfile error:', e);
        }
      },

      // ── Expenses ───────────────────────────────────────────────────────────
      addExpense: async (e) => {
        const { uid } = get();
        const newExp: Expense = { ...e, id: genId('exp'), createdAt: new Date().toISOString() };
        set((s) => ({ expenses: [newExp, ...s.expenses] }));
        if (uid) {
          try { await setDoc(doc(db, 'users', uid, 'expenses', newExp.id), newExp); }
          catch (err) { console.error('addExpense error:', err); }
        }
      },

      updateExpense: async (id, e) => {
        const { uid } = get();
        set((s) => ({ expenses: s.expenses.map((x) => x.id === id ? { ...x, ...e } : x) }));
        if (uid) {
          try { await updateDoc(doc(db, 'users', uid, 'expenses', id), e as any); }
          catch (err) { console.error('updateExpense error:', err); }
        }
      },

      deleteExpense: async (id) => {
        const { uid } = get();
        set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }));
        if (uid) {
          try { await deleteDoc(doc(db, 'users', uid, 'expenses', id)); }
          catch (err) { console.error('deleteExpense error:', err); }
        }
      },

      // ── Budget ─────────────────────────────────────────────────────────────
      setBudget: async (b) => {
        const { uid } = get();
        set({ budget: b });
        if (uid) {
          try { await setDoc(doc(db, 'users', uid, 'settings', 'budget'), b); }
          catch (err) { console.error('setBudget error:', err); }
        }
      },

      // ── Income Entries ─────────────────────────────────────────────────────
      addIncomeEntry: async (e) => {
        const { uid } = get();
        const newInc: IncomeEntry = { ...e, id: genId('inc'), createdAt: new Date().toISOString() };
        set((s) => ({ incomeEntries: [newInc, ...s.incomeEntries] }));
        if (uid) {
          try { await setDoc(doc(db, 'users', uid, 'incomeEntries', newInc.id), newInc); }
          catch (err) { console.error('addIncomeEntry error:', err); }
        }
      },

      deleteIncomeEntry: async (id) => {
        const { uid } = get();
        set((s) => ({ incomeEntries: s.incomeEntries.filter((x) => x.id !== id) }));
        if (uid) {
          try { await deleteDoc(doc(db, 'users', uid, 'incomeEntries', id)); }
          catch (err) { console.error('deleteIncomeEntry error:', err); }
        }
      },

      getMonthIncome: (month) => {
        const m = month || dayjs().format('YYYY-MM');
        return get().incomeEntries
          .filter((e) => dayjs(e.date).format('YYYY-MM') === m)
          .reduce((s, e) => s + e.amount, 0);
      },

      // ── Quick-adds ─────────────────────────────────────────────────────────
      addQuickAdd: async (q) => {
        const { uid } = get();
        const newQA: QuickAdd = { ...q, id: genId('qa') };
        set((s) => ({ quickAdds: [...s.quickAdds, newQA] }));
        if (uid) {
          try { await setDoc(doc(db, 'users', uid, 'quickAdds', newQA.id), newQA); }
          catch (err) { console.error('addQuickAdd error:', err); }
        }
      },

      updateQuickAdd: async (id, q) => {
        const { uid } = get();
        set((s) => ({ quickAdds: s.quickAdds.map((x) => x.id === id ? { ...x, ...q } : x) }));
        if (uid) {
          try { await updateDoc(doc(db, 'users', uid, 'quickAdds', id), q as any); }
          catch (err) { console.error('updateQuickAdd error:', err); }
        }
      },

      deleteQuickAdd: async (id) => {
        const { uid } = get();
        set((s) => ({ quickAdds: s.quickAdds.filter((x) => x.id !== id) }));
        if (uid) {
          try { await deleteDoc(doc(db, 'users', uid, 'quickAdds', id)); }
          catch (err) { console.error('deleteQuickAdd error:', err); }
        }
      },

      // ── Selectors ──────────────────────────────────────────────────────────
      getMonthExpenses: (month) => {
        const m = month || dayjs().format('YYYY-MM');
        return get().expenses.filter((e) => dayjs(e.date).format('YYYY-MM') === m);
      },

      getMonthTotal: (month) =>
        get().getMonthExpenses(month).reduce((s, e) => s + e.amount, 0),

      getTodayTotal: () => {
        const today = dayjs().format('YYYY-MM-DD');
        return get().expenses
          .filter((e) => dayjs(e.date).format('YYYY-MM-DD') === today)
          .reduce((s, e) => s + e.amount, 0);
      },

      getCategoryTotal: (cat, month) =>
        get().getMonthExpenses(month)
          .filter((e) => e.category === cat)
          .reduce((s, e) => s + e.amount, 0),

      getWalletBalance: () => {
        const { user, getMonthTotal, getMonthIncome } = get();
        const budget       = user.monthlyBudget || 0;
        const spent        = getMonthTotal();
        const extraIncome  = getMonthIncome(); // money received from others (gifts, transfers etc.)
        // Wallet = budget you set + any extra money received - what you spent
        return budget + extraIncome - spent;
      },

      // Savings Rate = (income - expenses) / income * 100
      getSavingsRate: (month) => {
        const { user, getMonthTotal } = get();
        if (!user.monthlyIncome || user.monthlyIncome <= 0) return 0;
        const spent = getMonthTotal(month);
        const saved = user.monthlyIncome - spent;
        return Math.max(0, Math.min(100, (saved / user.monthlyIncome) * 100));
      },
    }),
    {
      name: 'fintrack-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ theme: s.theme }),
    }
  )
);