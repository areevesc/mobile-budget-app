import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../../lib/utils';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const bgColors: Record<string, string> = {
    primary: COLORS.accent,
    secondary: COLORS.border,
    danger: '#ef4444',
    ghost: 'transparent',
    outline: 'transparent',
  };

  const textColors: Record<string, string> = {
    primary: '#ffffff',
    secondary: COLORS.primary,
    danger: '#ffffff',
    ghost: COLORS.muted,
    outline: COLORS.accent,
  };

  const paddingY: Record<string, number> = { sm: 6, md: 10, lg: 14 };
  const paddingX: Record<string, number> = { sm: 12, md: 16, lg: 20 };
  const fontSize: Record<string, number> = { sm: 13, md: 15, lg: 16 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: bgColors[variant],
          borderRadius: 8,
          paddingVertical: paddingY[size],
          paddingHorizontal: paddingX[size],
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: variant === 'outline' ? COLORS.accent : 'transparent',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColors[variant]} />
      ) : (
        <Text
          style={[
            {
              color: textColors[variant],
              fontSize: fontSize[size],
              fontWeight: '600',
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
