import React from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { Button } from './Button';
import { COLORS } from '../../lib/utils';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}
        onPress={onCancel}
      >
        <Pressable
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
            padding: 20,
            gap: 12,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: '700' }}>{title}</Text>
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20 }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Button
              title={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              style={{ flex: 1 }}
            />
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
