import { DeviationAlert } from '../domain/model/deviation-alert.entity';

/** Where the reading and the limit of an alert fall on its bar, in percent of the bar. */
export interface AlertGauge {
  value: number;
  limit: number;
}

/**
 * Places the reading of an alert and its limit on one scale, so a bar shows at a glance how far the
 * reading went past the limit.
 *
 * @remarks
 * The scale leaves some room after the larger of the two, so neither touches the end of the bar.
 *
 * @param alert - The alert
 * @returns The reading and the limit, in percent of the bar
 */
export function alertGauge(alert: DeviationAlert): AlertGauge {
  const value = Math.abs(alert.recordedValue);
  const limit = Math.abs(alert.thresholdValue);
  const scale = Math.max(value, limit) * 1.15 || 1;
  const percent = (amount: number) => Math.min(100, Math.round((amount / scale) * 1000) / 10);
  return { value: percent(value), limit: percent(limit) };
}
