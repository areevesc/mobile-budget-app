import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { COLORS } from '../../lib/utils';
import type { Account } from '../../types';

interface AccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, balance: number) => void;
  editing?: Account | null;
}

export function AccountModal({ visible, onClose, onSave, editing }: AccountModalProps) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    if (visible) {
      if (editing) {
        setName(editing.name);
        setBalance(String(editing.current_balance));
      } else {
        setName('');
        setBalance('');
      }
    }
  }, [visible, editing]);

  const handleSave = () => {
    const parsedBalance = parseFloat(balance) || 0;
    if (!name.trim()) return;
    onSave(name.trim(), parsedBalance);
  };

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
