import React, { useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../lib/utils';
import { TransactionModal } from './modals/TransactionModal';
import { useCreateTransaction } from '../hooks/useQueries';

const TAB_BAR_HEIGHT = 60;

export function FAB() {
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const createTransaction = useCreateTransaction();

  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom + 16;

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
        style={[
          styles.fab,
          { bottom: bottomOffset },
        ]}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(data) => {
          createTransaction.mutate(data);
          setModalVisible(false);
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
});
