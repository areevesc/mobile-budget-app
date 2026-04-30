import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../lib/utils';
import { TransactionModal } from './modals/TransactionModal';
import { QuickAddModal } from './modals/QuickAddModal';
import { useCreateTransaction, useContributeSinkingFund } from '../hooks/useQueries';

const TAB_BAR_HEIGHT = 60;

export function FAB() {
  const [expanded, setExpanded] = useState(false);
  const [manualVisible, setManualVisible] = useState(false);
  const [quickVisible, setQuickVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const createTransaction = useCreateTransaction();
  const contribute = useContributeSinkingFund();

  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom + 16;

  const openManual = () => {
    setExpanded(false);
    setManualVisible(true);
  };

  const openQuick = () => {
    setExpanded(false);
    setQuickVisible(true);
  };

  return (
    <>
      {/* Backdrop to close expanded menu */}
      {expanded && (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => setExpanded(false)}
          pointerEvents="auto"
        />
      )}

      {/* Expanded options */}
      {expanded && (
        <View style={[styles.optionContainer, { bottom: bottomOffset + 64 }]}>
          <TouchableOpacity style={styles.option} onPress={openManual} activeOpacity={0.85}>
            <View style={[styles.optionIcon, { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1 }]}>
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.optionLabel}>Manual</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={openQuick} activeOpacity={0.85}>
            <View style={[styles.optionIcon, { backgroundColor: COLORS.accent }]}>
              <Text style={{ fontSize: 18 }}>✨</Text>
            </View>
            <Text style={styles.optionLabel}>Quick Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.85}
        style={[styles.fab, { bottom: bottomOffset }]}
      >
        <Ionicons
          name={expanded ? 'close' : 'add'}
          size={28}
          color="#ffffff"
        />
      </TouchableOpacity>

      <TransactionModal
        visible={manualVisible}
        onClose={() => setManualVisible(false)}
        onSave={(data) => {
          createTransaction.mutate(data);
          setManualVisible(false);
        }}
      />

      <QuickAddModal
        visible={quickVisible}
        onClose={() => setQuickVisible(false)}
        onSaveTransaction={(data) => {
          createTransaction.mutate(data);
        }}
        onContributeFund={(fundId, amount, accountId) => {
          contribute.mutate({ id: fundId, amount, accountId });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 100,
  },
  optionContainer: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
    gap: 12,
    zIndex: 99,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionLabel: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
