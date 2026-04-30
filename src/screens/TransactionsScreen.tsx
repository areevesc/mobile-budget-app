import React, { useMemo, useState } from 'react';
import {
  View, Text, SectionList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { TogglePill } from '../components/ui/TogglePill';
import { Picker } from '../components/ui/Picker';
import { PeriodPicker } from '../components/ui/PeriodPicker';
import { DatePickerField } from '../components/ui/DatePickerField';
import { TransactionModal } from '../components/modals/TransactionModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  useTransactions,
  useCategories,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '../hooks/useQueries';
import {
  formatCurrency,
  formatDate,
  hexToRgba,
  COLORS,
  DatePreset,
  getDateRange,
  formatSectionDate,
} from '../lib/utils';
import type { Transaction } from '../types';

type TypeFilter = 'all' | 'income' | 'expense';
type TxSection = { title: string; data: Transaction[] };

export function TransactionsScreen() {
  const today = new Date().toISOString().split('T')[0];

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const { from: dateFrom, to: dateTo } = useMemo(() => {
    if (datePreset === 'custom') return { from: customFrom, to: customTo };
    if (datePreset === 'all') return { from: undefined, to: undefined };
    return { from: getDateRange(datePreset).from, to: getDateRange(datePreset).to };
  }, [datePreset, customFrom, customTo]);

  const filters = useMemo(() => ({
    ...(typeFilter !== 'all' && { type: typeFilter }),
    ...(categoryFilter !== null && { category_id: categoryFilter }),
    ...(dateFrom && { dateFrom }),
    ...(dateTo && { dateTo }),
  }), [typeFilter, categoryFilter, dateFrom, dateTo]);

  const { data: transactions = [] } = useTransactions(filters);
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const sections: TxSection[] = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    for (const tx of transactions) {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    }
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({ title: formatSectionDate(date), data: groups[date] }));
  }, [transactions]);

  const categoryOptions = [
    { value: -1, label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ];

  const hasFilters = typeFilter !== 'all' || categoryFilter !== null || datePreset !== 'all';

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter(null);
    setDatePreset('all');
  };

  const handleSave = (data: {
    date: string; amount: number; type: 'income' | 'expense';
    category_id: number | null; description: string; account_id: number | null;
  }) => {
    if (editingTx) {
      updateTransaction.mutate({
        id: editingTx.id,
        ...data,
        oldAmount: editingTx.amount,
        oldType: editingTx.type,
        oldAccountId: editingTx.account_id,
      });
    } else {
      createTransaction.mutate(data);
    }
    setModalVisible(false);
    setEditingTx(null);
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: hexToRgba(item.category_color ?? '#6366f1', 0.15),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 18 }}>{item.category_icon ?? '💰'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.primary, fontSize: 15, fontWeight: '600' }} numberOfLines={1}>
          {item.description || item.category_name || 'Transaction'}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>
          {item.category_name ?? 'Uncategorized'} · {formatDate(item.date)}
        </Text>
      </View>

      <Text
        style={{
          color: item.type === 'income' ? COLORS.income : COLORS.expense,
          fontSize: 15,
          fontWeight: '700',
          marginRight: 12,
        }}
      >
        {item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}
      </Text>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        <TouchableOpacity
          onPress={() => { setEditingTx(item); setModalVisible(true); }}
          style={{ padding: 6 }}
        >
          <Ionicons name="pencil-outline" size={16} color={COLORS.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDeleteTarget(item)}
          style={{ padding: 6 }}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: TxSection }) => (
    <View
      style={{
        backgroundColor: COLORS.background,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
      }}
    >
      <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {section.title}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <View>
          <Text style={{ color: COLORS.primary, fontSize: 24, fontWeight: '800' }}>Transactions</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Button
          title="Add"
          variant="primary"
          size="sm"
          onPress={() => { setEditingTx(null); setModalVisible(true); }}
        />
      </View>

      {/* Filters */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8, gap: 10 }}>
        {/* Type toggle */}
        <TogglePill
          options={[
            { value: 'all', label: 'All' },
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
          activeColors={{ income: '#10b981', expense: '#ef4444', all: COLORS.accent }}
        />

        {/* Category filter */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Picker
              options={categoryOptions}
              value={categoryFilter ?? -1}
              onChange={(v) => setCategoryFilter(Number(v) === -1 ? null : Number(v))}
              placeholder="All Categories"
            />
          </View>
          {hasFilters ? (
            <TouchableOpacity
              onPress={clearFilters}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: COLORS.border,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: COLORS.muted, fontSize: 13 }}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Date preset pills */}
        <PeriodPicker value={datePreset} onChange={setDatePreset} />

        {/* Custom date range */}
        {datePreset === 'custom' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <DatePickerField label="From" value={customFrom} onChange={setCustomFrom} />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerField label="To" value={customTo} onChange={setCustomTo} />
            </View>
          </View>
        )}
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
            <Text style={{ color: COLORS.muted, fontSize: 16, marginTop: 12, textAlign: 'center' }}>
              No transactions found.
            </Text>
            {hasFilters ? (
              <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                Try clearing your filters.
              </Text>
            ) : (
              <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                Tap the Add button to add one.
              </Text>
            )}
          </View>
        }
      />

      <TransactionModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingTx(null); }}
        onSave={handleSave}
        editing={editingTx}
        initialType="expense"
      />

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete Transaction"
        message="This will also reverse the account balance change."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteTransaction.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}
