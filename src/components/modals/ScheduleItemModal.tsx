import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TogglePill } from '../ui/TogglePill';
import { Picker } from '../ui/Picker';
import { DatePickerField } from '../ui/DatePickerField';
import { COLORS, RECURRENCE_LABELS } from '../../lib/utils';
import type { ScheduledItem, RecurrenceInterval } from '../../types';

interface ScheduleItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: Omit<ScheduledItem, 'id'>) => void;
  editing?: ScheduledItem | null;
}

const RECURRENCE_OPTIONS = Object.entries(RECURRENCE_LABELS).map(([value, label]) => ({ value, label }));

export function ScheduleItemModal({ visible, onClose, onSave, editing }: ScheduleItemModalProps) {
  const [type, setType] = useState<'bill' | 'paycheck'>('bill');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceInterval>('monthly');

  useEffect(() => {
    if (visible) {
      if (editing) {
        setType(editing.type);
        setName(editing.name);
        setAmount(String(editing.amount));
        setDueDate(editing.due_date);
        setRecurrence(editing.recurrence_interval);
      } else {
        setType('bill');
        setName('');
        setAmount('');
        const today = new Date();
        setDueDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
        setRecurrence('monthly');
      }
    }
  }, [visible, editing]);

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || !amount || isNaN(parsedAmount) || parsedAmount <= 0 || !dueDate) return;

    onSave({
      name: name.trim(),
      amount: parsedAmount,
      type,
      due_date: dueDate,
      recurrence_interval: recurrence,
      category: null,
      is_active: 1,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
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
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: COLORS.primary, fontSize: 20, fontWeight: '700' }}>
                {editing ? 'Edit Item' : 'Add Scheduled Item'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: COLORS.muted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 16 }}>
                <TogglePill
                  options={[
                    { value: 'bill', label: 'Bill' },
                    { value: 'paycheck', label: 'Paycheck' },
                  ]}
                  value={type}
                  onChange={setType}
                  activeColors={{ bill: '#ef4444', paycheck: '#10b981' }}
                />

                <Input
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  placeholder={type === 'bill' ? 'e.g. Rent, Netflix...' : 'e.g. Work Paycheck...'}
                />

                <Input
                  label="Amount"
                  prefix="$"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />

                <DatePickerField label="Next Due Date" value={dueDate} onChange={setDueDate} />

                <Picker
                  label="Recurrence"
                  options={RECURRENCE_OPTIONS}
                  value={recurrence}
                  onChange={(v) => setRecurrence(v as RecurrenceInterval)}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 }}>
                  <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                  <Button title={editing ? 'Save' : 'Add'} variant="primary" onPress={handleSave} style={{ flex: 1 }} />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
