export type CategoryType =
  | 'food' | 'grocery' | 'rent' | 'bills' | 'transport'
  | 'shopping' | 'education' | 'health' | 'entertainment'
  | 'personal' | 'family' | 'travel' | 'udhaar' | 'others';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank' | 'other';

export type IncomeSource = 'salary' | 'freelance' | 'gift' | 'refund' | 'investment' | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: CategoryType;
  note: string;
  date: string;
  time: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  createdAt: string;
}

export interface IncomeEntry {
  id: string;
  amount: number;
  source: IncomeSource;
  note: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface Budget {
  month: string;
  totalBudget: number;
  categoryBudgets: Record<string, number>;
}

export interface User {
  name: string;
  email: string;
  currency: string;
  monthlyBudget: number;
  monthlyIncome: number; // base monthly income from profile
}

// NEW — one-tap quick add shortcut
export interface QuickAdd {
  id: string;
  label: string;       // e.g. "Coffee"
  amount: number;      // e.g. 80
  category: CategoryType;
  paymentMethod: PaymentMethod;
  emoji: string;       // user-picked or category default
}