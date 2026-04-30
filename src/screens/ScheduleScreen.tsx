import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ScheduleItemModal } from '../components/modals/ScheduleItemModal';
import { MarkPaidModal } from '../components/modals/MarkPaidModal';
import { SinkingFundModal } from '../components/modals/SinkingFundModal';
import { ContributionModal } from '../components/modals/ContributionModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  useScheduledItems,
  useCreateScheduledItem,
  useUpdateScheduledItem,
  useDeleteScheduledItem,
  useMarkScheduledItemPaid,
  useCreateSavingsItem,
  useUpdateSavingsItem,
  useUpdateStandaloneFundWithSchedule,
  useSinkingFunds,
  useCreateSinkingFund,
  useUpdateSinkingFund,
  useDeleteSinkingFund,
  useContributeSinkingFund,
} from '../hooks/useQueries';
import { formatCurrency, formatDateShort, COLORS, RECURRENCE_LABELS } from '../lib/utils';
import type { ScheduledItem, SinkingFund } from '../types';

export function ScheduleScreen() {
  // Scheduled items state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledItem | null>(null);
  const [markPaidItem, setMarkPaidItem] = useState<ScheduledItem | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<ScheduledItem | null>(null);

  // Sinking funds state
  const [addModalDefaultType, setAddModalDefaultType] = useState<'bill' | 'paycheck' | 'savings'>('bill');
  const [addModalAllowedTypes, setAddModalAllowedTypes] = useState<Array<'bill' | 'paycheck' | 'savings'>>(['bill', 'paycheck']);
  const [editingFundForModal, setEditingFundForModal] = useState<SinkingFund | null>(null);
  const [fundModalVisible, setFundModalVisible] = useState(false);
  const [editingFund, setEditingFund] = useState<SinkingFund | null>(null);
  const [contributionFund, setContributionFund] = useState<SinkingFund | null>(null);
  const [deleteFundTarget, setDeleteFundTarget] = useState<SinkingFund | null>(null);

  // Scheduled items hooks
  const { data: scheduledItems = [] } = useScheduledItems();
  const createItem = useCreateScheduledItem();
  const updateItem = useUpdateScheduledItem();
  const deleteItem = useDeleteScheduledItem();
  const markPaid = useMarkScheduledItemPaid();
  const createSavingsItem = useCreateSavingsItem();
  const updateSavingsItem = useUpdateSavingsItem();
  const updateStandaloneFund = useUpdateStandaloneFundWithSchedule();

  // Sinking fund hooks
  const { data: funds = [] } = useSinkingFunds();
  const createFund = useCreateSinkingFund();
  const updateFund = useUpdateSinkingFund();
  const deleteFund = useDeleteSinkingFund();
  const contribute = useContributeSinkingFund();

  const bills = scheduledItems.filter((i) => i.type === 'bill');
  const paychecks = scheduledItems.filter((i) => i.type === 'paycheck');
  const savings = scheduledItems.filter((i) => i.type === 'savings');

  const totalReserved = funds.reduce((s, f) => s + f.current_amount, 0);
  const totalTarget = funds.reduce((s, f) => s + f.target_amount, 0);
  const overallProgress = totalTarget > 0 ? totalReserved / totalTarget : 0;

  const handleSaveItem = (item: Omit<ScheduledItem, 'id'>, fund?: any) => {
    if (item.type === 'savings' && fund) {
      if (editingItem && editingItem.sinking_fund_id) {
        // Editing a savings item that already has a linked fund
        updateSavingsItem.mutate({ id: editingItem.id, item, fund, fundId: editingItem.sinking_fund_id });
      } else if (editingFundForModal) {
        // Editing a standalone fund — update fund + create linked scheduled item
        updateStandaloneFund.mutate({ fundId: editingFundForModal.id, fund, item });
      } else {
        // New savings item — create fund + scheduled item together
        createSavingsItem.mutate({ item, fund });
      }
    } else {
      if (editingItem) {
        updateItem.mutate({ id: editingItem.id, item });
      } else {
        createItem.mutate(item);
      }
    }
    setAddModalVisible(false);
    setEditingItem(null);
    setEditingFundForModal(null);
  };

  const renderScheduledItem = (item: ScheduledItem) => {
    const color = item.type === 'bill' ? COLORS.expense : item.type === 'paycheck' ? COLORS.income : COLORS.accent;
    const bgColor = item.type === 'bill' ? 'rgba(239,68,68,0.2)' : item.type === 'paycheck' ? 'rgba(52,211,153,0.2)' : 'rgba(99,102,241,0.2)';
    const borderColor = item.type === 'bill' ? 'rgba(239,68,68,0.4)' : item.type === 'paycheck' ? 'rgba(52,211,153,0.4)' : 'rgba(99,102,241,0.4)';
    const symbol = item.type === 'bill' ? '↓' : item.type === 'paycheck' ? '↑' : '🐷';

    return (
      <View
        key={item.id}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            borderWidth: 1,
            borderColor,
          }}
        >
          <Text style={{ color, fontSize: item.type === 'savings' ? 14 : 12 }}>{symbol}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>{item.name}</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            {item.recurrence_interval === 'custom'
              ? `Every ${item.recurrence_days ?? 30} days`
              : (RECURRENCE_LABELS[item.recurrence_interval] ?? item.recurrence_interval)
            } · Next {formatDateShort(item.due_date)}
          </Text>
          {item.category_name ? (
            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
              {item.category_icon} {item.category_name}
            </Text>
          ) : null}
        </View>

        <Text style={{ color, fontSize: 14, fontWeight: '700', marginRight: 8 }}>
          {formatCurrency(item.amount)}
        </Text>

        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity
            onPress={() => setMarkPaidItem(item)}
            style={{ padding: 6, backgroundColor: `${color}1A`, borderRadius: 6 }}
          >
            <Ionicons name="checkmark-outline" size={16} color={color} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setEditingItem(item);
              setEditingFundForModal(null);
              setAddModalDefaultType(item.type);
              setAddModalAllowedTypes(item.type === 'savings' ? ['savings'] : ['bill', 'paycheck']);
              setAddModalVisible(true);
            }}
            style={{ padding: 6 }}
          >
            <Ionicons name="pencil-outline" size={16} color={COLORS.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDeleteItemTarget(item)}
            style={{ padding: 6 }}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            paddingTop: 8,
          }}
        >
          <View>
            <Text style={{ color: COLORS.primary, fontSize: 24, fontWeight: '800' }}>Schedule</Text>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>Bills, paychecks & savings</Text>
          </View>
          <Button
            title="Add Item"
            variant="primary"
            size="sm"
            onPress={() => { setEditingItem(null); setEditingFundForModal(null); setAddModalDefaultType('bill'); setAddModalAllowedTypes(['bill', 'paycheck']); setAddModalVisible(true); }}
          />
        </View>

        {/* Bills */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
            Bills ({bills.length})
          </Text>
          {bills.length === 0 ? (
            <Text style={{ color: COLORS.muted, fontSize: 14, paddingVertical: 8 }}>No bills added yet.</Text>
          ) : bills.map(renderScheduledItem)}
        </Card>

        {/* Paychecks */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
            Paychecks ({paychecks.length})
          </Text>
          {paychecks.length === 0 ? (
            <Text style={{ color: COLORS.muted, fontSize: 14, paddingVertical: 8 }}>No paychecks added yet.</Text>
          ) : paychecks.map(renderScheduledItem)}
        </Card>

        {/* ── Sinking Funds ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
          <Text style={{ color: COLORS.primary, fontSize: 20, fontWeight: '800' }}>Sinking Funds</Text>
          <Button
            title="New Fund"
            variant="outline"
            size="sm"
            onPress={() => { setEditingItem(null); setEditingFundForModal(null); setAddModalDefaultType('savings'); setAddModalAllowedTypes(['savings']); setAddModalVisible(true); }}
          />
        </View>

        {funds.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
              <Text style={{ fontSize: 40 }}>🐷</Text>
              <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center' }}>
                No sinking funds yet. Add a savings item above or tap New Fund.
              </Text>
            </View>
          </Card>
        ) : (
          <>
            {/* Summary row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <Card style={{ flex: 1, padding: 12 }}>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>Reserved</Text>
                <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700' }}>
                  {formatCurrency(totalReserved)}
                </Text>
              </Card>
              <Card style={{ flex: 1, padding: 12 }}>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>Target</Text>
                <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700' }}>
                  {formatCurrency(totalTarget)}
                </Text>
              </Card>
              <Card style={{ flex: 1, padding: 12 }}>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>Progress</Text>
                <Text style={{ color: COLORS.accent, fontSize: 16, fontWeight: '700' }}>
                  {Math.round(overallProgress * 100)}%
                </Text>
              </Card>
            </View>

            {/* Fund cards */}
            {funds.map((fund) => {
              const progress = fund.target_amount > 0 ? Math.min(1, fund.current_amount / fund.target_amount) : 0;
              const remaining = Math.max(0, fund.target_amount - fund.current_amount);
              const paychecksLeft = fund.contribution_per_paycheck > 0
                ? Math.ceil(remaining / fund.contribution_per_paycheck)
                : null;

              return (
                <Card key={fund.id} style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  <View style={{ height: 4, backgroundColor: fund.color }} />
                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.primary, fontSize: 17, fontWeight: '700' }}>{fund.name}</Text>
                        {fund.target_date ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
                            <Ionicons name="calendar-outline" size={12} color={COLORS.muted} />
                            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                              Target: {formatDateShort(fund.target_date)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity
                          onPress={() => {
                            const linked = savings.find((s) => s.sinking_fund_id === fund.id);
                            setAddModalAllowedTypes(['savings']);
                            setAddModalDefaultType('savings');
                            if (linked) {
                              setEditingItem(linked);
                              setEditingFundForModal(null);
                            } else {
                              setEditingItem(null);
                              setEditingFundForModal(fund);
                            }
                            setAddModalVisible(true);
                          }}
                          style={{ padding: 6 }}
                        >
                          <Ionicons name="pencil-outline" size={16} color={COLORS.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setDeleteFundTarget(fund)}
                          style={{ padding: 6 }}
                        >
                          <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                      <Text style={{ color: fund.color, fontSize: 26, fontWeight: '800' }}>
                        {formatCurrency(fund.current_amount)}
                      </Text>
                      <Text style={{ color: COLORS.muted, fontSize: 14 }}>
                        of {formatCurrency(fund.target_amount)}
                      </Text>
                    </View>

                    <ProgressBar progress={progress} color={fund.color} height={8} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 }}>
                      <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                        {Math.round(progress * 100)}% saved
                      </Text>
                      <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                        {formatCurrency(remaining)} remaining
                      </Text>
                    </View>

                    {fund.contribution_per_paycheck > 0 ? (
                      <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 14 }}>
                        {formatCurrency(fund.contribution_per_paycheck)}/paycheck
                        {paychecksLeft !== null ? ` · ~${paychecksLeft} paychecks left` : ''}
                      </Text>
                    ) : null}

                    <Button
                      title="Add Contribution"
                      variant="outline"
                      onPress={() => setContributionFund(fund)}
                    />
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>

      <ScheduleItemModal
        visible={addModalVisible}
        onClose={() => { setAddModalVisible(false); setEditingItem(null); setEditingFundForModal(null); }}
        onSave={handleSaveItem}
        editing={editingItem}
        editingFund={editingFundForModal}
        defaultType={addModalDefaultType}
        allowedTypes={addModalAllowedTypes}
      />

      <MarkPaidModal
        visible={markPaidItem !== null}
        onClose={() => setMarkPaidItem(null)}
        onConfirm={(accountId) => {
          if (markPaidItem) markPaid.mutate({ item: markPaidItem, accountId });
          setMarkPaidItem(null);
        }}
        item={markPaidItem}
      />

      <SinkingFundModal
        visible={fundModalVisible}
        onClose={() => { setFundModalVisible(false); setEditingFund(null); }}
        onSave={(fund) => {
          if (editingFund) {
            updateFund.mutate({ id: editingFund.id, fund });
          } else {
            createFund.mutate(fund);
          }
          setFundModalVisible(false);
          setEditingFund(null);
        }}
        editing={editingFund}
      />

      <ContributionModal
        visible={contributionFund !== null}
        onClose={() => setContributionFund(null)}
        onContribute={(amount, accountId) => {
          if (contributionFund) contribute.mutate({ id: contributionFund.id, amount, accountId });
          setContributionFund(null);
        }}
        fund={contributionFund}
      />

      <ConfirmDialog
        visible={deleteItemTarget !== null}
        title="Delete Scheduled Item"
        message="This will remove the scheduled contribution. The sinking fund balance is unchanged."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteItemTarget) deleteItem.mutate(deleteItemTarget.id);
          setDeleteItemTarget(null);
        }}
        onCancel={() => setDeleteItemTarget(null)}
      />

      <ConfirmDialog
        visible={deleteFundTarget !== null}
        title="Delete Sinking Fund"
        message="This will remove the fund and any linked savings schedule. The balance will be released."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteFundTarget) deleteFund.mutate(deleteFundTarget.id);
          setDeleteFundTarget(null);
        }}
        onCancel={() => setDeleteFundTarget(null)}
      />
    </SafeAreaView>
  );
}
