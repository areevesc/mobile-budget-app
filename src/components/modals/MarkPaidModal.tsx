import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Button } from '../ui/Button';
import { Picker } from '../ui/Picker';
import { COLORS, formatCurrency } from '../../lib/utils';
import { useAccounts } from '../../hooks/useQueries';
import type { ScheduledItem } from '../../types';

interface MarkPaidModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (accountId: number | null) => void;
  item: ScheduledItem | null;
}

export function MarkPaidModal({ visible, onClose, onConfirm, item }: MarkPaidModalProps) {
  const [accountId, setAccountId] = useState<number | null>(null);
  const { data: accounts = [] } = useAccounts();

  const accountOptions = [
    { value: -1, label: 'No account' },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ];

  if (!item) return null;

  const label = item.type === 'bill' ? 'Mark as Paid' : item.type === 'paycheck' ? 'Mark as Received' : 'Mark as Contributed';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 20,
            gap: 14,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: '700' }}>{label}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: COLORS.muted }}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: COLORS.muted, fontSize: 14 }}>
            {item.name} — {formatCurrency(item.amount)}
          </Text>

          <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 18 }}>
            {item.type === 'savings'
              ? 'This will add to the sinking fund balance and advance to the next occurrence.'
              : 'This will log a transaction and advance to the next occurrence.'}
          </Text>

          <Picker
            label={item.type === 'savings' ? 'Deduct from Account (optional)' : 'Deduct from Account (optional)'}
            options={accountOptions}
            value={accountId ?? -1}
            onChange={(v) => setAccountId(Number(v) === -1 ? null : Number(v))}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button
              title="Confirm"
              variant="primary"
              onPress={() => onConfirm(accountId)}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
