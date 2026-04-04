import React from 'react';
import { View, Text, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { COLORS } from '../../lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  prefix?: string;
  suffix?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, prefix, suffix, error, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={[{ gap: 4 }, containerStyle]}>
      {label ? (
        <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '500' }}>{label}</Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#0f0f11',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: error ? '#ef4444' : COLORS.border,
          paddingHorizontal: 12,
        }}
      >
        {prefix ? (
          <Text style={{ color: COLORS.muted, fontSize: 16, marginRight: 4 }}>{prefix}</Text>
        ) : null}
        <TextInput
          style={[
            {
              flex: 1,
              color: COLORS.primary,
              fontSize: 16,
              paddingVertical: 10,
            },
            style,
          ]}
          placeholderTextColor={COLORS.muted}
          {...props}
        />
        {suffix ? (
          <Text style={{ color: COLORS.muted, fontSize: 14, marginLeft: 4 }}>{suffix}</Text>
        ) : null}
      </View>
      {error ? (
        <Text style={{ color: '#ef4444', fontSize: 12 }}>{error}</Text>
      ) : null}
    </View>
  );
}
