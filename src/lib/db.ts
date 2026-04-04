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

  // Check if first run (no categories seeded)
  const catCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (!catCount || catCount.count === 0) {
    await seedDefaults(db);
  }

  // Ensure settings row exists
  const settingsRow = db.getFirstSync('SELECT id FROM settings WHERE id = 1');
  if (!settingsRow) {
    db.runSync('INSERT OR IGNORE INTO settings (id, warning_threshold, paycheck_interval) VALUES (1, 500, \'biweekly\')');
  }
}

async function seedDefaults(db: SQLite.SQLiteDatabase): Promise<void> {
  const expenseCategories = [
    { name: 'Housing', icon: '🏠', color: '#6366f1' },
    { name: 'Food & Dining', icon: '🍔', color: '#f97316' },
    { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
    { name: 'Utilities', icon: '💡', color: '#f59e0b' },
    { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
    { name: 'Shopping', icon: '🛍', color: '#8b5cf6' },
    { name: 'Health', icon: '💊', color: '#22c55e' },
    { name: 'Personal Care', icon: '🧴', color: '#14b8a6' },
    { name: 'Subscriptions', icon: '📱', color: '#06b6d4' },
    { name: 'Other', icon: '📋', color: '#71717a' },
  ];

  const incomeCategories = [
    { name: 'Paycheck', icon: '💼', color: '#22c55e' },
    { name: 'Freelance', icon: '💻', color: '#6366f1' },
    { name: 'Transfer', icon: '🔄', color: '#3b82f6' },
    { name: 'Other Income', icon: '💰', color: '#f59e0b' },
  ];

  for (const cat of expenseCategories) {
    db.runSync(
      'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)',
      [cat.name, 'expense', cat.color, cat.icon]
    );
  }
  for (const cat of incomeCategories) {
    db.runSync(
      'INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)',
      [cat.name, 'income', cat.color, cat.icon]
    );
  }
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

export function createAccount(name: string, balance: number): Account {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.runSync(
    'INSERT INTO accounts (name, current_balance, last_updated) VALUES (?, ?, ?)',
    [name, balance, now]
  );
  return { id: result.lastInsertRowId, name, current_balance: balance, last_updated: now };
}

export function updateAccount(id: number, name: string, balance: number): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.runSync(
    'UPDATE accounts SET name = ?, current_balance = ?, last_updated = ? WHERE id = ?',
    [name, balance, now, id]
  );
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
  db.runSync('DELETE FROM accounts WHERE id = ?', [id]);
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

export function getTransactions(filters?: { type?: string; category_id?: number }): Transaction[] {
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

  sql += ' ORDER BY t.date DESC, t.id DESC';
  return db.getAllSync<Transaction>(sql, params);
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

export function createSinkingFund(fund: Omit<SinkingFund, 'id'>): void {
  const db = getDb();
  db.runSync(
    'INSERT INTO sinking_funds (name, target_amount, current_amount, target_date, contribution_per_paycheck, color) VALUES (?, ?, ?, ?, ?, ?)',
    [fund.name, fund.target_amount, fund.current_amount, fund.target_date, fund.contribution_per_paycheck, fund.color]
  );
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
  return db.getAllSync<ScheduledItem>('SELECT * FROM scheduled_items WHERE is_active = 1 ORDER BY type DESC, name ASC');
}

export function createScheduledItem(item: Omit<ScheduledItem, 'id'>): void {
  const db = getDb();
  db.runSync(
    'INSERT INTO scheduled_items (name, amount, type, due_date, recurrence_interval, category, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [item.name, item.amount, item.type, item.due_date, item.recurrence_interval, item.category, item.is_active]
  );
}

export function updateScheduledItem(id: number, item: Omit<ScheduledItem, 'id'>): void {
  const db = getDb();
  db.runSync(
    'UPDATE scheduled_items SET name = ?, amount = ?, type = ?, due_date = ?, recurrence_interval = ?, category = ?, is_active = ? WHERE id = ?',
    [item.name, item.amount, item.type, item.due_date, item.recurrence_interval, item.category, item.is_active, id]
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
