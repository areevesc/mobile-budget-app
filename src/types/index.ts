export interface Account {
  id: number;
  name: string;
  current_balance: number;
  last_updated: string;
  is_default: number;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: number | null;
  description: string;
  account_id: number | null;
  // joined fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  account_name?: string;
}

export interface SinkingFund {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  contribution_per_paycheck: number;
  color: string;
}

export type RecurrenceInterval = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' | 'none' | 'custom';

export interface ScheduledItem {
  id: number;
  name: string;
  amount: number;
  type: 'bill' | 'paycheck' | 'savings';
  due_date: string;
  recurrence_interval: RecurrenceInterval;
  category: string | null;
  is_active: number;
  sinking_fund_id: number | null;
  recurrence_days: number | null;
  category_id: number | null;
  // joined fields
  category_name?: string;
  category_icon?: string;
}

export interface Settings {
  id: number;
  warning_threshold: number;
  paycheck_interval: 'weekly' | 'biweekly' | 'monthly';
  last_paycheck_date: string | null;
}

export interface TimelineEvent {
  id: string;
  scheduledItemId: number;
  name: string;
  type: 'bill' | 'paycheck' | 'savings';
  amount: number;
  date: string;
  runningBalance: number;
  status: 'danger' | 'warning' | 'normal';
}
