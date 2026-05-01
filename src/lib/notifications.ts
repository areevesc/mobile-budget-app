import * as Notifications from 'expo-notifications';
import type { ScheduledItem } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function rescheduleAllNotifications(items: ScheduledItem[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (const item of items) {
    if (!item.is_active || item.type === 'savings') continue;

    // Notify at 9am the day before due date
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
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyDate },
    });
  }
}
