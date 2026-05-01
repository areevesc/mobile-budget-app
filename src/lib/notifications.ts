import Constants from 'expo-constants';
import type { ScheduledItem } from '../types';

// Expo Go (SDK 53+) removed notification support. appOwnership === 'expo' means Expo Go.
export const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

export function initNotificationHandler(): void {
  if (isExpoGo) return;
  try {
    // Lazy require avoids native module init crash in Expo Go on import
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (_) {}
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    const Notifications = require('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (_) {
    return false;
  }
}

export async function rescheduleAllNotifications(items: ScheduledItem[]): Promise<void> {
  if (isExpoGo) return;
  try {
    const Notifications = require('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();

    for (const item of items) {
      if (!item.is_active || item.type === 'savings') continue;

      const dueDate = new Date(`${item.due_date}T09:00:00`);
      const notifyDate = new Date(dueDate);
      notifyDate.setDate(notifyDate.getDate() - 1);

      if (notifyDate <= now) continue;

      const emoji = item.type === 'bill' ? '📅' : '💰';
      const verb = item.type === 'bill' ? 'due' : 'expected';
      const amountStr = `$${item.amount.toFixed(2).replace(/\.00$/, '')}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${emoji} ${item.name} ${verb} tomorrow`,
          body: amountStr,
          data: { scheduledItemId: item.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifyDate,
        },
      });
    }
  } catch (_) {}
}
