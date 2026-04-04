import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePickerField } from '../ui/DatePickerField';
import { ColorSwatch } from '../ui/ColorSwatch';
import { COLORS } from '../../lib/utils';
import type { SinkingFund } from '../../types';

interface SinkingFundModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (fund: Omit<SinkingFund, 'id'>) => void;
  editing?: SinkingFund | null;
}

export function SinkingFundModal({ visible, onClose, onSave, editing }: SinkingFundModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [contributionPerPaycheck, setContributionPerPaycheck] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => {
    if (visible) {
      if (editing) {
        setName(editing.name);
        setTargetAmount(String(editing.target_amount));
        setCurrentAmount(String(editing.current_amount));
        setContributionPerPaycheck(editing.contribution_per_paycheck > 0 ? String(editing.contribution_per_paycheck) : '');
        setTargetDate(editing.target_date ?? '');
        setColor(editing.color);
      } else {
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setContributionPerPaycheck('');
        setTargetDate('');
        setColor('#6366f1');
      }
    }
  }, [visible, editing]);

  const handleSave = () => {
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount) || 0;
    const parsedContrib = parseFloat(contributionPerPaycheck) || 0;

    if (!name.trim() || !targetAmount || isNaN(parsedTarget) || parsedTarget <= 0) return;

    onSave({
      name: name.trim(),
      target_amount: parsedTarget,
      current_amount: parsedCurrent,
      target_date: targetDate || null,
      contribution_per_paycheck: parsedContrib,
      color,
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
                {editing ? 'Edit Fund' : 'New Sinking Fund'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: COLORS.muted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 16 }}>
                <Input
                  label="Fund Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Emergency Fund, Vacation..."
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Target Amount"
                      prefix="$"
                      value={targetAmount}
                      onChangeText={setTargetAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Current Amount"
                      prefix="$"
                      value={currentAmount}
                      onChangeText={setCurrentAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Contrib/Paycheck"
                      prefix="$"
                      value={contributionPerPaycheck}
                      onChangeText={setContributionPerPaycheck}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DatePickerField
                      label="Target Date"
                      value={targetDate}
                      onChange={setTargetDate}
                      nullable
                    />
                  </View>
                </View>

                <View style={{ gap: 8 }}>
                  <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '500' }}>Color</Text>
                  <ColorSwatch value={color} onChange={setColor} />
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 20 }}>
                  <Button title="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
                  <Button
                    title={editing ? 'Save' : 'Create'}
                    variant="primary"
                    onPress={handleSave}
                    style={{ flex: 1 }}
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
