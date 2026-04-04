import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { TogglePill } from '../components/ui/TogglePill';
import { Picker } from '../components/ui/Picker';
import { TransactionModal } from '../components/modals/TransactionModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  useTransactions,
  useCategories,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '../hooks/useQueries';
import { formatCurrency, formatDate, hexToRgba, COLORS } from '../lib/utils';
import type { Transaction } from '../types';

type TypeFilter = 'all' | 'income' | 'expense';

export function TransactionsScreen() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const filters: { type?: string; category_id?: number } = {};
  if (typeFilter !== 'all') filters.type = typeFilter;
  if (categoryFilter !== null) filters.category_id = categoryFilter;

  const { data: transactions = [] } = useTransactions(filters);
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const categoryOptions = [
    { value: -1, label: 'All Categories' },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ];

  const hasFilters = typeFilter !== 'all' || categoryFilter !== null;

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
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 10 }}>
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
              onPress={() => { setTypeFilter('all'); setCategoryFilter(null); }}
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
      </View>

      {/* List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
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
                Tap the + button to add one.
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
