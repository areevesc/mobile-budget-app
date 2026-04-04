import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SinkingFundModal } from '../components/modals/SinkingFundModal';
import { ContributionModal } from '../components/modals/ContributionModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  useSinkingFunds,
  useCreateSinkingFund,
  useUpdateSinkingFund,
  useDeleteSinkingFund,
  useContributeSinkingFund,
} from '../hooks/useQueries';
import { formatCurrency, formatDateShort, COLORS } from '../lib/utils';
import type { SinkingFund } from '../types';

export function SinkingFundsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFund, setEditingFund] = useState<SinkingFund | null>(null);
  const [contributionFund, setContributionFund] = useState<SinkingFund | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SinkingFund | null>(null);

  const { data: funds = [] } = useSinkingFunds();
  const createFund = useCreateSinkingFund();
  const updateFund = useUpdateSinkingFund();
  const deleteFund = useDeleteSinkingFund();
  const contribute = useContributeSinkingFund();

  const totalReserved = funds.reduce((s, f) => s + f.current_amount, 0);
  const totalTarget = funds.reduce((s, f) => s + f.target_amount, 0);
  const overallProgress = totalTarget > 0 ? totalReserved / totalTarget : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
            paddingTop: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: COLORS.primary, fontSize: 24, fontWeight: '800' }}>Sinking Funds</Text>
            <Text style={{ color: COLORS.muted, fontSize: 13 }}>Virtual sub-balances for future expenses</Text>
          </View>
          <Button
            title="New Fund"
            variant="primary"
            size="sm"
            onPress={() => { setEditingFund(null); setModalVisible(true); }}
          />
        </View>

        {funds.length === 0 ? (
          /* Empty State */
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🐷</Text>
            <Text style={{ color: COLORS.primary, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
              No sinking funds yet
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
              Sinking funds help you save for irregular expenses like car repairs, vacations, or annual subscriptions.
            </Text>
            <Button
              title="Create First Fund"
              variant="primary"
              size="lg"
              onPress={() => { setEditingFund(null); setModalVisible(true); }}
              style={{ borderRadius: 12, paddingHorizontal: 32 }}
            />
          </View>
        ) : (
          <>
            {/* Summary row */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <Card style={{ flex: 1, padding: 12 }}>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>Reserved</Text>
                <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700' }}>
                  {formatCurrency(totalReserved)}
                </Text>
              </Card>
              <Card style={{ flex: 1, padding: 12 }}>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>Target</Text>
                <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700' }}>
                  {formatCurrency(totalTarget)}
                </Text>
              </Card>
              <Card style={{ flex: 1, padding: 12 }}>
                <Text style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>Progress</Text>
                <Text style={{ color: COLORS.accent, fontSize: 16, fontWeight: '700' }}>
                  {Math.round(overallProgress * 100)}%
                </Text>
              </Card>
            </View>

            {/* Fund Cards */}
            {funds.map((fund) => {
              const progress = fund.target_amount > 0 ? Math.min(1, fund.current_amount / fund.target_amount) : 0;
              const remaining = Math.max(0, fund.target_amount - fund.current_amount);
              const paychecksLeft =
                fund.contribution_per_paycheck > 0
                  ? Math.ceil(remaining / fund.contribution_per_paycheck)
                  : null;

              return (
                <Card key={fund.id} style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                  {/* Top color stripe */}
                  <View style={{ height: 4, backgroundColor: fund.color }} />

                  <View style={{ padding: 16 }}>
                    {/* Name + actions */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: COLORS.primary, fontSize: 17, fontWeight: '700' }}>{fund.name}</Text>
                        {fund.target_date ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
                            <Ionicons name="calendar-outline" size={12} color={COLORS.muted} />
                            <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                              Target: {formatDateShort(fund.target_date)}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity
                          onPress={() => { setEditingFund(fund); setModalVisible(true); }}
                          style={{ padding: 6 }}
                        >
                          <Ionicons name="pencil-outline" size={16} color={COLORS.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setDeleteTarget(fund)}
                          style={{ padding: 6 }}
                        >
                          <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Amounts */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                      <Text style={{ color: fund.color, fontSize: 26, fontWeight: '800' }}>
                        {formatCurrency(fund.current_amount)}
                      </Text>
                      <Text style={{ color: COLORS.muted, fontSize: 14 }}>
                        of {formatCurrency(fund.target_amount)}
                      </Text>
                    </View>

                    {/* Progress bar */}
                    <ProgressBar progress={progress} color={fund.color} height={8} />

                    {/* Labels */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 }}>
                      <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                        {Math.round(progress * 100)}% saved
                      </Text>
                      <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                        {formatCurrency(remaining)} remaining
                      </Text>
                    </View>

                    {fund.contribution_per_paycheck > 0 ? (
                      <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 14 }}>
                        {formatCurrency(fund.contribution_per_paycheck)}/paycheck
                        {paychecksLeft !== null ? ` · ~${paychecksLeft} paychecks left` : ''}
                      </Text>
                    ) : null}

                    {/* Contribute button */}
                    <Button
                      title="Add Contribution"
                      variant="outline"
                      onPress={() => setContributionFund(fund)}
                    />
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>

      <SinkingFundModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingFund(null); }}
        onSave={(fund) => {
          if (editingFund) {
            updateFund.mutate({ id: editingFund.id, fund });
          } else {
            createFund.mutate(fund);
          }
          setModalVisible(false);
          setEditingFund(null);
        }}
        editing={editingFund}
      />

      <ContributionModal
        visible={contributionFund !== null}
        onClose={() => setContributionFund(null)}
        onContribute={(amount, accountId) => {
          if (contributionFund) {
            contribute.mutate({ id: contributionFund.id, amount, accountId });
          }
          setContributionFund(null);
        }}
        fund={contributionFund}
      />

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete Sinking Fund"
        message="The saved amount will be released back to your available balance."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteFund.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}
