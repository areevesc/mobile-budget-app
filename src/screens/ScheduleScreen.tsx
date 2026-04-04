import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ScheduleItemModal } from '../components/modals/ScheduleItemModal';
import { MarkPaidModal } from '../components/modals/MarkPaidModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TimelineRow } from '../components/TimelineRow';
import {
  useScheduledItems,
  useCreateScheduledItem,
  useUpdateScheduledItem,
  useDeleteScheduledItem,
  useMarkScheduledItemPaid,
  useSafeToSpend,
  useSettings,
} from '../hooks/useQueries';
import { generateTimeline } from '../lib/calculations';
import { formatCurrency, formatDateShort, COLORS, RECURRENCE_LABELS } from '../lib/utils';
import type { ScheduledItem } from '../types';

export function ScheduleScreen() {
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduledItem | null>(null);
  const [markPaidItem, setMarkPaidItem] = useState<ScheduledItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduledItem | null>(null);

  const { data: scheduledItems = [] } = useScheduledItems();
  const { data: safeToSpend } = useSafeToSpend();
  const { data: settings } = useSettings();
  const createItem = useCreateScheduledItem();
  const updateItem = useUpdateScheduledItem();
  const deleteItem = useDeleteScheduledItem();
  const markPaid = useMarkScheduledItemPaid();

  const bills = scheduledItems.filter((i) => i.type === 'bill');
  const paychecks = scheduledItems.filter((i) => i.type === 'paycheck');

  const timeline60 = React.useMemo(() => {
    if (!settings) return [];
    return generateTimeline(scheduledItems, safeToSpend?.totalBalance ?? 0, settings, 60);
  }, [scheduledItems, safeToSpend?.totalBalance, settings]);

  const renderItem = (item: ScheduledItem) => {
    const isBill = item.type === 'bill';
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
        {/* Indicator */}
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: isBill ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            borderWidth: 1,
            borderColor: isBill ? 'rgba(239,68,68,0.4)' : 'rgba(52,211,153,0.4)',
          }}
        >
          <Text style={{ color: isBill ? COLORS.expense : COLORS.income, fontSize: 12 }}>
            {isBill ? '↓' : '↑'}
          </Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>{item.name}</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            {RECURRENCE_LABELS[item.recurrence_interval] ?? item.recurrence_interval} · Due {formatDateShort(item.due_date)}
          </Text>
        </View>

        {/* Amount */}
        <Text
          style={{
            color: isBill ? COLORS.expense : COLORS.income,
            fontSize: 14,
            fontWeight: '700',
            marginRight: 8,
          }}
        >
          {formatCurrency(item.amount)}
        </Text>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity
            onPress={() => setMarkPaidItem(item)}
            style={{
              padding: 6,
              backgroundColor: isBill ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
              borderRadius: 6,
            }}
          >
            <Ionicons name="checkmark-outline" size={16} color={isBill ? COLORS.expense : COLORS.income} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setEditingItem(item); setAddModalVisible(true); }}
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
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>Bills and paychecks</Text>
          </View>
          <Button
            title="Add Item"
            variant="primary"
            size="sm"
            onPress={() => { setEditingItem(null); setAddModalVisible(true); }}
          />
        </View>

        {/* Bills Card */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
            Bills ({bills.length})
          </Text>
          {bills.length === 0 ? (
            <Text style={{ color: COLORS.muted, fontSize: 14, paddingVertical: 8 }}>No bills added yet.</Text>
          ) : (
            bills.map(renderItem)
          )}
        </Card>

        {/* Paychecks Card */}
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
            Paychecks ({paychecks.length})
          </Text>
          {paychecks.length === 0 ? (
            <Text style={{ color: COLORS.muted, fontSize: 14, paddingVertical: 8 }}>No paychecks added yet.</Text>
          ) : (
            paychecks.map(renderItem)
          )}
        </Card>

        {/* 60-Day Timeline */}
        <Card>
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
            60-Day Forward Timeline
          </Text>
          {timeline60.length === 0 ? (
            <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingVertical: 16 }}>
              No upcoming scheduled items.
            </Text>
          ) : (
            timeline60.map((event) => <TimelineRow key={event.id} event={event} />)
          )}
        </Card>
      </ScrollView>

      <ScheduleItemModal
        visible={addModalVisible}
        onClose={() => { setAddModalVisible(false); setEditingItem(null); }}
        onSave={(item) => {
          if (editingItem) {
            updateItem.mutate({ id: editingItem.id, item });
          } else {
            createItem.mutate(item);
          }
          setAddModalVisible(false);
          setEditingItem(null);
        }}
        editing={editingItem}
      />

      <MarkPaidModal
        visible={markPaidItem !== null}
        onClose={() => setMarkPaidItem(null)}
        onConfirm={(accountId) => {
          if (markPaidItem) {
            markPaid.mutate({ item: markPaidItem, accountId });
          }
          setMarkPaidItem(null);
        }}
        item={markPaidItem}
      />

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete Scheduled Item"
        message="This will remove it from the timeline."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteItem.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}
