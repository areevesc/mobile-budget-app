import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { TimelineRow } from '../components/TimelineRow';
import {
  useSafeToSpend,
  useAccounts,
  useSinkingFunds,
  useRecentTransactions,
  useScheduledItems,
  useSettings,
  QUERY_KEYS,
} from '../hooks/useQueries';
import { generateTimeline } from '../lib/calculations';
import {
  formatCurrency,
  formatDate,
  formatDateDisplay,
  COLORS,
  hexToRgba,
} from '../lib/utils';

export function DashboardScreen() {
  const qc = useQueryClient();
  const { data: safeToSpend, isLoading } = useSafeToSpend();
  const { data: accounts = [] } = useAccounts();
  const { data: sinkingFunds = [] } = useSinkingFunds();
  const { data: recentTransactions = [] } = useRecentTransactions(10);
  const { data: scheduledItems = [] } = useScheduledItems();
  const { data: settings } = useSettings();

  useFocusEffect(
    React.useCallback(() => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.accounts });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.recentTransactions });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.scheduledItems });
    }, [])
  );

  const refreshing = false;
  const onRefresh = () => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.safeToSpend });
  };

  const threshold = settings?.warning_threshold ?? 500;

  // Generate 14-day timeline
  const timeline14 = React.useMemo(() => {
    if (!settings || !scheduledItems.length) return [];
    return generateTimeline(scheduledItems, safeToSpend?.totalBalance ?? 0, settings, 14);
  }, [scheduledItems, safeToSpend?.totalBalance, settings]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.muted} />}
    >
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: COLORS.primary, fontSize: 28, fontWeight: '800' }}>Dashboard</Text>
        <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 2 }}>
          Your financial overview
        </Text>
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        {/* Current Balance */}
        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '500', marginBottom: 4 }}>
                Current Balance
              </Text>
              <Text style={{ color: COLORS.primary, fontSize: 22, fontWeight: '800' }}>
                {formatCurrency(safeToSpend?.totalBalance ?? 0)}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                {accounts.length === 0 ? 'No accounts yet' : `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(99,102,241,0.15)', padding: 8, borderRadius: 8 }}>
              <Ionicons name="wallet-outline" size={18} color={COLORS.accent} />
            </View>
          </View>
        </Card>

        {/* Next Paycheck */}
        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '500', marginBottom: 4 }}>
                Next Paycheck
              </Text>
              <Text style={{ color: COLORS.income, fontSize: 22, fontWeight: '800' }}>
                {formatCurrency(safeToSpend?.nextPaycheckAmount ?? 0)}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                {safeToSpend?.nextPaycheckDate
                  ? formatDateDisplay(safeToSpend.nextPaycheckDate)
                  : 'Set up in Settings'}
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(52,211,153,0.15)', padding: 8, borderRadius: 8 }}>
              <Ionicons name="trending-up-outline" size={18} color={COLORS.income} />
            </View>
          </View>
        </Card>
      </View>

      {/* Next 14 Days Timeline */}
      <Card style={{ marginBottom: 16 }}>
        <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
          Next 14 Days
        </Text>
        {timeline14.length === 0 ? (
          <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingVertical: 16 }}>
            No scheduled items. Add bills and paychecks in Schedule.
          </Text>
        ) : (
          timeline14.map((event) => <TimelineRow key={event.id} event={event} />)
        )}
      </Card>

      {/* Sinking Funds */}
      <Card style={{ marginBottom: 16 }}>
        <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
          Sinking Funds
        </Text>
        {sinkingFunds.length === 0 ? (
          <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingVertical: 16 }}>
            No sinking funds yet. Create one in Sinking Funds.
          </Text>
        ) : (
          sinkingFunds.map((fund) => {
            const progress = fund.target_amount > 0 ? Math.min(1, fund.current_amount / fund.target_amount) : 0;
            return (
              <View key={fund.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }}>{fund.name}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                    {formatCurrency(fund.current_amount)} / {formatCurrency(fund.target_amount)}
                  </Text>
                </View>
                <ProgressBar progress={progress} color={fund.color} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>{Math.round(progress * 100)}% saved</Text>
                  {fund.contribution_per_paycheck > 0 ? (
                    <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                      {formatCurrency(fund.contribution_per_paycheck)}/paycheck
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </Card>

      {/* Recent Transactions */}
      <Card>
        <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
          Recent Transactions
        </Text>
        {recentTransactions.length === 0 ? (
          <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingVertical: 16 }}>
            No transactions yet. Tap + to add one.
          </Text>
        ) : (
          recentTransactions.map((tx) => (
            <View
              key={tx.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: hexToRgba(tx.category_color ?? '#6366f1', 0.13),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 16 }}>{tx.category_icon ?? '💰'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.primary, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                  {tx.description || tx.category_name || 'Transaction'}
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                  {tx.category_name ?? 'Uncategorized'} · {formatDate(tx.date)}
                </Text>
              </View>
              <Text
                style={{
                  color: tx.type === 'income' ? COLORS.income : COLORS.expense,
                  fontSize: 14,
                  fontWeight: '700',
                }}
              >
                {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
    </SafeAreaView>
  );
}
