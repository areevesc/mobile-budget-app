import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/utils';

interface PickerOption {
  value: string | number;
  label: string;
}

interface PickerProps {
  label?: string;
  options: PickerOption[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
}

export function Picker({ label, options, value, onChange, placeholder = 'Select...' }: PickerProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 4 }}>
      {label ? (
        <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '500' }}>{label}</Text>
      ) : null}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f0f11',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: COLORS.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text style={{ color: selected ? COLORS.primary : COLORS.muted, fontSize: 16 }}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: COLORS.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              maxHeight: 400,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ color: COLORS.primary, fontSize: 16 }}>{item.label}</Text>
                  {item.value === value ? (
                    <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
