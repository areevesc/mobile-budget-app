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
import { ColorSwatch } from '../ui/ColorSwatch';
import { useCategories, useSinkingFunds } from '../../hooks/useQueries';
import { COLORS, RECURRENCE_LABELS } from '../../lib/utils';
import type { ScheduledItem, SinkingFund, RecurrenceInterval } from '../../types';

interface ScheduleItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: Omit<ScheduledItem, 'id'>, fund?: Omit<SinkingFund, 'id'>) => void;
  editing?: ScheduledItem | null;
  editingFund?: SinkingFund | null;
  defaultType?: 'bill' | 'paycheck' | 'savings';
  allowedTypes?: Array<'bill' | 'paycheck' | 'savings'>;
}

const RECURRENCE_OPTIONS = Object.entries(RECURRENCE_LABELS).map(([value, label]) => ({ value, label }));

export function ScheduleItemModal({ visible, onClose, onSave, editing, editingFund, defaultType = 'bill', allowedTypes = ['bill', 'paycheck', 'savings'] }: ScheduleItemModalProps) {
  const [type, setType] = useState<'bill' | 'paycheck' | 'savings'>('bill');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceInterval>('monthly');
  const [recurrenceDays, setRecurrenceDays] = useState('30');
  const [categoryId, setCategoryId] = useState<number | null>(null);

  // Savings / sinking fund fields
  const [fundColor, setFundColor] = useState(COLORS.accent);
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [linkedFundId, setLinkedFundId] = useState<number | null>(null);

  const { data: allCategories = [] } = useCategories();
  const { data: sinkingFunds = [] } = useSinkingFunds();

  const categoryType = type === 'paycheck' ? 'income' : 'expense';
  const filteredCategories = allCategories.filter((c) => c.type === categoryType);
  const categoryOptions = [
    { value: -1, label: 'No category' },
    ...filteredCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ];

  useEffect(() => {
    if (visible) {
      if (editing) {
        setType(editing.type);
        setName(editing.name);
        setAmount(String(editing.amount));
        setDueDate(editing.due_date);
        setRecurrence(editing.recurrence_interval);
        setRecurrenceDays(String(editing.recurrence_days ?? 30));
        setCategoryId(editing.category_id ?? null);
        setLinkedFundId(editing.sinking_fund_id ?? null);

        if (editing.type === 'savings' && editing.sinking_fund_id) {
          const fund = sinkingFunds.find((f) => f.id === editing.sinking_fund_id);
          if (fund) {
            setFundColor(fund.color);
            setTargetAmount(String(fund.target_amount));
            setCurrentAmount(String(fund.current_amount));
            setTargetDate(fund.target_date ?? '');
          }
        }
      } else if (editingFund) {
        // Standalone fund with no linked scheduled item
        setType('savings');
        setName(editingFund.name);
        setAmount(editingFund.contribution_per_paycheck > 0 ? String(editingFund.contribution_per_paycheck) : '');
        const today = new Date();
        setDueDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
        setRecurrence('monthly');
        setRecurrenceDays('30');
        setCategoryId(null);
        setLinkedFundId(editingFund.id);
        setFundColor(editingFund.color);
        setTargetAmount(String(editingFund.target_amount));
        setCurrentAmount(String(editingFund.current_amount));
        setTargetDate(editingFund.target_date ?? '');
      } else {
        setType(defaultType);
        setName('');
        setAmount('');
        const today = new Date();
        setDueDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
        setRecurrence('monthly');
        setRecurrenceDays('30');
        setCategoryId(null);
        setLinkedFundId(null);
        setFundColor(COLORS.accent);
        setTargetAmount('');
        setCurrentAmount('0');
        setTargetDate('');
      }
    }
  }, [visible, editing?.id, editingFund?.id, defaultType]);

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !dueDate) return;

    const item: Omit<ScheduledItem, 'id'> = {
      name: name.trim(),
      amount: parsedAmount,
      type,
      due_date: dueDate,
      recurrence_interval: recurrence,
      category: null,
      is_active: 1,
      sinking_fund_id: linkedFundId,
      recurrence_days: recurrence === 'custom' ? (parseInt(recurrenceDays) || 30) : null,
      category_id: categoryId,
    };

    if (type === 'savings') {
      const fund: Omit<SinkingFund, 'id'> = {
        name: name.trim(),
        target_amount: parseFloat(targetAmount) || 0,
        current_amount: parseFloat(currentAmount) || 0,
        target_date: targetDate || null,
        contribution_per_paycheck: parsedAmount,
        color: fundColor,
      };
      onSave(item, fund);
    } else {
      onSave(item);
    }
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
              maxHeight: '90%',
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
                {allowedTypes.length > 1 && (
                  <TogglePill
                    options={[
                      { value: 'bill', label: 'Bill' },
                      { value: 'paycheck', label: 'Paycheck' },
                      { value: 'savings', label: 'Savings' },
                    ].filter((o) => allowedTypes.includes(o.value as any))}
                    value={type}
                    onChange={(v) => { setType(v as 'bill' | 'paycheck' | 'savings'); setCategoryId(null); }}
                    activeColors={{ bill: '#ef4444', paycheck: '#10b981', savings: COLORS.accent }}
                  />
                )}

                {type === 'savings' && (
                  <>
                    <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '500' }}>Color</Text>
                    <ColorSwatch value={fundColor} onChange={setFundColor} />
                  </>
                )}

                <Input
                  label={type === 'savings' ? 'Fund Name' : 'Name'}
                  value={name}
                  onChangeText={setName}
                  placeholder={
                    type === 'bill' ? 'e.g. Rent, Netflix...' :
                    type === 'paycheck' ? 'e.g. Work Paycheck...' :
                    'e.g. Vacation, Car Repairs...'
                  }
                />

                {type === 'savings' && (
                  <>
                    <Input
                      label="Target Amount"
                      prefix="$"
                      value={targetAmount}
                      onChangeText={setTargetAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                    <Input
                      label="Already Saved (optional)"
                      prefix="$"
                      value={currentAmount}
                      onChangeText={setCurrentAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                    <DatePickerField
                      label="Target Date (optional)"
                      value={targetDate}
                      onChange={setTargetDate}
                      nullable
                    />
                  </>
                )}

                <Input
                  label={type === 'savings' ? 'Contribution Amount' : 'Amount'}
                  prefix="$"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />

                <DatePickerField label="Next Date" value={dueDate} onChange={setDueDate} />

                <Picker
                  label="Recurrence"
                  options={RECURRENCE_OPTIONS}
                  value={recurrence}
                  onChange={(v) => setRecurrence(v as RecurrenceInterval)}
                />

                {recurrence === 'custom' && (
                  <Input
                    label="Every how many days?"
                    suffix="days"
                    value={recurrenceDays}
                    onChangeText={setRecurrenceDays}
                    keyboardType="number-pad"
                    placeholder="30"
                  />
                )}

                <Picker
                  label="Category"
                  options={categoryOptions}
                  value={categoryId ?? -1}
                  onChange={(v) => setCategoryId(Number(v) === -1 ? null : Number(v))}
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
