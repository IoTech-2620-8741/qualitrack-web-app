import { Component, computed, input } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Presentational component that displays high-level KPI metrics for deviation trends.
 *
 * @remarks
 * This component receives a list of deviation trends and computes aggregate metrics
 * (totals, averages) reactively using Angular signals. It does not fetch data itself,
 * making it a "dumb" (or pure) component.
 */
@Component({
  imports: [MatCard, DecimalPipe, TranslatePipe],
  selector: 'app-deviation-kpi-cards',
  styleUrl: './deviation-kpi-cards.css',
  templateUrl: './deviation-kpi-cards.html',
})
export class DeviationKpiCards {
  /** The list of deviation trends to aggregate metrics from. */
  readonly trends = input.required<any[]>();

  /** Total number of unique variables (trends) being monitored. */
  protected readonly totalVariables = computed(() => this.trends().length);

  /** Total number of evaluated readings across all trends. */
  protected readonly totalEvaluated = computed(() =>
    this.trends().reduce((acc, t) => acc + (t.evaluatedReadings || 0), 0),
  );

  /** Total number of raw data points (readings) across all trends. */
  protected readonly totalReadings = computed(() =>
    this.trends().reduce((acc, t) => acc + (t.dataPoints?.length || 0), 0),
  );

  /**
   * Average percentage of time that variables stayed within their normal range.
   *
   * @remarks
   * Ignores trends where `timeInRangePercent` is null.
   * Returns 0 if no valid trends are available.
   */
  protected readonly averageTimeInRange = computed(() => {
    const valid = this.trends().filter((t) => t.timeInRangePercent !== null);
    if (!valid.length) return 0;
    return valid.reduce((acc, t) => acc + t.timeInRangePercent, 0) / valid.length;
  });

  /** Total number of deviations (warnings + criticals) across all trends. */
  protected readonly totalDeviations = computed(() =>
    this.trends().reduce((acc, t) => acc + (t.deviationCount || 0), 0),
  );

  /** Total number of critical deviations across all trends. */
  protected readonly totalCritical = computed(() =>
    this.trends().reduce((acc, t) => acc + (t.criticalDeviationCount || 0), 0),
  );
}
