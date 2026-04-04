import React from 'react';
import { View, ViewStyle } from 'react-native';
import { COLORS } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: COLORS.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
