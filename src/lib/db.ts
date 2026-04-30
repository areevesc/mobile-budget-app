import * as SQLite from 'expo-sqlite';
import type { Account, Category, Transaction, SinkingFund, ScheduledItem, Settings } from '../types';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('budget.db');
  }
  return _db;
}

// ─── Schema & Seed ───────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  const db = getDb();

  db.execSync(`PRAGMA journal_mode = WAL;`);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      current_balance REAL DEFAULT 0,
      last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      icon TEXT DEFAULT '💰'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      description TEXT DEFAULT '',
      account_id INTEGER REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS sinking_funds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL DEFAULT 0,
      current_amount REAL DEFAULT 0,
      target_date TEXT,
      contribution_per_paycheck REAL DEFAULT 0,
      color TEXT DEFAULT '#6366f1'
    );

    CREATE TABLE IF NOT EXISTS scheduled_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      due_date TEXT NOT NULL,
      recurrence_interval TEXT DEFAULT 'monthly',
      category TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      warning_threshold REAL DEFAULT 500,
      paycheck_interval TEXT DEFAULT 'biweekly',
      last_paycheck_date TEXT
    );
  `);

  // Migrations
  try {
    db.execSync('ALTER TABLE scheduled_items ADD COLUMN sinking_fund_id INTEGER REFERENCES sinking_funds(id)');
  } catch (_) { /* column already exists */ }
  try {
    db.execSync('ALTER TABLE scheduled_items ADD COLUMN recurrence_days INTEGER');
  } catch (_) { /* column already exists */ }
  try {
    db.execSync('ALTER TABLE scheduled_items ADD COLUMN category_id INTEGER REFERENCES categories(id)');
  } catch (_) { /* column already exists */ }
  try {
    db.execSync('ALTER TABLE accounts ADD COLUMN is_default INTEGER DEFAULT 0');
  } catch (_) { /* column already exists */ }

  // First-run seed MUST come before any "ensure X exists" blocks —
  // otherwise those blocks create rows that make the seed check think
  // the DB is already populated and skip seeding the rest.
  const catCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (!catCount || catCount.count === 0) {
    await seedDefaults(db);
  }

  // Ensure at least one account is marked default (backfill)
  const anyDefault = db.getFirstSync('SELECT id FROM accounts WHERE is_default = 1');
  if (!anyDefault) {
    const first = db.getFirstSync<{ id: number }>('SELECT id FROM accounts ORDER BY id ASC LIMIT 1');
    if (first) {
      db.runSync('UPDATE accounts SET is_default = 1 WHERE id = ?', [first.id]);
    }
  }

  // Backfill: ensure Savings category exists (for DBs seeded before this was added)
  const savingsCat = db.getFirstSync('SELECT id FROM categories WHERE name = ? AND type = ?', ['Savings', 'expense']);
  if (!savingsCat) {
    db.runSync('INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)', ['Savings', 'expense', '#6366f1', '🐷']);
  }

  // Backfill: ensure Groceries category exists (added after Shopping/Food split)
  const groceriesCat = db.getFirstSync('SELECT id FROM categories WHERE name = ? AND type = ?', ['Groceries', 'expense']);
  if (!groceriesCat) {
    db.runSync('INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)', ['Groceries', 'expense', '#84cc16', '🛒']);
  }

  // Ensure settings row exists
  const settingsRow = db.getFirstSync('SELECT id FROM settings WHERE id = 1');
  if (!settingsRow) {
    db.runSync('INSERT OR IGNORE INTO settings (id, warning_threshold, paycheck_interval) VALUES (1, 500, \'biweekly\')');
  }
}

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Housing', icon: '🏠', color: '#6366f1' },
  { name: 'Food & Dining', icon: '🍔', color: '#f97316' },
  { name: 'Groceries', icon: '🛒', color: '#84cc16' },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
  { name: 'Utilities', icon: '💡', color: '#f59e0b' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { name: 'Shopping', icon: '🛍', color: '#8b5cf6' },
  { name: 'Health', icon: '💊', color: '#22c55e' },
  { name: 'Personal Care', icon: '🧴', color: '#14b8a6' },
  { name: 'Subscriptions', icon: '📱', color: '#06b6d4' },
  { name: 'Other', icon: '📋', color: '#71717a' },
  { name: 'Savings', icon: '🐷', color: '#6366f1' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Paycheck', icon: '💼', color: '#22c55e' },
  { name: 'Freelance', icon: '💻', color: '#6366f1' },
  { name: 'Transfer', icon: '🔄', color: '#3b82f6' },
  { name: 'Other Income', icon: '💰', color: '#f59e0b' },
];

async function seedDefaults(db: SQLite.SQLiteDatabase): Promise<void> {
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    db.runSync(
      'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)',
      [cat.name, 'expense', cat.color, cat.icon]
    );
  }
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    db.runSync(
      'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)',
      [cat.name, 'income', cat.color, cat.icon]
    );
  }
}

// ─── Destructive: wipe everything, reseed defaults ───────────────────────────

export function wipeAllData(): void {
  const db = getDb();
  db.execSync(`
    DELETE FROM transactions;
    DELETE FROM scheduled_items;
    DELETE FROM sinking_funds;
    DELETE FROM categories;
    DELETE FROM accounts;
    DELETE FROM settings;
  `);
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    db.runSync(
      'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)',
      [cat.name, 'expense', cat.color, cat.icon]
    );
  }
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    db.runSync(
      'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)',
      [cat.name, 'income', cat.color, cat.icon]
    );
  }
  db.runSync('INSERT INTO settings (id, warning_threshold, paycheck_interval) VALUES (1, 500, ?)', ['biweekly']);
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export function getAccounts(): Account[] {
  const db = getDb();
  return db.getAllSync<Account>('SELECT * FROM accounts ORDER BY name ASC');
}

export function getAccount(id: number): Account | null {
  const db = getDb();
  return db.getFirstSync<Account>('SELECT * FROM accounts WHERE id = ?', [id]) ?? null;
}

export function createAccount(name: string, balance: number, isDefault: boolean = false): Account {
  const db = getDb();
  const now = new Date().toISOString();

  // First account is always default
  const existing = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM accounts');
  const shouldBeDefault = isDefault || !existing || existing.count === 0;

  if (shouldBeDefault) {
    db.runSync('UPDATE accounts SET is_default = 0');
  }

  const result = db.runSync(
    'INSERT INTO accounts (name, current_balance, last_updated, is_default) VALUES (?, ?, ?, ?)',
    [name, balance, now, shouldBeDefault ? 1 : 0]
  );
  return {
    id: result.lastInsertRowId,
    name,
    current_balance: balance,
    last_updated: now,
    is_default: shouldBeDefault ? 1 : 0,
  };
}

export function updateAccount(id: number, name: string, balance: number, isDefault?: boolean): void {
  const db = getDb();
  const now = new Date().toISOString();

  if (isDefault === true) {
    db.runSync('UPDATE accounts SET is_default = 0');
  }

  if (isDefault === undefined) {
    db.runSync(
      'UPDATE accounts SET name = ?, current_balance = ?, last_updated = ? WHERE id = ?',
      [name, balance, now, id]
    );
  } else {
    db.runSync(
      'UPDATE accounts SET name = ?, current_balance = ?, last_updated = ?, is_default = ? WHERE id = ?',
      [name, balance, now, isDefault ? 1 : 0, id]
    );
  }
}

export function setDefaultAccount(id: number): void {
  const db = getDb();
  db.runSync('UPDATE accounts SET is_default = 0');
  db.runSync('UPDATE accounts SET is_default = 1 WHERE id = ?', [id]);
}

export function getDefaultAccount(): Account | null {
  const db = getDb();
  return db.getFirstSync<Account>('SELECT * FROM accounts WHERE is_default = 1 LIMIT 1') ?? null;
}

export function adjustAccountBalance(id: number, delta: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    'UPDATE accounts SET current_balance = current_balance + ?, last_updated = ? WHERE id = ?',
    [delta, now, id]
  );
}

export function deleteAccount(id: number): void {
  const db = getDb();
  const wasDefault = db.getFirstSync<{ is_default: number }>('SELECT is_default FROM accounts WHERE id = ?', [id]);
  db.runSync('DELETE FROM accounts WHERE id = ?', [id]);

  // If we deleted the default account, promote another
  if (wasDefault?.is_default === 1) {
    const next = db.getFirstSync<{ id: number }>('SELECT id FROM accounts ORDER BY id ASC LIMIT 1');
    if (next) db.runSync('UPDATE accounts SET is_default = 1 WHERE id = ?', [next.id]);
  }
}

export function getTotalBalance(): number {
  const db = getDb();
  const row = db.getFirstSync<{ total: number }>('SELECT COALESCE(SUM(current_balance), 0) as total FROM accounts');
  return row?.total ?? 0;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function getCategories(): Category[] {
  const db = getDb();
  return db.getAllSync<Category>('SELECT * FROM categories ORDER BY type ASC, name ASC');
}

export function getCategoriesByType(type: 'income' | 'expense'): Category[] {
  const db = getDb();
  return db.getAllSync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY name ASC', [type]);
}

export function createCategory(name: string, type: 'income' | 'expense', color: string, icon: string): void {
  const db = getDb();
  db.runSync('INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)', [name, type, color, icon]);
}

export function updateCategory(id: number, name: string, type: 'income' | 'expense', color: string, icon: string): void {
  const db = getDb();
  db.runSync('UPDATE categories SET name = ?, type = ?, color = ?, icon = ? WHERE id = ?', [name, type, color, icon, id]);
}

export function deleteCategory(id: number): void {
  const db = getDb();
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function getTransactions(filters?: {
  type?: string;
  category_id?: number;
  dateFrom?: string;
  dateTo?: string;
}): Transaction[] {
  const db = getDb();
  let sql = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (filters?.type) {
    sql += ' AND t.type = ?';
    params.push(filters.type);
  }
  if (filters?.category_id) {
    sql += ' AND t.category_id = ?';
    params.push(filters.category_id);
  }
  if (filters?.dateFrom) {
    sql += ' AND t.date >= ?';
    params.push(filters.dateFrom);
  }
  if (filters?.dateTo) {
    sql += ' AND t.date <= ?';
    params.push(filters.dateTo);
  }

  sql += ' ORDER BY t.date DESC, t.id DESC';
  return db.getAllSync<Transaction>(sql, params);
}

export interface CategorySpend {
  category_id: number | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  total: number;
}

export function getSpendingByCategory(dateFrom: string, dateTo: string): CategorySpend[] {
  const db = getDb();
  return db.getAllSync<CategorySpend>(`
    SELECT
      t.category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      SUM(t.amount) as total
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense'
      AND t.date >= ?
      AND t.date <= ?
    GROUP BY t.category_id
    ORDER BY total DESC
  `, [dateFrom, dateTo]);
}

export interface PeriodSummary {
  totalIncome: number;
  totalExpense: number;
}

export function getPeriodSummary(dateFrom: string, dateTo: string): PeriodSummary {
  const db = getDb();
  const income = db.getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income' AND date >= ? AND date <= ?`,
    [dateFrom, dateTo]
  );
  const expense = db.getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' AND date >= ? AND date <= ?`,
    [dateFrom, dateTo]
  );
  return {
    totalIncome: income?.total ?? 0,
    totalExpense: expense?.total ?? 0,
  };
}

export function getRecentTransactions(limit = 10): Transaction[] {
  const db = getDb();
  return db.getAllSync<Transaction>(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    ORDER BY t.date DESC, t.id DESC
    LIMIT ?
  `, [limit]);
}

export function createTransaction(
  date: string,
  amount: number,
  type: 'income' | 'expense',
  category_id: number | null,
  description: string,
  account_id: number | null
): number {
  const db = getDb();
  const result = db.runSync(
    'INSERT INTO transactions (date, amount, type, category_id, description, account_id) VALUES (?, ?, ?, ?, ?, ?)',
    [date, amount, type, category_id, description, account_id]
  );

  // Adjust account balance
  if (account_id !== null) {
    const delta = type === 'income' ? amount : -amount;
    adjustAccountBalance(account_id, delta);
  }

  return result.lastInsertRowId;
}

export function updateTransaction(
  id: number,
  date: string,
  amount: number,
  type: 'income' | 'expense',
  category_id: number | null,
  description: string,
  account_id: number | null,
  oldAmount: number,
  oldType: 'income' | 'expense',
  oldAccountId: number | null
): void {
  const db = getDb();

  // Reverse old balance effect
  if (oldAccountId !== null) {
    const reverseDelta = oldType === 'income' ? -oldAmount : oldAmount;
    adjustAccountBalance(oldAccountId, reverseDelta);
  }

  // Apply new balance effect
  if (account_id !== null) {
    const newDelta = type === 'income' ? amount : -amount;
    adjustAccountBalance(account_id, newDelta);
  }

  db.runSync(
    'UPDATE transactions SET date = ?, amount = ?, type = ?, category_id = ?, description = ?, account_id = ? WHERE id = ?',
    [date, amount, type, category_id, description, account_id, id]
  );
}

export function deleteTransaction(id: number): void {
  const db = getDb();
  const tx = db.getFirstSync<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);
  if (tx && tx.account_id) {
    const reverseDelta = tx.type === 'income' ? -tx.amount : tx.amount;
    adjustAccountBalance(tx.account_id, reverseDelta);
  }
  db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
}

// ─── Sinking Funds ───────────────────────────────────────────────────────────

export function getSinkingFunds(): SinkingFund[] {
  const db = getDb();
  return db.getAllSync<SinkingFund>('SELECT * FROM sinking_funds ORDER BY name ASC');
}

export function createSinkingFund(fund: Omit<SinkingFund, 'id'>): number {
  const db = getDb();
  const result = db.runSync(
    'INSERT INTO sinking_funds (name, target_amount, current_amount, target_date, contribution_per_paycheck, color) VALUES (?, ?, ?, ?, ?, ?)',
    [fund.name, fund.target_amount, fund.current_amount, fund.target_date, fund.contribution_per_paycheck, fund.color]
  );
  return result.lastInsertRowId;
}

export function updateSinkingFund(id: number, fund: Omit<SinkingFund, 'id'>): void {
  const db = getDb();
  db.runSync(
    'UPDATE sinking_funds SET name = ?, target_amount = ?, current_amount = ?, target_date = ?, contribution_per_paycheck = ?, color = ? WHERE id = ?',
    [fund.name, fund.target_amount, fund.current_amount, fund.target_date, fund.contribution_per_paycheck, fund.color, id]
  );
}

export function contributeSinkingFund(id: number, amount: number, accountId: number | null): void {
  const db = getDb();
  db.runSync('UPDATE sinking_funds SET current_amount = current_amount + ? WHERE id = ?', [amount, id]);

  const fund = db.getFirstSync<SinkingFund>('SELECT * FROM sinking_funds WHERE id = ?', [id]);
  if (fund) {
    createTransaction(
      new Date().toISOString().split('T')[0],
      amount,
      'expense',
      null,
      `Contribution to ${fund.name}`,
      accountId
    );
  }
}

export function deleteSinkingFund(id: number): void {
  const db = getDb();
  db.runSync('DELETE FROM scheduled_items WHERE sinking_fund_id = ?', [id]);
  db.runSync('DELETE FROM sinking_funds WHERE id = ?', [id]);
}

export function getTotalSinkingReserved(): number {
  const db = getDb();
  const row = db.getFirstSync<{ total: number }>('SELECT COALESCE(SUM(current_amount), 0) as total FROM sinking_funds');
  return row?.total ?? 0;
}

// ─── Scheduled Items ──────────────────────────────────────────────────────────

export function getScheduledItems(): ScheduledItem[] {
  const db = getDb();
  return db.getAllSync<ScheduledItem>(`
    SELECT s.*, c.name as category_name, c.icon as category_icon
    FROM scheduled_items s
    LEFT JOIN categories c ON s.category_id = c.id
    WHERE s.is_active = 1
    ORDER BY s.type DESC, s.name ASC
  `);
}

export function createScheduledItem(item: Omit<ScheduledItem, 'id'>): void {
  const db = getDb();
  db.runSync(
    'INSERT INTO scheduled_items (name, amount, type, due_date, recurrence_interval, category, is_active, sinking_fund_id, recurrence_days, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [item.name, item.amount, item.type, item.due_date, item.recurrence_interval, item.category, item.is_active, item.sinking_fund_id ?? null, item.recurrence_days ?? null, item.category_id ?? null]
  );
}

export function updateScheduledItem(id: number, item: Omit<ScheduledItem, 'id'>): void {
  const db = getDb();
  db.runSync(
    'UPDATE scheduled_items SET name = ?, amount = ?, type = ?, due_date = ?, recurrence_interval = ?, category = ?, is_active = ?, sinking_fund_id = ?, recurrence_days = ?, category_id = ? WHERE id = ?',
    [item.name, item.amount, item.type, item.due_date, item.recurrence_interval, item.category, item.is_active, item.sinking_fund_id ?? null, item.recurrence_days ?? null, item.category_id ?? null, id]
  );
}

export function deleteScheduledItem(id: number): void {
  const db = getDb();
  db.runSync('DELETE FROM scheduled_items WHERE id = ?', [id]);
}

export function advanceScheduledItemDate(id: number, newDueDate: string): void {
  const db = getDb();
  db.runSync('UPDATE scheduled_items SET due_date = ? WHERE id = ?', [newDueDate, id]);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(): Settings {
  const db = getDb();
  const row = db.getFirstSync<Settings>('SELECT * FROM settings WHERE id = 1');
  return row ?? { id: 1, warning_threshold: 500, paycheck_interval: 'biweekly', last_paycheck_date: null };
}

export function saveSettings(settings: Omit<Settings, 'id'>): void {
  const db = getDb();
  db.runSync(
    'INSERT OR REPLACE INTO settings (id, warning_threshold, paycheck_interval, last_paycheck_date) VALUES (1, ?, ?, ?)',
    [settings.warning_threshold, settings.paycheck_interval, settings.last_paycheck_date]
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function exportAllData(): object {
  return {
    exportedAt: new Date().toISOString(),
    accounts: getAccounts(),
    categories: getCategories(),
    transactions: getTransactions(),
    sinkingFunds: getSinkingFunds(),
    scheduledItems: getScheduledItems(),
    settings: getSettings(),
  };
}
