import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

import { MetricDefinition, MonitoredMetric } from '../../../domain/model/monitored-metric';
import { EnvironmentalThreshold, ThresholdInput } from '../../../domain/model/environmental-profile.entity';

interface ThresholdRow {
  definition: MetricDefinition;
  enabled: boolean;
  normalMin: number | null;
  normalMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
}

/**
 * Edits the WARNING/CRITICAL limits of the metrics of a device. A value inside the normal range is NORMAL, up to the
 * critical limits WARNING and beyond them CRITICAL; each side is complete or empty.
 */
@Component({
  selector: 'app-threshold-editor',
  standalone: true,
  imports: [FormsModule, TranslateModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  templateUrl: './threshold-editor.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', '../../views/tracking-views.css'],
})
export class ThresholdEditor {
  readonly metrics = input.required<MetricDefinition[]>();
  readonly thresholds = input<EnvironmentalThreshold[]>([]);
  readonly readonly = input(false);
  readonly saving = input(false);
  readonly save = output<ThresholdInput[]>();

  protected readonly rows = signal<ThresholdRow[]>([]);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const saved = this.thresholds();
      this.rows.set(this.metrics().map((definition) => {
        const threshold = saved.find((item) => item.metric === definition.metric);
        return {
          definition,
          enabled: !!threshold,
          normalMin: threshold?.normalMin ?? null,
          normalMax: threshold?.normalMax ?? null,
          criticalMin: threshold?.criticalMin ?? null,
          criticalMax: threshold?.criticalMax ?? null,
        };
      }));
      this.error.set(null);
    });
  }

  protected submit(): void {
    const thresholds: ThresholdInput[] = [];
    for (const row of this.rows().filter((item) => item.enabled)) {
      const problem = validate(row);
      if (problem) {
        this.error.set(problem);
        return;
      }
      thresholds.push({
        metric: row.definition.metric as MonitoredMetric,
        normalMin: number(row.normalMin),
        normalMax: number(row.normalMax),
        criticalMin: number(row.criticalMin),
        criticalMax: number(row.criticalMax),
      });
    }
    this.error.set(null);
    this.save.emit(thresholds);
  }
}

function number(value: number | null | string): number | null {
  return value === null || value === '' ? null : Number(value);
}

/** Same rules the platform applies; returns the translation key of the problem. */
function validate(row: ThresholdRow): string | null {
  const [normalMin, normalMax, criticalMin, criticalMax] =
    [row.normalMin, row.normalMax, row.criticalMin, row.criticalMax].map(number);
  if ((normalMin === null) !== (criticalMin === null) || (normalMax === null) !== (criticalMax === null)) {
    return 'tracking.profiles.errors.incomplete';
  }
  if (normalMin === null && normalMax === null) return 'tracking.profiles.errors.no-limits';
  if (normalMin !== null && criticalMin !== null && criticalMin >= normalMin) return 'tracking.profiles.errors.critical-min';
  if (normalMax !== null && criticalMax !== null && criticalMax <= normalMax) return 'tracking.profiles.errors.critical-max';
  if (normalMin !== null && normalMax !== null && normalMin >= normalMax) return 'tracking.profiles.errors.normal-range';
  return null;
}
