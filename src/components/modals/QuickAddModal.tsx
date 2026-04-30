import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { Button } from '../ui/Button';
import { TogglePill } from '../ui/TogglePill';
import { Picker } from '../ui/Picker';
import { DatePickerField } from '../ui/DatePickerField';
import { Input } from '../ui/Input';
import { COLORS } from '../../lib/utils';
import { useCategories, useAccounts, useSinkingFunds } from '../../hooks/useQueries';
import { parseInput } from '../../lib/parser';
import type { ParseResult } from '../../lib/parser';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveTransaction: (data: {
    date: string;
    amount: number;
    type: 'income' | 'expense';
    category_id: number | null;
    description: string;
    account_id: number | null;
  }) => void;
  onContributeFund: (fundId: number, amount: number, accountId: number | null) => void;
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: '#10b981',
  medium: '#facc15',
  low: '#f87171',
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'Looks good',
  medium: 'Review fields',
  low: 'Could not parse',
};

export function QuickAddModal({ visible, onClose, onSaveTransaction, onContributeFund }: QuickAddModalProps) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);

  // Editable fields (start from parsed, user can tweak)
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [fundId, setFundId] = useState<number | null>(null);
  const [isFund, setIsFund] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: funds = [] } = useSinkingFunds();

  const today = new Date().toISOString().split('T')[0];

  // Reset on open
  useEffect(() => {
    if (visible) {
      const defaultAcct = accounts.find((a) => a.is_default === 1);
      setText('');
      setParsed(null);
      setType('expense');
      setAmount('');
      setDate(today);
      setDescription('');
      setCategoryId(null);
      setAccountId(defaultAcct?.id ?? (accounts[0]?.id ?? null));
      setFundId(null);
      setIsFund(false);
    }
  }, [visible, accounts.length]);

  // Parse on every text change
  useEffect(() => {
    if (!text.trim()) {
      setParsed(null);
      return;
    }
    const result = parseInput(text, { categories, accounts, funds });
    setParsed(result);

    // Populate editable fields from parse result
    setType(result.type);
    setAmount(result.amount !== null ? String(result.amount) : '');
    setDate(result.date);
    setDescription(result.description);
    setCategoryId(result.category_id);
    setAccountId(result.account_id);
    setFundId(result.fund_id);
    setIsFund(result.action === 'contribute_fund');
  }, [text, categories.length, accounts.length, funds.length]);

  // Category options filtered by type
  const filteredCategories = categories.filter((c) => c.type === type);
  const categoryOptions = [
    { value: -1, label: 'No category' },
    ...filteredCategories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ];
  const accountOptions = [
    { value: -1, label: 'No account' },
    ...accounts.map((a) => ({ value: a.id, label: a.name })),
  ];
  const fundOptions = funds.map((f) => ({ value: f.id, label: `${f.name}` }));

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (isFund && fundId !== null) {
      onContributeFund(fundId, parsedAmount, accountId === -1 ? null : accountId);
    } else {
      onSaveTransaction({
        date,
        amount: parsedAmount,
        type,
        category_id: categoryId === -1 ? null : categoryId,
        description,
        account_id: accountId === -1 ? null : accountId,
      });
    }
    onClose();
  };

  const canSave = (() => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) return false;
    if (isFund) return fundId !== null;
    return true;
  })();

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
              maxHeight: '92%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 20 }}>✨</Text>
                <Text style={{ color: COLORS.primary, fontSize: 20, fontWeight: '700' }}>Quick Add</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: COLORS.muted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Natural language input */}
            <View
              style={{
                backgroundColor: COLORS.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: text.length > 0 ? COLORS.accent : COLORS.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                marginBottom: 16,
              }}
            >
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder='e.g. "spent 47 at walmart" or "got paid 1200"'
                placeholderTextColor={COLORS.muted}
                style={{ color: COLORS.primary, fontSize: 15, minHeight: 44 }}
                multiline
                autoFocus
              />
            </View>

            {/* Confidence badge */}
            {parsed && text.trim().length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: CONFIDENCE_COLOR[parsed.confidence],
                  }}
                />
                <Text style={{ color: CONFIDENCE_COLOR[parsed.confidence], fontSize: 12, fontWeight: '600' }}>
                  {CONFIDENCE_LABEL[parsed.confidence]}
                </Text>
                {parsed.unresolved.length > 0 && (
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    · fill in {parsed.unresolved.join(', ')}
                  </Text>
                )}
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 14 }}>
                {/* Fund contribution mode */}
                {isFund ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: `${COLORS.accent}22`, borderRadius: 8, padding: 10 }}>
                      <Text style={{ fontSize: 18 }}>🐷</Text>
                      <Text style={{ color: COLORS.accent, fontSize: 13, fontWeight: '600' }}>Fund Contribution</Text>
                      <TouchableOpacity onPress={() => setIsFund(false)} style={{ marginLeft: 'auto' }}>
                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>Switch to transaction</Text>
                      </TouchableOpacity>
                    </View>
                    <Picker
                      label="Sinking Fund"
                      options={fundOptions}
                      value={fundId}
                      onChange={(v) => setFundId(Number(v))}
                      placeholder="Select fund..."
                    />
                  </>
                ) : (
                  <>
                    <TogglePill
                      options={[
                        { value: 'expense', label: 'Expense' },
                        { value: 'income', label: 'Income' },
                      ]}
                      value={type}
                      onChange={(v) => { setType(v as 'income' | 'expense'); setCategoryId(null); }}
                      activeColors={{ expense: '#ef4444', income: '#10b981' }}
                    />
                    {funds.length > 0 && (
                      <TouchableOpacity onPress={() => setIsFund(true)} style={{ alignSelf: 'flex-end' }}>
                        <Text style={{ color: COLORS.muted, fontSize: 12 }}>Switch to fund contribution →</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                <Input
                  label="Amount"
                  prefix="$"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />

                <DatePickerField label="Date" value={date || today} onChange={setDate} />

                <Input
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What was this for?"
                />

                {!isFund && (
                  <Picker
                    label="Category"
                    options={categoryOptions}
                    value={categoryId ?? -1}
                    onChange={(v) => setCategoryId(Number(v) === -1 ? null : Number(v))}
                    placeholder="Select category..."
                  />
                )}

                <Picker
                  label="Account"
                  options={accountOptions}
                  value={accountId ?? -1}
                  onChange={(v) => setAccountId(Number(v) === -1 ? null : Number(v))}
                  placeholder="No account"
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 24 }}>
                  <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                  <Button
                    title="Add"
                    variant="primary"
                    onPress={handleSave}
                    style={{ flex: 1, opacity: canSave ? 1 : 0.4 }}
                    disabled={!canSave}
                  />
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
