import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addQuarters,
  isBefore,
  isAfter,
  parseISO,
  format,
  isEqual,
} from 'date-fns';
import type { ScheduledItem, Settings, TimelineEvent, RecurrenceInterval } from '../types';

// ─── Recurrence Helpers ───────────────────────────────────────────────────────

export function advanceByInterval(date: Date, interval: RecurrenceInterval): Date {
  switch (interval) {
    case 'weekly':    return addDays(date, 7);
    case 'biweekly':  return addDays(date, 14);
    case 'monthly':   return addMonths(date, 1);
    case 'quarterly': return addQuarters(date, 1);
    case 'annually':  return addYears(date, 1);
    case 'none':      return date;
    default:          return date;
  }
}

export function rewindByInterval(date: Date, interval: RecurrenceInterval): Date {
  switch (interval) {
    case 'weekly':    return addDays(date, -7);
    case 'biweekly':  return addDays(date, -14);
    case 'monthly':   return addMonths(date, -1);
    case 'quarterly': return addQuarters(date, -1);
    case 'annually':  return addYears(date, -1);
    case 'none':      return date;
    default:          return date;
  }
}

/**
 * Returns all dates on which the item occurs within [start, end] (inclusive).
 */
export function getOccurrencesInRange(
  item: ScheduledItem,
  start: Date,
  end: Date
): Date[] {
  const interval = item.recurrence_interval;
  const results: Date[] = [];

  if (interval === 'none') {
    const d = parseISO(item.due_date);
    if (!isBefore(d, start) && !isAfter(d, end)) {
      results.push(d);
    }
    return results;
  }

  // Walk base date backwards until before start
  let base = parseISO(item.due_date);
  while (!isBefore(base, start)) {
    base = rewindByInterval(base, interval);
  }

  // Walk forward collecting dates in range
  let current = advanceByInterval(base, interval);
  while (!isAfter(current, end)) {
    if (!isBefore(current, start)) {
      results.push(current);
    }
    current = advanceByInterval(current, interval);
  }

  return results;
}

// ─── Next Paycheck Date ───────────────────────────────────────────────────────

export function getNextPaycheckDate(settings: Settings): Date | null {
  if (!settings.last_paycheck_date) return null;

  const interval = settings.paycheck_interval as RecurrenceInterval;
  let date = parseISO(settings.last_paycheck_date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  while (!isAfter(date, now)) {
    date = advanceByInterval(date, interval);
  }
  return date;
}

export function getNextPaycheckAmount(scheduledItems: ScheduledItem[], nextPaycheckDate: Date | null): number {
  if (!nextPaycheckDate) return 0;
  const dateStr = format(nextPaycheckDate, 'yyyy-MM-dd');
  // Find paychecks that occur on or near next paycheck date
  for (const item of scheduledItems) {
    if (item.type === 'paycheck' && item.is_active === 1) {
      const occurrences = getOccurrencesInRange(
        item,
        addDays(nextPaycheckDate, -1),
        addDays(nextPaycheckDate, 1)
      );
      if (occurrences.length > 0) return item.amount;
    }
  }
  // Return the most recent paycheck amount
  const paychecks = scheduledItems.filter(i => i.type === 'paycheck' && i.is_active === 1);
  return paychecks.length > 0 ? paychecks[0].amount : 0;
}

// ─── Safe to Spend ────────────────────────────────────────────────────────────

export interface SafeToSpendResult {
  safeToSpend: number;
  totalBalance: number;
  billsBeforePaycheck: number;
  totalSinkingReserved: number;
  nextPaycheckDate: Date | null;
  nextPaycheckAmount: number;
  afterNextPaycheck: number;
}

export function calculateSafeToSpend(
  totalBalance: number,
  totalSinkingReserved: number,
  scheduledItems: ScheduledItem[],
  settings: Settings
): SafeToSpendResult {
  const nextPaycheckDate = getNextPaycheckDate(settings);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let billsBeforePaycheck = 0;

  if (nextPaycheckDate) {
    const bills = scheduledItems.filter(i => i.type === 'bill' && i.is_active === 1);
    for (const bill of bills) {
      const occurrences = getOccurrencesInRange(bill, now, nextPaycheckDate);
      billsBeforePaycheck += occurrences.length * bill.amount;
    }
  }

  const nextPaycheckAmount = getNextPaycheckAmount(scheduledItems, nextPaycheckDate);
  const safeToSpend = totalBalance - billsBeforePaycheck - totalSinkingReserved;
  const afterNextPaycheck = totalBalance - billsBeforePaycheck + nextPaycheckAmount;

  return {
    safeToSpend,
    totalBalance,
    billsBeforePaycheck,
    totalSinkingReserved,
    nextPaycheckDate,
    nextPaycheckAmount,
    afterNextPaycheck,
  };
}

// ─── Timeline Generation ──────────────────────────────────────────────────────

export function generateTimeline(
  scheduledItems: ScheduledItem[],
  totalBalance: number,
  settings: Settings,
  days: number
): TimelineEvent[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = addDays(now, days);
  const threshold = settings.warning_threshold;

  const events: Array<{ date: Date; item: ScheduledItem }> = [];

  for (const item of scheduledItems) {
    if (!item.is_active) continue;
    const occurrences = getOccurrencesInRange(item, now, end);
    for (const date of occurrences) {
      events.push({ date, item });
    }
  }

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  let runningBalance = totalBalance;
  const timeline: TimelineEvent[] = [];

  for (const event of events) {
    const { item, date } = event;
    if (item.type === 'bill') {
      runningBalance -= item.amount;
    } else {
      runningBalance += item.amount;
    }

    let status: 'danger' | 'warning' | 'normal' = 'normal';
    if (runningBalance < threshold) {
      status = 'danger';
    } else if (runningBalance < threshold * 1.2) {
      status = 'warning';
    }

    timeline.push({
      id: `${item.id}-${format(date, 'yyyy-MM-dd')}`,
      scheduledItemId: item.id,
      name: item.name,
      type: item.type,
      amount: item.amount,
      date: format(date, 'yyyy-MM-dd'),
      runningBalance,
      status,
    });
  }

  return timeline;
}

// ─── Mark Paid / Received ─────────────────────────────────────────────────────

export function getNextOccurrenceDate(item: ScheduledItem): string {
  if (item.recurrence_interval === 'none') {
    return item.due_date;
  }
  const base = parseISO(item.due_date);
  const next = advanceByInterval(base, item.recurrence_interval);
  return format(next, 'yyyy-MM-dd');
}
