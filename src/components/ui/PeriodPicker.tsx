import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, ViewStyle } from 'react-native';
import { COLORS, DatePreset, DATE_PRESET_LABELS } from '../../lib/utils';

const PRESETS: DatePreset[] = ['week', 'month', 'month3', 'year', 'all', 'custom'];

interface PeriodPickerProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
  style?: ViewStyle;
}

export function PeriodPicker({ value, onChange, style }: PeriodPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={style}
      contentContainerStyle={{ flexDirection: 'row', gap: 8 }}
    >
      {PRESETS.map((preset) => {
        const active = preset === value;
        return (
          <TouchableOpacity
            key={preset}
            onPress={() => onChange(preset)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: active ? COLORS.accent : COLORS.card,
              borderWidth: 1,
              borderColor: active ? COLORS.accent : COLORS.border,
            }}
          >
            <Text style={{ color: active ? '#fff' : COLORS.muted, fontSize: 13, fontWeight: '600' }}>
              {DATE_PRESET_LABELS[preset]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
