import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { PeriodPicker } from '../components/ui/PeriodPicker';
import { DatePickerField } from '../components/ui/DatePickerField';
import { useSpendingByCategory, usePeriodSummary, QUERY_KEYS } from '../hooks/useQueries';
import {
  formatCurrency,
  formatDate,
  COLORS,
  hexToRgba,
  DatePreset,
  getDateRange,
} from '../lib/utils';
import { format } from 'date-fns';

export function InsightsScreen() {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [datePreset, setDatePreset] = React.useState<DatePreset>('month');
  const [customFrom, setCustomFrom] = React.useState(today);
  const [customTo, setCustomTo] = React.useState(today);

  const { from: dateFrom, to: dateTo } = useMemo(() => {
    if (datePreset === 'custom') return { from: customFrom, to: customTo };
    if (datePreset === 'all') return { from: '1970-01-01', to: '9999-12-31' };
    return getDateRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  useFocusEffect(
    React.useCallback(() => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.spendingByCategory(dateFrom, dateTo) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.periodSummary(dateFrom, dateTo) });
    }, [dateFrom, dateTo])
  );

  const { data: spending = [] } = useSpendingByCategory(dateFrom, dateTo);
  const { data: summary } = usePeriodSummary(dateFrom, dateTo);

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpense = summary?.totalExpense ?? 0;
  const net = totalIncome - totalExpense;

  const periodLabel = useMemo(() => {
    if (datePreset === 'custom') {
      return `${formatDate(customFrom)} – ${formatDate(customTo)}`;
    }
    if (datePreset === 'all') return 'All time';
    if (datePreset === 'month') {
      try { return format(new Date(), 'MMMM yyyy'); } catch { return ''; }
    }
    return `${formatDate(dateFrom)} – ${formatDate(dateTo)}`;
  }, [datePreset, dateFrom, dateTo, customFrom, customTo]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: COLORS.primary, fontSize: 28, fontWeight: '800' }}>Insights</Text>
          <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 2 }}>{periodLabel}</Text>
        </View>

        {/* Period picker */}
        <PeriodPicker value={datePreset} onChange={setDatePreset} style={{ marginBottom: 14 }} />

        {/* Custom date range */}
        {datePreset === 'custom' && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <DatePickerField label="From" value={customFrom} onChange={setCustomFrom} />
            </View>
            <View style={{ flex: 1 }}>
              <DatePickerField label="To" value={customTo} onChange={setCustomTo} />
            </View>
          </View>
        )}

        {/* Income / Expenses cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <Card style={{ flex: 1 }}>
            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Income</Text>
            <Text style={{ color: COLORS.income, fontSize: 20, fontWeight: '800' }}>
              {formatCurrency(totalIncome)}
            </Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '500', marginBottom: 6 }}>Expenses</Text>
            <Text style={{ color: COLORS.expense, fontSize: 20, fontWeight: '800' }}>
              {formatCurrency(totalExpense)}
            </Text>
          </Card>
        </View>

        {/* Net */}
        <Card style={{ marginBottom: 16, alignItems: 'center', paddingVertical: 14 }}>
          <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '500', marginBottom: 4 }}>Net</Text>
          <Text
            style={{
              color: net >= 0 ? COLORS.income : COLORS.expense,
              fontSize: 26,
              fontWeight: '800',
            }}
          >
            {net >= 0 ? '+' : ''}{formatCurrency(net)}
          </Text>
        </Card>

        {/* Spending by category */}
        <Card>
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 14 }}>
            Spending by Category
          </Text>

          {spending.length === 0 ? (
            <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingVertical: 16 }}>
              No expenses recorded for this period.
            </Text>
          ) : (
            spending.map((item) => {
              const pct = totalExpense > 0 ? item.total / totalExpense : 0;
              const color = item.category_color ?? COLORS.accent;
              return (
                <View key={String(item.category_id ?? 'uncategorized')} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: hexToRgba(color, 0.15),
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{item.category_icon ?? '💰'}</Text>
                    </View>
                    <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600', flex: 1 }}>
                      {item.category_name ?? 'Uncategorized'}
                    </Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: COLORS.expense, fontSize: 14, fontWeight: '700' }}>
                        {formatCurrency(item.total)}
                      </Text>
                      <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                        {Math.round(pct * 100)}%
                      </Text>
                    </View>
                  </View>
                  <ProgressBar progress={pct} color={color} />
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
