import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SWATCH_COLORS } from '../../lib/utils';

interface ColorSwatchProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatch({ value, onChange }: ColorSwatchProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {SWATCH_COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          onPress={() => onChange(color)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: color,
            borderWidth: value === color ? 3 : 0,
            borderColor: '#ffffff',
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: value === color ? 0.8 : 0,
            shadowRadius: 4,
          }}
        />
      ))}
    </View>
  );
}
