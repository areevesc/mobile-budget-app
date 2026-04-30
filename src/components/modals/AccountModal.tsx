import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { COLORS } from '../../lib/utils';
import type { Account } from '../../types';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, balance: number, isDefault: boolean) => void;
  editing?: Account | null;
  totalAccounts?: number;
}

export function AccountModal({ visible, onClose, onSave, editing, totalAccounts = 0 }: AccountModalProps) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editing) {
        setName(editing.name);
        setBalance(String(editing.current_balance));
        setIsDefault(editing.is_default === 1);
      } else {
        setName('');
        setBalance('');
        // First account auto-defaults
        setIsDefault(totalAccounts === 0);
      }
    }
  }, [visible, editing?.id, totalAccounts]);

  const handleSave = () => {
    const parsedBalance = parseFloat(balance) || 0;
    if (!name.trim()) return;
    onSave(name.trim(), parsedBalance, isDefault);
  };

  // First-account lock: always default, no toggle
  const isFirstAccount = !editing && totalAccounts === 0;

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
              <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: '700' }}>
                {editing ? 'Edit Account' : 'Add Account'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: COLORS.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Account Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Checking, Savings..."
              autoFocus
            />

            <Input
              label="Current Balance"
              prefix="$"
              value={balance}
              onChangeText={setBalance}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            {/* Default account toggle */}
            <TouchableOpacity
              onPress={() => !isFirstAccount && setIsDefault(!isDefault)}
              activeOpacity={isFirstAccount ? 1 : 0.7}
              disabled={isFirstAccount}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                backgroundColor: isDefault ? `${COLORS.accent}22` : COLORS.background,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDefault ? COLORS.accent : COLORS.border,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: isDefault ? COLORS.accent : 'transparent',
                  borderWidth: 2,
                  borderColor: isDefault ? COLORS.accent : COLORS.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDefault && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>
                  Default account
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                  {isFirstAccount
                    ? 'First account is always default'
                    : 'Pre-selected when adding transactions'}
                </Text>
              </View>
            </TouchableOpacity>

            {editing ? (
              <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                Changing balance here is a direct adjustment.
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
              <Button title="Save" variant="primary" onPress={handleSave} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
