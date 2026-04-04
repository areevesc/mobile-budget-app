import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Picker } from './ui/Picker';
import { DatePickerField } from './ui/DatePickerField';
import { COLORS, PAYCHECK_INTERVAL_LABELS } from '../lib/utils';
import { useCreateAccount, useSaveSettings, useCreateScheduledItem } from '../hooks/useQueries';
import { format } from 'date-fns';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const PAYCHECK_OPTIONS = Object.entries(PAYCHECK_INTERVAL_LABELS).map(([value, label]) => ({ value, label }));

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);

  // Step 1: Account
  const [accountName, setAccountName] = useState('Checking');
  const [accountBalance, setAccountBalance] = useState('');

  // Step 2: Paycheck
  const [paycheckInterval, setPaycheckInterval] = useState('biweekly');
  const [lastPaycheckDate, setLastPaycheckDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paycheckAmount, setPaycheckAmount] = useState('');
  const [paycheckName, setPaycheckName] = useState('Work Paycheck');

  // Step 3: Bill
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const createAccount = useCreateAccount();
  const saveSettings = useSaveSettings();
  const createScheduledItem = useCreateScheduledItem();

  const steps = [
    {
      icon: 'wallet-outline' as const,
      title: 'Add Your Account',
      subtitle: "Enter your current bank account balance. This is your starting point.",
    },
    {
      icon: 'cash-outline' as const,
      title: 'Set Up Paycheck',
      subtitle: "We'll use this to calculate what bills are due before you get paid.",
    },
    {
      icon: 'receipt-outline' as const,
      title: 'Add Your First Bill',
      subtitle: "Add a recurring bill so the app can protect that money for you.",
    },
  ];

  const handleNext = async () => {
    if (step === 0) {
      const bal = parseFloat(accountBalance) || 0;
      createAccount.mutate({ name: accountName || 'Checking', balance: bal });
      setStep(1);
    } else if (step === 1) {
      saveSettings.mutate({
        warning_threshold: 500,
        paycheck_interval: paycheckInterval as any,
        last_paycheck_date: lastPaycheckDate,
      });

      if (paycheckAmount && parseFloat(paycheckAmount) > 0) {
        createScheduledItem.mutate({
          name: paycheckName || 'Paycheck',
          amount: parseFloat(paycheckAmount),
          type: 'paycheck',
          due_date: lastPaycheckDate,
          recurrence_interval: paycheckInterval as any,
          category: null,
          is_active: 1,
        });
      }
      setStep(2);
    } else if (step === 2) {
      if (billName && billAmount && parseFloat(billAmount) > 0) {
        createScheduledItem.mutate({
          name: billName,
          amount: parseFloat(billAmount),
          type: 'bill',
          due_date: billDueDate,
          recurrence_interval: 'monthly',
          category: null,
          is_active: 1,
        });
      }
      onComplete();
    }
  };

  const currentStep = steps[step];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingTop: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 48 }}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === step ? COLORS.accent : COLORS.border,
              }}
            />
          ))}
        </View>

        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${COLORS.accent}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              borderWidth: 1,
              borderColor: `${COLORS.accent}40`,
            }}
          >
            <Ionicons name={currentStep.icon} size={36} color={COLORS.accent} />
          </View>
          <Text style={{ color: COLORS.primary, fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>
            {currentStep.title}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 16, textAlign: 'center', lineHeight: 24 }}>
            {currentStep.subtitle}
          </Text>
        </View>

        {/* Step Content */}
        <View style={{ gap: 16 }}>
          {step === 0 && (
            <>
              <Input
                label="Account Name"
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Checking"
              />
              <Input
                label="Current Balance"
                prefix="$"
                value={accountBalance}
                onChangeText={setAccountBalance}
                keyboardType="decimal-pad"
                placeholder="0.00"
                autoFocus
              />
            </>
          )}

          {step === 1 && (
            <>
              <Input
                label="Paycheck Name"
                value={paycheckName}
                onChangeText={setPaycheckName}
                placeholder="Work Paycheck"
              />
              <Input
                label="Paycheck Amount"
                prefix="$"
                value={paycheckAmount}
                onChangeText={setPaycheckAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              <Picker
                label="How often are you paid?"
                options={PAYCHECK_OPTIONS}
                value={paycheckInterval}
                onChange={(v) => setPaycheckInterval(String(v))}
              />
              <DatePickerField
                label="When was your last paycheck?"
                value={lastPaycheckDate}
                onChange={setLastPaycheckDate}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Input
                label="Bill Name"
                value={billName}
                onChangeText={setBillName}
                placeholder="e.g. Rent, Car Payment..."
              />
              <Input
                label="Amount"
                prefix="$"
                value={billAmount}
                onChangeText={setBillAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
              <DatePickerField
                label="Next Due Date"
                value={billDueDate}
                onChange={setBillDueDate}
              />
            </>
          )}
        </View>

        <View style={{ marginTop: 40, gap: 12 }}>
          <Button
            title={step < 2 ? 'Continue' : "I'm all set!"}
            variant="primary"
            size="lg"
            onPress={handleNext}
            style={{ borderRadius: 12 }}
          />
          {step < 2 && (
            <Button
              title="Skip"
              variant="ghost"
              onPress={() => {
                if (step === 0) {
                  setStep(1);
                } else if (step === 1) {
                  setStep(2);
                } else {
                  onComplete();
                }
              }}
            />
          )}
          {step === 2 && (
            <Button
              title="Skip for now"
              variant="ghost"
              onPress={onComplete}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
