import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../lib/utils';

interface DatePickerFieldProps {
  label?: string;
  value: string; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  nullable?: boolean;
}

export function DatePickerField({ label, value, onChange, nullable = false }: DatePickerFieldProps) {
  const [show, setShow] = useState(false);

  const date = value ? parseISO(value) : new Date();
  const displayText = value ? format(parseISO(value), 'MMM d, yyyy') : 'Not set';

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      onChange(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  return (
    <View style={{ gap: 4 }}>
      {label ? (
        <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '500' }}>{label}</Text>
      ) : null}
      <TouchableOpacity
        onPress={() => setShow(true)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f0f11',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: COLORS.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <Text style={{ color: value ? COLORS.primary : COLORS.muted, fontSize: 16 }}>
          {displayText}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={COLORS.muted} />
      </TouchableOpacity>

      {show && Platform.OS === 'ios' ? (
        <Modal transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ backgroundColor: COLORS.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                {nullable ? (
                  <TouchableOpacity onPress={() => { onChange(''); setShow(false); }}>
                    <Text style={{ color: COLORS.expense, fontSize: 16 }}>Clear</Text>
                  </TouchableOpacity>
                ) : <View />}
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={{ color: COLORS.accent, fontSize: 16, fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={handleChange}
                textColor={COLORS.primary}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      {show && Platform.OS === 'android' ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}
