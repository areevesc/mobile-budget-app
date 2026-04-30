import { format, parseISO, startOfMonth } from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch {
    return dateStr;
  }
}

export function formatDateDisplay(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

export type SafeToSpendColor = 'emerald' | 'yellow' | 'red';

export function getSafeToSpendColor(amount: number, threshold: number): SafeToSpendColor {
  if (amount < threshold) return 'red';
  if (amount < threshold * 1.2) return 'yellow';
  return 'emerald';
}

export const COLORS = {
  background: '#09090b',
  card: '#18181b',
  border: '#27272a',
  muted: '#71717a',
  primary: '#fafafa',
  income: '#34d399',
  expense: '#f87171',
  warning: '#facc15',
  accent: '#6366f1',
} as const;

export const SWATCH_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f87171', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#06b6d4', // cyan
] as const;

export const RECURRENCE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
  none: 'One-time',
  custom: 'Custom (days)',
};

export const PAYCHECK_INTERVAL_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly (every 2 weeks)',
  monthly: 'Monthly',
};

export type DatePreset = 'week' | 'month' | 'month3' | 'year' | 'all' | 'custom';

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  week: '7 Days',
  month: 'This Month',
  month3: '3 Months',
  year: 'Past Year',
  all: 'All Time',
  custom: 'Custom',
};

export function getDateRange(preset: Exclude<DatePreset, 'custom' | 'all'>): { from: string; to: string } {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  switch (preset) {
    case 'week': {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split('T')[0], to: todayStr };
    }
    case 'month': {
      return { from: startOfMonth(today).toISOString().split('T')[0], to: todayStr };
    }
    case 'month3': {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 3);
      return { from: d.toISOString().split('T')[0], to: todayStr };
    }
    case 'year': {
      const d = new Date(today);
      d.setFullYear(d.getFullYear() - 1);
      return { from: d.toISOString().split('T')[0], to: todayStr };
    }
  }
}

export function formatSectionDate(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';
  try {
    return format(parseISO(dateStr), 'EEE, MMM d');
  } catch {
    return dateStr;
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
