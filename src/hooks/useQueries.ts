import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as db from '../lib/db';
import { calculateSafeToSpend } from '../lib/calculations';
import type { Account, Category, Transaction, SinkingFund, ScheduledItem, Settings } from '../types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const QUERY_KEYS = {
  accounts: ['accounts'] as const,
  categories: ['categories'] as const,
  categoriesByType: (type: string) => ['categories', type] as const,
  transactions: (filters?: object) => ['transactions', filters] as const,
  recentTransactions: ['transactions', 'recent'] as const,
  sinkingFunds: ['sinkingFunds'] as const,
  scheduledItems: ['scheduledItems'] as const,
  settings: ['settings'] as const,
  safeToSpend: ['safeToSpend'] as const,
  spendingByCategory: (dateFrom: string, dateTo: string) => ['spendingByCategory', dateFrom, dateTo] as const,
  periodSummary: (dateFrom: string, dateTo: string) => ['periodSummary', dateFrom, dateTo] as const,
};

// ─── Accounts ────────────────────────────────────────────────────────────────

export function useAccounts() {
  return useQuery({
    queryKey: QUERY_KEYS.accounts,
    queryFn: () => db.getAccounts(),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, balance, isDefault }: { name: string; balance: number; isDefault?: boolean }) =>
      Promise.resolve(db.createAccount(name, balance, isDefault)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, balance, isDefault }: { id: number; name: string; balance: number; isDefault?: boolean }) =>
      Promise.resolve(db.updateAccount(id, name, balance, isDefault)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useSetDefaultAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => Promise.resolve(db.setDefaultAccount(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => Promise.resolve(db.deleteAccount(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => db.getCategories(),
  });
}

export function useCategoriesByType(type: 'income' | 'expense') {
  return useQuery({
    queryKey: QUERY_KEYS.categoriesByType(type),
    queryFn: () => db.getCategoriesByType(type),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, type, color, icon }: { name: string; type: 'income' | 'expense'; color: string; icon: string }) =>
      Promise.resolve(db.createCategory(name, type, color, icon)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, type, color, icon }: { id: number; name: string; type: 'income' | 'expense'; color: string; icon: string }) =>
      Promise.resolve(db.updateCategory(id, name, type, color, icon)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => Promise.resolve(db.deleteCategory(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories });
    },
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function useTransactions(filters?: {
  type?: string;
  category_id?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(filters),
    queryFn: () => db.getTransactions(filters),
  });
}

export function useSpendingByCategory(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.spendingByCategory(dateFrom, dateTo),
    queryFn: () => db.getSpendingByCategory(dateFrom, dateTo),
  });
}

export function usePeriodSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: QUERY_KEYS.periodSummary(dateFrom, dateTo),
    queryFn: () => db.getPeriodSummary(dateFrom, dateTo),
  });
}

export function useRecentTransactions(limit = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.recentTransactions,
    queryFn: () => db.getRecentTransactions(limit),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      date: string;
      amount: number;
      type: 'income' | 'expense';
      category_id: number | null;
      description: string;
      account_id: number | null;
    }) => Promise.resolve(db.createTransaction(args.date, args.amount, args.type, args.category_id, args.description, args.account_id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: number;
      date: string;
      amount: number;
      type: 'income' | 'expense';
      category_id: number | null;
      description: string;
      account_id: number | null;
      oldAmount: number;
      oldType: 'income' | 'expense';
      oldAccountId: number | null;
    }) => Promise.resolve(db.updateTransaction(
      args.id, args.date, args.amount, args.type, args.category_id,
      args.description, args.account_id, args.oldAmount, args.oldType, args.oldAccountId
    )),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => Promise.resolve(db.deleteTransaction(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

// ─── Sinking Funds ───────────────────────────────────────────────────────────

export function useSinkingFunds() {
  return useQuery({
    queryKey: QUERY_KEYS.sinkingFunds,
    queryFn: () => db.getSinkingFunds(),
  });
}

export function useCreateSinkingFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fund: Omit<SinkingFund, 'id'>) => Promise.resolve(db.createSinkingFund(fund)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useUpdateSinkingFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fund }: { id: number; fund: Omit<SinkingFund, 'id'> }) =>
      Promise.resolve(db.updateSinkingFund(id, fund)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useContributeSinkingFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, accountId }: { id: number; amount: number; accountId: number | null }) =>
      Promise.resolve(db.contributeSinkingFund(id, amount, accountId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useDeleteSinkingFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => Promise.resolve(db.deleteSinkingFund(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

// ─── Scheduled Items ──────────────────────────────────────────────────────────

export function useScheduledItems() {
  return useQuery({
    queryKey: QUERY_KEYS.scheduledItems,
    queryFn: () => db.getScheduledItems(),
  });
}

export function useCreateScheduledItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: Omit<ScheduledItem, 'id'>) => Promise.resolve(db.createScheduledItem(item)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.scheduledItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useUpdateScheduledItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, item }: { id: number; item: Omit<ScheduledItem, 'id'> }) =>
      Promise.resolve(db.updateScheduledItem(id, item)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.scheduledItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useDeleteScheduledItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => Promise.resolve(db.deleteScheduledItem(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.scheduledItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useUpdateStandaloneFundWithSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fundId, fund, item }: { fundId: number; fund: Omit<SinkingFund, 'id'>; item: Omit<ScheduledItem, 'id'> }) => {
      db.updateSinkingFund(fundId, fund);
      db.createScheduledItem({ ...item, sinking_fund_id: fundId });
      return Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.scheduledItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useCreateSavingsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ item, fund }: { item: Omit<ScheduledItem, 'id'>; fund: Omit<SinkingFund, 'id'> }) => {
      const fundId = db.createSinkingFund(fund);
      db.createScheduledItem({ ...item, sinking_fund_id: fundId });
      return Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.scheduledItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useUpdateSavingsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, item, fund, fundId }: { id: number; item: Omit<ScheduledItem, 'id'>; fund: Omit<SinkingFund, 'id'>; fundId: number }) => {
      db.updateSinkingFund(fundId, fund);
      db.updateScheduledItem(id, { ...item, sinking_fund_id: fundId });
      return Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.scheduledItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useMarkScheduledItemPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      item,
      accountId,
    }: {
      item: ScheduledItem;
      accountId: number | null;
    }) => {
      const { getNextOccurrenceDate } = require('../lib/calculations');
      const today = new Date().toISOString().split('T')[0];

      if (item.type === 'savings') {
        if (item.sinking_fund_id) {
          db.contributeSinkingFund(item.sinking_fund_id, item.amount, accountId);
        }
      } else {
        const txType = item.type === 'bill' ? 'expense' : 'income';
        db.createTransaction(today, item.amount, txType, item.category_id ?? null, item.name, accountId);
      }

      const nextDate = getNextOccurrenceDate(item);
      db.advanceScheduledItemDate(item.id, nextDate);
      return Promise.resolve();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.scheduledItems });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: () => db.getSettings(),
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Omit<Settings, 'id'>) => Promise.resolve(db.saveSettings(settings)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.settings });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
    },
  });
}

export function useWipeAllData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => Promise.resolve(db.wipeAllData()),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

// ─── Safe to Spend ────────────────────────────────────────────────────────────

export function useSafeToSpend() {
  return useQuery({
    queryKey: QUERY_KEYS.safeToSpend,
    queryFn: () => {
      const totalBalance = db.getTotalBalance();
      const totalSinkingReserved = db.getTotalSinkingReserved();
      const scheduledItems = db.getScheduledItems();
      const settings = db.getSettings();
      return calculateSafeToSpend(totalBalance, totalSinkingReserved, scheduledItems, settings);
    },
  });
}
