import { useStore } from '../store';
import { LIGHT_THEME, DARK_THEME } from '../constants';

export function useTheme() {
  const theme = useStore((s) => s.theme);
  const colors = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  return { colors, isDark: theme === 'dark' };
}

export function useCurrency() {
  const currency = useStore((s) => s.user.currency);
  const map: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  return map[currency] || '₹';
}

export function useDesignTokens() {
  const { colors, isDark } = useTheme();
  return {
    isDark,
    colors,
    bg:               isDark ? '#060E0C' : colors.background,
    cardBg:           isDark ? '#0C1F1B' : '#FFFFFF',
    cardBorder:       isDark ? 'rgba(63,175,143,0.12)' : colors.border,
    headerBg:         isDark ? '#060E0C' : colors.primary,
    headerText:       isDark ? '#E8F5F2' : '#FFFFFF',
    headerSub:        isDark ? '#3D6B62' : 'rgba(255,255,255,0.6)',
    accent:           '#3FAF8F',
    accentDim:        'rgba(63,175,143,0.14)',
    textPrimary:      isDark ? '#E8F5F2' : colors.text,
    textSec:          isDark ? '#6B9E96' : colors.textSecondary,
    textMuted:        isDark ? '#3D6B62' : colors.textTertiary,
    inputBg:          isDark ? '#0A1915' : colors.surfaceVariant,
    inputBorder:      isDark ? 'rgba(63,175,143,0.15)' : colors.border,
    inputBorderFocus: isDark ? 'rgba(63,175,143,0.5)' : colors.primary,
    btnPrimary:       isDark ? '#163D33' : colors.primary,
    btnPrimaryBorder: isDark ? 'rgba(63,175,143,0.4)' : 'transparent',
    btnPrimaryText:   isDark ? '#3FAF8F' : '#FFFFFF',
    glowShadow: {
      shadowColor: '#3FAF8F',
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 4 },
      elevation: 10,
    },
  };
}