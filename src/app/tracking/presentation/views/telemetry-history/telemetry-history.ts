import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

import { TrackingStore, recentPeriod } from '../../../application/tracking.store';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';
import { MonitoredMetric, metricDefinition, metricsOf } from '../../../domain/model/monitored-metric';

/**
 * History of a device of the environment: readings and actions of a period in time order, with a chart of each
 * numeric metric against its thresholds (US68, US69).
 */
@Component({
  selector: 'app-telemetry-history',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, TranslateModule, MatButtonModule, MatButtonToggleModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    BaseChartDirective, EnvironmentSelector],
  templateUrl: './telemetry-history.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', '../tracking-views.css'],
})
export class TelemetryHistory implements OnInit {
  protected readonly store = inject(TrackingStore);
  protected readonly environments = inject(EnvironmentStore);
  private readonly translate = inject(TranslateService);
  private readonly language = toSignal(this.translate.onLangChange, { initialValue: null });

  protected deviceId: number | null = null;
  protected metric: MonitoredMetric | null = null;
  protected from = toLocalInput(new Date(recentPeriod().from));
  protected to = toLocalInput(new Date(recentPeriod().to));
  protected readonly chartMetric = signal<MonitoredMetric | null>(null);
  protected readonly periodError = signal(false);

  protected readonly selectedDevice = computed(() => this.store.history()?.device ?? null);

  protected readonly deviceMetrics = computed(() => {
    const device = this.store.devices().find((item) => item.id === this.deviceId);
    return device?.deviceType ? metricsOf(device.deviceType) : [];
  });

  /** Numeric metrics with readings in the history, the ones that can be drawn. */
  protected readonly chartMetrics = computed(() => {
    const metrics = new Set(this.store.history()?.measurements
      .filter((reading) => reading.value !== null && metricDefinition(reading.metric)?.configurable)
      .map((reading) => reading.metric));
    return [...metrics];
  });

  protected readonly activeChartMetric = computed(() => {
    const selected = this.chartMetric();
    return selected && this.chartMetrics().includes(selected) ? selected : this.chartMetrics()[0] ?? null;
  });

  protected readonly chartData = computed<ChartData<'line'>>(() => {
    this.language();
    const history = this.store.history();
    const metric = this.activeChartMetric();
    if (!history || !metric) return { datasets: [] };
    const points = history.measurements
      .filter((reading) => reading.metric === metric && reading.value !== null)
      .map((reading) => ({ x: Date.parse(reading.measuredAt), y: reading.value as number }));
    const datasets: ChartData<'line'>['datasets'] = [{
      label: this.translate.instant('tracking.metrics.' + metric),
      data: points, borderColor: '#158378', backgroundColor: '#15837818', pointRadius: 3, borderWidth: 2, tension: 0,
    }];
    const threshold = history.profile?.threshold(metric);
    if (threshold && points.length) {
      const first = points[0].x;
      const last = points[points.length - 1].x;
      const line = (value: number | null, label: string, color: string) => {
        if (value === null) return;
        datasets.push({ label: this.translate.instant(label), data: [{ x: first, y: value }, { x: last, y: value }],
          borderColor: color, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false });
      };
      line(threshold.normalMax, 'tracking.history.normal-max', '#c08a00');
      line(threshold.normalMin, 'tracking.history.normal-min', '#c08a00');
      line(threshold.criticalMax, 'tracking.history.critical-max', '#c62828');
      line(threshold.criticalMin, 'tracking.history.critical-min', '#c62828');
    }
    return { datasets };
  });

  protected readonly chartOptions = computed<ChartOptions<'line'>>(() => {
    this.language();
    const unit = metricDefinition(this.activeChartMetric() ?? '')?.unit ?? '';
    return {
      responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: {
          title: (items) => this.formatDate(items[0].parsed.x ?? 0),
          label: (item) => `${item.dataset.label}: ${item.parsed.y} ${unit}`,
        } },
      },
      scales: {
        x: { type: 'linear', grid: { display: false },
          ticks: { maxTicksLimit: 6, maxRotation: 0, callback: (value) => this.formatDate(Number(value)) } },
        y: { title: { display: true, text: unit } },
      },
    };
  });

  async ngOnInit(): Promise<void> {
    if (!this.environments.loaded()) await this.environments.loadEnvironments();
    const current = this.store.environmentId() ?? this.environments.preferredEnvironment(undefined, 'tracking')?.id ?? null;
    if (current !== null) await this.changeEnvironment(current);
  }

  protected async changeEnvironment(environmentId: number): Promise<void> {
    this.environments.rememberEnvironment(environmentId, 'tracking');
    if (this.store.environmentId() !== environmentId || !this.store.devices().length) {
      await this.store.selectEnvironment(environmentId);
    }
    this.deviceId = this.store.environmentalDevice()?.id ?? this.store.containerMonitors()[0]?.id ?? null;
    this.metric = null;
    await this.search();
  }

  protected changeDevice(): void {
    this.metric = null;
    void this.search();
  }

  protected async search(): Promise<void> {
    const device = this.store.devices().find((item) => item.id === this.deviceId);
    if (!device) return;
    const from = new Date(this.from);
    const to = new Date(this.to);
    const valid = !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to
      && to.getTime() - from.getTime() <= 31 * 24 * 3600_000;
    this.periodError.set(!valid);
    if (!valid) return;
    this.chartMetric.set(this.metric && metricDefinition(this.metric)?.configurable ? this.metric : null);
    await this.store.loadHistory(device, { from: from.toISOString(), to: to.toISOString() }, this.metric);
  }

  private formatDate(value: number): string {
    return new Intl.DateTimeFormat(this.translate.currentLang || 'en', { dateStyle: 'short', timeStyle: 'short' })
      .format(new Date(value));
  }
}

/** Value of a datetime-local input for a date, in the browser time zone. */
function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
