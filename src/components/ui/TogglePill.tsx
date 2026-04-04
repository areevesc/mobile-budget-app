import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { COLORS } from '../../lib/utils';

interface TogglePillProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  activeColors?: Partial<Record<T, string>>;
}

export function TogglePill<T extends string>({
  options,
  value,
  onChange,
  activeColors,
}: TogglePillProps<T>) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#0f0f11',
        borderRadius: 8,
        padding: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        const activeBg = activeColors?.[opt.value] ?? COLORS.accent;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 6,
              alignItems: 'center',
              backgroundColor: isActive ? activeBg : 'transparent',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: isActive ? '#ffffff' : COLORS.muted,
                fontSize: 14,
                fontWeight: isActive ? '600' : '400',
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
