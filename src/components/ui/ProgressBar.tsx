import React from 'react';
import { View } from 'react-native';
import { COLORS } from '../../lib/utils';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color = COLORS.accent, height = 6 }: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return (
    <View
      style={{
        height,
        backgroundColor: COLORS.border,
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height,
          width: `${clampedProgress * 100}%`,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
