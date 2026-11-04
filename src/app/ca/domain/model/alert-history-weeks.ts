import { AlertSeverity, DeviationAlert } from './deviation-alert.entity';

/** Alerts that started in one week, for one bar of the weekly chart of the history. */
export interface AlertWeek {
  /** Monday that opens the week in Peru, as `YYYY-MM-DD`. */
  start: string;
  /** How many alerts of each severity started that week. */
  bySeverity: Record<AlertSeverity, number>;
}

/** Milliseconds in one day. */
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

/** Distance from UTC to the time of Peru, where the laboratories operate (it has no daylight saving time). */
const LABORATORY_OFFSET_IN_MILLISECONDS = -5 * 60 * 60 * 1000;

/**
 * Monday that opens the week of a moment, in Peru.
 *
 * @param moment - Milliseconds since 1970
 * @returns Midnight of that Monday, written as if Peru were at UTC so that the UTC methods of `Date` read it
 */
function weekStartOf(moment: number): number {
  const peru = new Date(moment + LABORATORY_OFFSET_IN_MILLISECONDS);
  const daysSinceMonday = (peru.getUTCDay() + 6) % 7;
  return Date.UTC(peru.getUTCFullYear(), peru.getUTCMonth(), peru.getUTCDate() - daysSinceMonday);
}

/**
 * Counts the alerts of each week between two moments, by severity.
 *
 * @param alerts - The alerts shown in the history
 * @param since - First moment of the period, or `null` to start at the oldest alert
 * @param until - Last moment of the period
 * @returns One week per bar, the oldest first, including the weeks without alerts
 *
 * @remarks
 * Weeks start on Monday in Peru. The weeks without alerts are kept so that the chart shows the gaps.
 */
export function countAlertsByWeek(
  alerts: readonly DeviationAlert[],
  since: number | null,
  until: number,
): AlertWeek[] {
  const first = since ?? Math.min(...alerts.map((alert) => Date.parse(alert.timestamp)));
  if (!Number.isFinite(first) || first > until) return [];

  const weeks = new Map<number, AlertWeek>();
  for (let week = weekStartOf(first); week <= weekStartOf(until); week += 7 * DAY_IN_MILLISECONDS) {
    const start = new Date(week).toISOString().slice(0, 10);
    weeks.set(week, { start, bySeverity: { LOW: 0, WARNING: 0, CRITICAL: 0 } });
  }
  for (const alert of alerts) {
    const week = weeks.get(weekStartOf(Date.parse(alert.timestamp)));
    if (week) week.bySeverity[alert.severity]++;
  }
  return [...weeks.values()];
}
