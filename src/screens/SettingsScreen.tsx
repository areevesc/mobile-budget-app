import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Picker } from '../components/ui/Picker';
import { DatePickerField } from '../components/ui/DatePickerField';
import { AccountModal } from '../components/modals/AccountModal';
import { CategoryModal } from '../components/modals/CategoryModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  useSettings,
  useSaveSettings,
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useWipeAllData,
} from '../hooks/useQueries';
import { exportAllData } from '../lib/db';
import { formatDate, COLORS, PAYCHECK_INTERVAL_LABELS, hexToRgba } from '../lib/utils';
import type { Account, Category } from '../types';
import { useAppReset } from '../../App';

const PAYCHECK_OPTIONS = Object.entries(PAYCHECK_INTERVAL_LABELS).map(([value, label]) => ({ value, label }));

export function SettingsScreen() {
  const { data: settings } = useSettings();
  const saveSettings = useSaveSettings();

  const [threshold, setThreshold] = useState('500');
  const [paycheckInterval, setPaycheckInterval] = useState('biweekly');
  const [lastPaycheckDate, setLastPaycheckDate] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (settings) {
      setThreshold(String(settings.warning_threshold));
      setPaycheckInterval(settings.paycheck_interval);
      setLastPaycheckDate(settings.last_paycheck_date ?? '');
    }
  }, [settings]);

  const handleSaveSettings = () => {
    saveSettings.mutate({
      warning_threshold: parseFloat(threshold) || 500,
      paycheck_interval: paycheckInterval as any,
      last_paycheck_date: lastPaycheckDate || null,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  // Accounts
  const { data: accounts = [] } = useAccounts();
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<Account | null>(null);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  // Categories
  const { data: categories = [] } = useCategories();
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Danger zone
  const [wipeConfirmVisible, setWipeConfirmVisible] = useState(false);
  const wipeAllData = useWipeAllData();
  const resetApp = useAppReset();

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const handleExport = async () => {
    try {
      const data = exportAllData();
      const json = JSON.stringify(data, null, 2);
      const fileUri = FileSystem.documentDirectory + 'budget_export.json';
      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Budget Data',
      });
    } catch (err) {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ marginBottom: 20, paddingTop: 8 }}>
          <Text style={{ color: COLORS.primary, fontSize: 24, fontWeight: '800' }}>Settings</Text>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>Configure your budget app</Text>
        </View>

        {/* General Settings */}
        <Card style={{ marginBottom: 16, gap: 16 }}>
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700' }}>General</Text>

          <Input
            label="Low Balance Warning ($)"
            prefix="$"
            value={threshold}
            onChangeText={setThreshold}
            keyboardType="decimal-pad"
            placeholder="500"
          />
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: -12 }}>
            Safe to Spend turns red below this amount
          </Text>

          <Picker
            label="Paycheck Frequency"
            options={PAYCHECK_OPTIONS}
            value={paycheckInterval}
            onChange={(v) => setPaycheckInterval(String(v))}
          />

          <DatePickerField
            label="Last Paycheck Date"
            value={lastPaycheckDate}
            onChange={setLastPaycheckDate}
            nullable
          />
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: -12 }}>
            Used to predict future paychecks
          </Text>

          <Button
            title={savedMessage ? 'Saved!' : 'Save Settings'}
            variant={savedMessage ? 'secondary' : 'primary'}
            onPress={handleSaveSettings}
          />
        </Card>

        {/* Accounts */}
        <Card style={{ marginBottom: 16, gap: 0 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700' }}>Accounts</Text>
            <Button
              title="Add Account"
              variant="outline"
              size="sm"
              onPress={() => { setEditingAccount(null); setAccountModalVisible(true); }}
            />
          </View>

          {accounts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20, gap: 8 }}>
              <Ionicons name="wallet-outline" size={32} color={COLORS.border} />
              <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center' }}>
                No accounts yet. Add your bank account to get started.
              </Text>
            </View>
          ) : (
            accounts.map((account, index) => (
              <View
                key={account.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: COLORS.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: COLORS.primary, fontSize: 15, fontWeight: '600' }}>{account.name}</Text>
                    {account.is_default === 1 && (
                      <View style={{ backgroundColor: `${COLORS.accent}33`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ color: COLORS.accent, fontSize: 10, fontWeight: '700' }}>DEFAULT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                    Updated {formatDate(account.last_updated)}
                  </Text>
                </View>
                <Text style={{ color: COLORS.primary, fontSize: 15, fontWeight: '700', marginRight: 12 }}>
                  ${account.current_balance.toFixed(2)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity
                    onPress={() => { setEditingAccount(account); setAccountModalVisible(true); }}
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="pencil-outline" size={16} color={COLORS.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setDeleteAccountTarget(account)}
                    style={{ padding: 6 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Categories */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700' }}>Categories</Text>
            <Button
              title="Add"
              variant="outline"
              size="sm"
              onPress={() => { setEditingCategory(null); setCategoryModalVisible(true); }}
            />
          </View>

          {/* Expense Categories */}
          <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
            EXPENSE
          </Text>
          {expenseCategories.map((cat, index) => (
            <View
              key={cat.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: COLORS.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: hexToRgba(cat.color, 0.2),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
              </View>
              <Text style={{ color: COLORS.primary, fontSize: 14, flex: 1 }}>{cat.name}</Text>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: cat.color,
                  marginRight: 12,
                }}
              />
              <TouchableOpacity
                onPress={() => { setEditingCategory(cat); setCategoryModalVisible(true); }}
                style={{ padding: 4 }}
              >
                <Ionicons name="pencil-outline" size={14} color={COLORS.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDeleteCategoryTarget(cat)}
                style={{ padding: 4 }}
              >
                <Ionicons name="trash-outline" size={14} color={COLORS.expense} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />

          {/* Income Categories */}
          <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
            INCOME
          </Text>
          {incomeCategories.map((cat, index) => (
            <View
              key={cat.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: COLORS.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: hexToRgba(cat.color, 0.2),
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
              </View>
              <Text style={{ color: COLORS.primary, fontSize: 14, flex: 1 }}>{cat.name}</Text>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: cat.color,
                  marginRight: 12,
                }}
              />
              <TouchableOpacity
                onPress={() => { setEditingCategory(cat); setCategoryModalVisible(true); }}
                style={{ padding: 4 }}
              >
                <Ionicons name="pencil-outline" size={14} color={COLORS.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDeleteCategoryTarget(cat)}
                style={{ padding: 4 }}
              >
                <Ionicons name="trash-outline" size={14} color={COLORS.expense} />
              </TouchableOpacity>
            </View>
          ))}
        </Card>

        {/* Data Export */}
        <Card style={{ gap: 12 }}>
          <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '700' }}>Data Export</Text>
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20 }}>
            Export all your data as JSON. All data is stored locally on your device.
          </Text>
          <Button title="Export All Data" variant="outline" onPress={handleExport} />
        </Card>

        {/* Danger Zone */}
        <Card style={{ gap: 12, marginTop: 16, borderColor: COLORS.expense, borderWidth: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="warning-outline" size={18} color={COLORS.expense} />
            <Text style={{ color: COLORS.expense, fontSize: 16, fontWeight: '700' }}>Danger Zone</Text>
          </View>
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20 }}>
            Erase all accounts, transactions, schedules, and sinking funds. Default categories will
            be restored. This cannot be undone.
          </Text>
          <Button title="Erase All Data" variant="danger" onPress={() => setWipeConfirmVisible(true)} />
        </Card>
      </ScrollView>

      <AccountModal
        visible={accountModalVisible}
        onClose={() => { setAccountModalVisible(false); setEditingAccount(null); }}
        onSave={(name, balance, isDefault) => {
          if (editingAccount) {
            updateAccount.mutate({ id: editingAccount.id, name, balance, isDefault });
          } else {
            createAccount.mutate({ name, balance, isDefault });
          }
          setAccountModalVisible(false);
          setEditingAccount(null);
        }}
        editing={editingAccount}
        totalAccounts={accounts.length}
      />

      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => { setCategoryModalVisible(false); setEditingCategory(null); }}
        onSave={(name, type, color, icon) => {
          if (editingCategory) {
            updateCategory.mutate({ id: editingCategory.id, name, type, color, icon });
          } else {
            createCategory.mutate({ name, type, color, icon });
          }
          setCategoryModalVisible(false);
          setEditingCategory(null);
        }}
        editing={editingCategory}
      />

      <ConfirmDialog
        visible={deleteAccountTarget !== null}
        title="Delete Account"
        message="This will remove the account. Transactions linked to it will remain."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteAccountTarget) deleteAccount.mutate(deleteAccountTarget.id);
          setDeleteAccountTarget(null);
        }}
        onCancel={() => setDeleteAccountTarget(null)}
      />

      <ConfirmDialog
        visible={deleteCategoryTarget !== null}
        title="Delete Category"
        message="Transactions with this category will become uncategorized."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteCategoryTarget) deleteCategory.mutate(deleteCategoryTarget.id);
          setDeleteCategoryTarget(null);
        }}
        onCancel={() => setDeleteCategoryTarget(null)}
      />

      <ConfirmDialog
        visible={wipeConfirmVisible}
        title="Erase All Data?"
        message="This will permanently delete every account, transaction, schedule, and sinking fund. Default categories will be restored and you'll start fresh at onboarding. This cannot be undone."
        confirmLabel="Erase Everything"
        destructive
        onConfirm={() => {
          wipeAllData.mutate(undefined, {
            onSuccess: () => {
              setWipeConfirmVisible(false);
              resetApp();
            },
          });
        }}
        onCancel={() => setWipeConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}
