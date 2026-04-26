import { CategoryType } from '../types';

export const CATEGORIES = [
  { id: 'food' as CategoryType, label: 'Food & Dining', color: '#FF6B6B', emoji: '🍔' },
  { id: 'grocery' as CategoryType, label: 'Grocery', color: '#4ECDC4', emoji: '🛒' },
  { id: 'rent' as CategoryType, label: 'Rent', color: '#45B7D1', emoji: '🏠' },
  { id: 'bills' as CategoryType, label: 'Bills', color: '#96CEB4', emoji: '📄' },
  { id: 'transport' as CategoryType, label: 'Transport', color: '#F7DC6F', emoji: '🚗' },
  { id: 'shopping' as CategoryType, label: 'Shopping', color: '#DDA0DD', emoji: '🛍️' },
  { id: 'education' as CategoryType, label: 'Education', color: '#98D8C8', emoji: '📚' },
  { id: 'health' as CategoryType, label: 'Health', color: '#F1948A', emoji: '💊' },
  { id: 'entertainment' as CategoryType, label: 'Entertainment', color: '#BB8FCE', emoji: '🎬' },
  { id: 'personal' as CategoryType, label: 'Personal', color: '#85C1E9', emoji: '👤' },
  { id: 'family' as CategoryType, label: 'Family', color: '#F0B27A', emoji: '👨‍👩‍👧' },
  { id: 'travel' as CategoryType, label: 'Travel', color: '#82E0AA', emoji: '✈️' },
  { id: 'udhaar' as CategoryType, label: 'Udhaar (Lent)', color: '#F4A261', emoji: '🤝' },
  { id: 'others' as CategoryType, label: 'Others', color: '#AEB6BF', emoji: '📦' },
];

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', emoji: '💵' },
  { id: 'upi', label: 'UPI', emoji: '📱' },
  { id: 'card', label: 'Card', emoji: '💳' },
  { id: 'bank', label: 'Bank', emoji: '🏦' },
  { id: 'other', label: 'Other', emoji: '💰' },
];

export const AUTO_CATEGORY_MAP: Record<string, CategoryType> = {
  zomato: 'food', swiggy: 'food', pizza: 'food', restaurant: 'food',
  cafe: 'food', lunch: 'food', dinner: 'food', breakfast: 'food',
  uber: 'transport', ola: 'transport', metro: 'transport', bus: 'transport',
  petrol: 'transport', fuel: 'transport', auto: 'transport',
  bigbasket: 'grocery', grocery: 'grocery', vegetables: 'grocery',
  electricity: 'bills', internet: 'bills', wifi: 'bills', mobile: 'bills',
  amazon: 'shopping', flipkart: 'shopping', clothes: 'shopping',
  netflix: 'entertainment', spotify: 'entertainment', movie: 'entertainment',
  medicine: 'health', pharmacy: 'health', doctor: 'health', hospital: 'health',
  college: 'education', tuition: 'education', books: 'education',
  hotel: 'travel', flight: 'travel', train: 'travel',
  rent: 'rent',
};

export const LIGHT_THEME = {
  background: '#F0F7F5',
  surface: '#FFFFFF',
  surfaceVariant: '#E4EFEC',
  primary: '#1A6B5C',
  primaryDark: '#0F3D33',
  primaryLight: '#D0E8E3',
  accent: '#3FAF8F',
  success: '#22C55E',
  warning: '#D4A937',
  danger: '#E45757',
  text: '#0D1F1C',
  textSecondary: '#3D6B62',
  textTertiary: '#7A9E98',
  border: '#C4D9D4',
  card: '#FFFFFF',
  cardShine: 'rgba(63,175,143,0.08)',
  glowColor: 'rgba(63,175,143,0.15)',
};

export const DARK_THEME = {
  background: '#060E0C',
  surface: '#0C1F1B',
  surfaceVariant: '#0A1915',
  primary: '#3FAF8F',
  primaryDark: '#0F2E27',
  primaryLight: '#1A3D35',
  accent: '#4DC9A5',
  success: '#3FAF8F',
  warning: '#D4A937',
  danger: '#E45757',
  text: '#E8F5F2',
  textSecondary: '#8BBAB3',
  textTertiary: '#4D7870',
  border: '#172E29',
  card: '#0C1F1B',
  cardShine: 'rgba(63,175,143,0.18)',
  glowColor: 'rgba(63,175,143,0.12)',
};