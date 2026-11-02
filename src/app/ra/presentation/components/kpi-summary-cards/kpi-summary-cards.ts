import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatCard, MatCardContent, MatCardFooter, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { OverviewEnvironmentalProfile } from '../../../domain/model/overview-environmental-profile.entity';

/** Possible visual states for a KPI summary card based on threshold evaluation. */
export type SummaryState = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'UNCONFIGURED';

/**
 * Component that renders the individual KPI cards for environmental readings.
 *
 * @remarks
 * It evaluates the average of the readings against the configured thresholds
 * (either from the environment or the specific container monitor) to color-code
 * the cards and display their current state.
 */
@Component({
  selector: 'app-kpi-summary-cards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIcon, DecimalPipe, DatePipe, TranslatePipe,
    MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardFooter],
  styleUrl: './kpi-summary-cards.css',
  templateUrl: './kpi-summary-cards.html',
})
export class KpiSummaryCards {
  /** The raw measurement summaries returned by the API. */
  readonly summaries = input.required<any[]>();

  /** Environmental profiles (thresholds) mapped by device ID to evaluate the states. */
  readonly profiles = input<Record<number, OverviewEnvironmentalProfile | null>>({});

  /**
   * Determines the visual state of a KPI summary card.
   *
   * @remarks
   * The evaluation follows this priority:
   * 1. Explicit backend state (`worstState` or `state`), if present.
   * 2. Real thresholds from the specific device profile (environment or container).
   * 3. `UNCONFIGURED` if there are no thresholds (e.g., RFID_TAG, MOTION) or invalid data.
   *
   * @param summary - The measurement summary containing the average and device ID.
   * @returns The evaluated state (`NORMAL`, `WARNING`, `CRITICAL`, or `UNCONFIGURED`).
   */
  protected stateOf(summary: any): SummaryState {
    const explicit = summary.worstState ?? summary.state;
    if (explicit === 'CRITICAL' || explicit === 'WARNING' || explicit === 'NORMAL') return explicit;

    const profile = this.profiles()[summary.deviceId];
    const threshold = profile?.threshold(summary.metric);

    if (!threshold) return 'UNCONFIGURED';

    const avg = Number(summary.average);
    if (!Number.isFinite(avg)) return 'UNCONFIGURED';

    const { normalMin, normalMax, criticalMin, criticalMax } = threshold;
    if (criticalMin != null && avg < criticalMin) return 'CRITICAL';
    if (criticalMax != null && avg > criticalMax) return 'CRITICAL';
    if (normalMin != null && avg < normalMin) return 'WARNING';
    if (normalMax != null && avg > normalMax) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Resolves the Material icon name corresponding to a visual state.
   *
   * @param state - The evaluated state.
   * @returns The name of the Material icon to render.
   */
  protected statusIcon(state: SummaryState): string {
    switch (state) {
      case 'CRITICAL': return 'error';
      case 'WARNING': return 'warning';
      case 'NORMAL': return 'check_circle';
      default: return 'remove_circle_outline';
    }
  }

  /**
   * Resolves the translation key for the state label.
   *
   * @param state - The evaluated state.
   * @returns The translation key for the state text.
   */
  protected statusLabelKey(state: SummaryState): string {
    switch (state) {
      case 'CRITICAL': return 'reporting.summary.state-critical';
      case 'WARNING': return 'reporting.summary.state-warning';
      case 'NORMAL': return 'reporting.summary.state-normal';
      default: return 'reporting.summary.state-unconfigured';
    }
  }

  /**
   * Calculates the exact percentage position of the average value within the min/max range.
   *
   * @remarks
   * Used to position the dot on the horizontal range bar. It ensures the value
   * stays within 0% and 100%, preventing visual overflow.
   *
   * @param summary - The measurement summary containing min, max, and average.
   * @returns A number between 0 and 100 representing the percentage position.
   */
  protected dotPosition(summary: any): number {
    const min = Number(summary.minimum);
    const max = Number(summary.maximum);
    const avg = Number(summary.average);

    // If values are invalid or the range is zero, we place the dot in the center.
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 50;

    // Calculate percentage and clamp it between 0 and 100 to prevent CSS overflow.
    return Math.min(100, Math.max(0, ((avg - min) / (max - min)) * 100));
  }
}
