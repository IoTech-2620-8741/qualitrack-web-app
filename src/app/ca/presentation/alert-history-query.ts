import { ParamMap, Params } from '@angular/router';

import {
  AlertHistoryFilter,
  AlertHistoryPeriod,
  DEFAULT_ALERT_HISTORY_FILTER,
} from '../domain/model/alert-history-filter';
import { AlertOrigin, AlertSeverity, AlertStatus } from '../domain/model/deviation-alert.entity';

/** Values each chip of the history can take, in the order they are shown. */
export const ALERT_HISTORY_PERIODS: readonly AlertHistoryPeriod[] = [7, 30, 90, null];
export const ALERT_HISTORY_SEVERITIES: readonly AlertSeverity[] = ['CRITICAL', 'WARNING', 'LOW'];
export const ALERT_HISTORY_STATUSES: readonly AlertStatus[] = [
  'UNRESOLVED',
  'ACKNOWLEDGED',
  'RESOLVED',
];
export const ALERT_HISTORY_ORIGINS: readonly AlertOrigin[] = ['ENVIRONMENT', 'CONTAINER'];

/** A day written as `YYYY-MM-DD`. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads the filter of the history from the query parameters of the address.
 *
 * @param query - The query parameters
 * @returns The filter; what is missing or not valid takes the value of {@link DEFAULT_ALERT_HISTORY_FILTER}
 *
 * @remarks
 * Keeping the filter in the address lets the person go back from the detail of an alert, reload the page or share it
 * without losing what they chose.
 */
export function filterFromQuery(query: ParamMap): AlertHistoryFilter {
  const period = query.get('period');
  return {
    period:
      period === 'custom'
        ? null
        : (ALERT_HISTORY_PERIODS.find((days) => String(days) === period) ??
          DEFAULT_ALERT_HISTORY_FILTER.period),
    from: dayFrom(query.get('from')),
    to: dayFrom(query.get('to')),
    severities: listFrom(query.get('severity'), ALERT_HISTORY_SEVERITIES),
    statuses: listFrom(query.get('status'), ALERT_HISTORY_STATUSES),
    origins: listFrom(query.get('origin'), ALERT_HISTORY_ORIGINS),
    search: query.get('q') ?? '',
  };
}

/**
 * Writes the filter of the history as query parameters.
 *
 * @param filter - The filter
 * @returns The parameters; the ones with their default value are `null`, so they leave the address
 */
export function queryFromFilter(filter: AlertHistoryFilter): Params {
  const custom = filter.period === null;
  return {
    period: custom
      ? 'custom'
      : filter.period === DEFAULT_ALERT_HISTORY_FILTER.period
        ? null
        : filter.period,
    from: custom ? filter.from : null,
    to: custom ? filter.to : null,
    severity: filter.severities.join(',') || null,
    status: filter.statuses.join(',') || null,
    origin: filter.origins.join(',') || null,
    q: filter.search || null,
  };
}

/**
 * Reads a day of the address.
 *
 * @param value - The parameter
 * @returns The day, or `null` when it is missing or is not written as `YYYY-MM-DD`
 */
function dayFrom(value: string | null): string | null {
  return value !== null && DAY.test(value) ? value : null;
}

/**
 * Reads a list of the address, written with commas.
 *
 * @param value - The parameter
 * @param allowed - The values that exist
 * @returns The known values, in the order of `allowed`; the unknown ones are dropped
 */
function listFrom<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  const written = (value ?? '').split(',');
  return allowed.filter((item) => written.includes(item));
}
