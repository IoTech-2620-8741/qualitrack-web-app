import { Component, computed, input } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [MatCard, DecimalPipe, TranslatePipe],
  selector: 'app-deviation-kpi-cards',
  styleUrl: './deviation-kpi-cards.css',
  templateUrl: './deviation-kpi-cards.html',
})
export class DeviationKpiCards {
  readonly trends = input.required<any[]>();

  protected readonly totalVariables = computed(() => this.trends().length);
  protected readonly totalEvaluated = computed(() =>
    this.trends().reduce((acc, t) => acc + (t.evaluatedReadings || 0), 0),
  );
  protected readonly totalReadings = computed(() =>
    this.trends().reduce((acc, t) => acc + (t.dataPoints?.length || 0), 0),
  );

  protected readonly averageTimeInRange = computed(() => {
    const valid = this.trends().filter((t) => t.timeInRangePercent !== null);
    if (!valid.length) return 0;
    return valid.reduce((acc, t) => acc + t.timeInRangePercent, 0) / valid.length;
  });

  protected readonly totalDeviations = computed(() =>
    this.trends().reduce((acc, t) => acc + (t.deviationCount || 0), 0),
  );
  protected readonly totalCritical = computed(() =>
    this.trends().reduce((acc, t) => acc + (t.criticalDeviationCount || 0), 0),
  );
}
