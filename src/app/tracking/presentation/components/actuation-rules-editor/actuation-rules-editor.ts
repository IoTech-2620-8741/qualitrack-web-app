import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ActuationRule } from '../../../domain/model/environmental-profile.entity';
import { ACTIVATIONS, ActuationAction } from '../../../domain/model/actuation-event.entity';
import { MonitoredMetric } from '../../../domain/model/monitored-metric';

interface RuleRow {
  metric: MonitoredMetric | '';
  state: 'WARNING' | 'CRITICAL';
  action: ActuationAction | '';
}

/**
 * Relates a WARNING or CRITICAL condition of a metric of the container with the ventilation, the simulated
 * refrigeration or the servo (US59). Only metrics with a saved threshold can be used.
 */
@Component({
  selector: 'app-actuation-rules-editor',
  standalone: true,
  imports: [FormsModule, TranslateModule, MatButtonModule, MatIconModule],
  templateUrl: './actuation-rules-editor.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', '../../views/tracking-views.css'],
})
export class ActuationRulesEditor {
  /** Metrics with a threshold in the saved profile. */
  readonly metrics = input.required<MonitoredMetric[]>();
  readonly rules = input<ActuationRule[]>([]);
  readonly readonly = input(false);
  readonly saving = input(false);
  readonly save = output<ActuationRule[]>();

  protected readonly actions = ACTIVATIONS;
  protected readonly states: ('WARNING' | 'CRITICAL')[] = ['WARNING', 'CRITICAL'];
  protected readonly rows = signal<RuleRow[]>([]);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.rows.set(this.rules().map((rule) => ({ ...rule })));
      this.error.set(null);
    });
  }

  protected add(): void {
    this.rows.update((rows) => [...rows, { metric: this.metrics()[0] ?? '', state: 'WARNING', action: '' }]);
  }

  protected remove(index: number): void {
    this.rows.update((rows) => rows.filter((_, position) => position !== index));
  }

  protected submit(): void {
    const rows = this.rows();
    if (rows.some((row) => !row.metric || !row.action)) {
      this.error.set('tracking.profiles.errors.incomplete-rule');
      return;
    }
    if (rows.some((row) => !this.metrics().includes(row.metric as MonitoredMetric))) {
      this.error.set('tracking.profiles.errors.rule-without-threshold');
      return;
    }
    const keys = rows.map((row) => `${row.metric}|${row.state}|${row.action}`);
    if (new Set(keys).size !== keys.length) {
      this.error.set('tracking.profiles.errors.repeated-rule');
      return;
    }
    this.error.set(null);
    this.save.emit(rows.map((row) => ({
      metric: row.metric as MonitoredMetric,
      state: row.state,
      action: row.action as ActuationAction,
    })));
  }
}
