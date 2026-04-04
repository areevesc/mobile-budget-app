import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { format } from 'date-fns';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TogglePill } from '../ui/TogglePill';
import { Picker } from '../ui/Picker';
import { DatePickerField } from '../ui/DatePickerField';
import { COLORS } from '../../lib/utils';
import { useCategories, useAccounts } from '../../hooks/useQueries';
import type { Transaction } from '../../types';

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: {
    date: string;
    amount: number;
    type: 'income' | 'expense';
    category_id: number | null;
    description: string;
    account_id: number | null;
  }) => void;
  editing?: Transaction | null;
  initialType?: 'income' | 'expense';
}

export function TransactionModal({ visible, onClose, onSave, editing, initialType = 'expense' }: TransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();

  const filteredCategories = categories.filter((c) => c.type === type);
  const categoryOptions = filteredCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }));
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));

  useEffect(() => {
    if (visible) {
      if (editing) {
        setType(editing.type);
        setAmount(String(editing.amount));
        setDate(editing.date);
        setDescription(editing.description ?? '');
        setCategoryId(editing.category_id);
        setAccountId(editing.account_id);
      } else {
        setType(initialType);
        setAmount('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setDescription('');
        setCategoryId(null);
        setAccountId(null);
      }
    }
  }, [visible, editing, initialType]);

  // Reset category when type changes
  useEffect(() => {
    if (!editing) setCategoryId(null);
  }, [type]);

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSave({
      date,
      amount: parsedAmount,
      type,
      category_id: categoryId,
      description,
      account_id: accountId,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose}>
          <View style={{ flex: 1 }} />
          <Pressable
            style={{
              backgroundColor: COLORS.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              borderTopWidth: 1,
              borderColor: COLORS.border,
              maxHeight: '90%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: COLORS.primary, fontSize: 20, fontWeight: '700' }}>
                {editing ? 'Edit Transaction' : 'Add Transaction'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: COLORS.muted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ gap: 16 }}>
              <View style={{ gap: 16 }}>
                <TogglePill
                  options={[
                    { value: 'expense', label: 'Expense' },
                    { value: 'income', label: 'Income' },
                  ]}
                  value={type}
                  onChange={setType}
                  activeColors={{ expense: '#ef4444', income: '#10b981' }}
                />

                <Input
                  label="Amount"
                  prefix="$"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />

                <DatePickerField label="Date" value={date} onChange={setDate} />

                <Input
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What was this for?"
                />

                <Picker
                  label="Category"
                  options={categoryOptions}
                  value={categoryId}
                  onChange={(v) => setCategoryId(Number(v))}
                  placeholder="Select category..."
                />

                <Picker
                  label="Account"
                  options={accountOptions}
                  value={accountId}
                  onChange={(v) => setAccountId(Number(v))}
                  placeholder="Select account (optional)"
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 }}>
                  <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                  <Button title="Save" variant="primary" onPress={handleSave} style={{ flex: 1 }} />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
