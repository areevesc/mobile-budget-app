import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Picker } from '../ui/Picker';
import { COLORS } from '../../lib/utils';
import { useAccounts } from '../../hooks/useQueries';
import type { SinkingFund } from '../../types';

interface ContributionModalProps {
  visible: boolean;
  onClose: () => void;
  onContribute: (amount: number, accountId: number | null) => void;
  fund: SinkingFund | null;
}

export function ContributionModal({ visible, onClose, onContribute, fund }: ContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState<number | null>(null);
  const { data: accounts = [] } = useAccounts();

  const accountOptions = [
    { value: -1, label: 'No account' },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ];

  const handleContribute = () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) return;
    onContribute(parsed, accountId);
    setAmount('');
    setAccountId(null);
  };

  if (!fund) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
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
              gap: 16,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: '700' }}>Add Contribution</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: COLORS.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: COLORS.muted, fontSize: 14 }}>{fund.name}</Text>

            <Input
              label="Amount"
              prefix="$"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              autoFocus
            />

            <Picker
              label="Deduct from Account (optional)"
              options={accountOptions}
              value={accountId ?? -1}
              onChange={(v) => setAccountId(Number(v) === -1 ? null : Number(v))}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
              <Button title="Contribute" variant="primary" onPress={handleContribute} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
