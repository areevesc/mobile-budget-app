import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, formatCurrency, formatDateShort } from '../lib/utils';
import type { TimelineEvent } from '../types';

interface TimelineRowProps {
  event: TimelineEvent;
}

const STATUS_STYLES = {
  danger: {
    bg: 'rgba(127, 29, 29, 0.4)',
    border: 'rgba(153, 27, 27, 0.5)',
  },
  warning: {
    bg: 'rgba(113, 63, 18, 0.4)',
    border: 'rgba(113, 63, 18, 0.4)',
  },
  normal: {
    bg: 'rgba(255,255,255,0.04)',
    border: 'transparent',
  },
};

export function TimelineRow({ event }: TimelineRowProps) {
  const isBill = event.type === 'bill';
  const statusStyle = STATUS_STYLES[event.status];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 6,
        backgroundColor: statusStyle.bg,
        borderWidth: 1,
        borderColor: statusStyle.border,
      }}
    >
      {/* Indicator */}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: isBill ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
          borderWidth: 1,
          borderColor: isBill ? 'rgba(239,68,68,0.4)' : 'rgba(52,211,153,0.4)',
        }}
      >
        <Text style={{ color: isBill ? COLORS.expense : COLORS.income, fontSize: 12 }}>
          {isBill ? '↓' : '↑'}
        </Text>
      </View>

      {/* Name and date */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>{formatDateShort(event.date)}</Text>
      </View>

      {/* Amount and running balance */}
      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            color: isBill ? COLORS.expense : COLORS.income,
            fontSize: 14,
            fontWeight: '600',
          }}
        >
          {isBill ? '−' : '+'}{formatCurrency(event.amount)}
        </Text>
        <Text
          style={{
            color:
              event.status === 'danger'
                ? COLORS.expense
                : event.status === 'warning'
                ? COLORS.warning
                : COLORS.muted,
            fontSize: 12,
          }}
        >
          {formatCurrency(event.runningBalance)}
        </Text>
      </View>
    </View>
  );
}
