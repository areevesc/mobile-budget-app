import { format, parseISO } from 'date-fns';

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
};

export const PAYCHECK_INTERVAL_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly (every 2 weeks)',
  monthly: 'Monthly',
};

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
