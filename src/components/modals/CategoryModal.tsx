import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TogglePill } from '../ui/TogglePill';
import { ColorSwatch } from '../ui/ColorSwatch';
import { COLORS } from '../../lib/utils';
import type { Category } from '../../types';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string, type: 'income' | 'expense', color: string, icon: string) => void;
  editing?: Category | null;
}

export function CategoryModal({ visible, onClose, onSave, editing }: CategoryModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => {
    if (visible) {
      if (editing) {
        setType(editing.type);
        setName(editing.name);
        setIcon(editing.icon);
        setColor(editing.color);
      } else {
        setType('expense');
        setName('');
        setIcon('💰');
        setColor('#6366f1');
      }
    }
  }, [visible, editing]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), type, color, icon);
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
                {editing ? 'Edit Category' : 'Add Category'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: COLORS.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <TogglePill
              options={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
              value={type}
              onChange={setType}
              activeColors={{ expense: '#ef4444', income: '#10b981' }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Input
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Category name"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Icon"
                  value={icon}
                  onChangeText={setIcon}
                  placeholder="💰"
                  style={{ textAlign: 'center', fontSize: 20 }}
                />
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '500' }}>Color</Text>
              <ColorSwatch value={color} onChange={setColor} />
            </View>

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
