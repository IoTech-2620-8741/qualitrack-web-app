import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RaStore } from '../../../application/ra.store';
import { lastDays } from '../../../domain/model/indicator-period';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';

import { DeviationTable } from '../../components/deviation-table/deviation-table';
import { DeviationKpiCards } from '../../components/deviation-kpi-cards/deviation-kpi-cards';
import { ChartThresholds, DeviationChart } from '../../components/deviation-chart/deviation-chart';
import { ChartData, ChartOptions } from 'chart.js';
import { Router } from '@angular/router';

const PERIOD_DAYS = [1, 7, 31] as const;

@Component({
  selector: 'app-deviation-trend-chart',
  standalone: true,
  imports: [
    TranslatePipe,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EnvironmentSelector,
    DeviationKpiCards,
    DeviationTable,
    DeviationChart
  ],
  templateUrl: './deviation-trend-chart.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './deviation-trend-chart.css',
})
export class DeviationTrendChartComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly store = inject(RaStore);
  private readonly translate = inject(TranslateService);
  private readonly language = toSignal(this.translate.onLangChange, { initialValue: null });

  protected readonly periods = PERIOD_DAYS;
  protected readonly days = signal<number>(7);
  protected readonly environmentId = signal<number | null>(null);
  private readonly selectedKey = signal<string | null>(null);

  protected readonly activeTrend = computed(() => {
    const trends = this.store.deviationTrends();
    return trends.find((trend) => this.key(trend) === this.selectedKey()) ?? trends[0] ?? null;
  });

  protected readonly activeThresholds = computed<ChartThresholds>(() => {
    const trend = this.activeTrend();
    if (!trend) return { normalMin: 0, warningMax: 0, criticalMax: 0, unit: '' };

    const deviceId = trend.equipmentId;
    const profile = this.store.profiles()[deviceId];
    const deviceThreshold = profile?.threshold(trend.parameterName);

    // Si el dispositivo tiene umbrales configurados, los usamos. Si no, usamos un fallback genérico.
    return {
      normalMin: deviceThreshold?.normalMin ?? 0,
      warningMax: deviceThreshold?.normalMax ?? 10,
      criticalMax: deviceThreshold?.criticalMax ?? 20,
      unit: trend.unit ?? '°C',
    };
  });

  protected readonly chartData = computed<ChartData<'line'>>(() => {
    this.language();
    const trend = this.activeTrend();
    if (!trend) return { datasets: [] };

    const points = trend.dataPoints.map((p: any) => ({
      x: Date.parse(p.timestamp),
      y: p.recordedValue,
      state: p.state,
    }));

    return {
      datasets: [
        {
          label: trend.parameterName,
          data: points,
          borderColor: '#0f766e',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: (ctx) => {
            const point = trend.dataPoints[ctx.dataIndex];
            return point?.state === 'CRITICAL' || point?.state === 'WARNING' ? 6 : 0;
          },
          pointBackgroundColor: (ctx) => {
            const point = trend.dataPoints[ctx.dataIndex];
            return point?.state === 'CRITICAL' ? '#ef4444' : '#f59e0b';
          },
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          fill: false,
        },
      ],
    };
  });

  protected openDetail(trend: any) {
    this.router.navigate([
      '/reports/deviation-trends',
      trend.equipmentId,
      encodeURIComponent(trend.parameterName),
    ]);
  }
  protected readonly chartOptions = computed<ChartOptions<'line'>>(() => {
    this.language();
    const trend = this.activeTrend();

    const { normalMin, warningMax, criticalMax, unit } = this.activeThresholds();

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'normal' },
          titleColor: '#cbd5e1',
          bodyFont: { size: 20, weight: 'bold' },
          bodyColor: '#ffffff',
          padding: 12,
          displayColors: false,
          cornerRadius: 8,
          callbacks: {
            title: (items) => this.formatDate(items[0].parsed.x ?? 0),
            label: (item) => {
              const point = trend?.dataPoints[item.dataIndex];
              const stateLabel =
                point?.state === 'CRITICAL'
                  ? 'Crítica · Límite 10 °C'
                  : point?.state === 'WARNING'
                    ? 'Advertencia · Límite 8 °C'
                    : '';
              return `${item.parsed.y} ${unit}${stateLabel ? `\n${stateLabel}` : ''}`;
            },
            labelTextColor: (context) => {
              return context.dataIndex === 1 ? '#cbd5e1' : '#ffffff';
            },
          },
        },
        annotation: {
          annotations: {
            criticalZone: {
              type: 'box',
              yMin: criticalMax,
              yMax: criticalMax + 5,
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderWidth: 0,
            },
            warningZone: {
              type: 'box',
              yMin: warningMax,
              yMax: criticalMax,
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              borderWidth: 0,
            },
            normalZone: {
              type: 'box',
              yMin: normalMin,
              yMax: warningMax,
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderWidth: 0,
            },
            critLine: {
              type: 'line',
              yMin: criticalMax,
              yMax: criticalMax,
              borderColor: '#ef4444',
              borderWidth: 1.5,
              borderDash: [5, 5],
              label: {
                display: true,
                content: `Crítico ≥ ${criticalMax} ${unit}`,
                position: 'start',
                backgroundColor: 'transparent',
                color: '#ef4444',
                font: { size: 11, weight: 'bold' },
                yAdjust: -10,
                xAdjust: 10,
              },
            },
            warnLine: {
              type: 'line',
              yMin: warningMax,
              yMax: warningMax,
              borderColor: '#f59e0b',
              borderWidth: 1.5,
              borderDash: [5, 5],
              label: {
                display: true,
                content: `Advertencia ${warningMax} – ${criticalMax} ${unit}`,
                position: 'start',
                backgroundColor: 'transparent',
                color: '#b45309',
                font: { size: 11, weight: 'bold' },
                yAdjust: -10,
                xAdjust: 10,
              },
            },
            normLine: {
              type: 'line',
              yMin: normalMin,
              yMax: normalMin,
              borderColor: '#10b981',
              borderWidth: 1.5,
              borderDash: [5, 5],
              label: {
                display: true,
                content: `Normal ${normalMin} – ${warningMax} ${unit}`,
                position: 'start',
                backgroundColor: 'transparent',
                color: '#047857',
                font: { size: 11, weight: 'bold' },
                yAdjust: -10,
                xAdjust: 10,
              },
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          grid: { display: false },
          border: { display: true, color: '#e2e8f0' },
          ticks: {
            maxTicksLimit: 6,
            maxRotation: 0,
            callback: (value) => this.formatDateTick(Number(value)),
            font: { size: 12 },
            color: '#64748b',
            padding: 10,
          },
        },
        y: {
          min: 0,
          title: {
            display: true,
            text: unit,
            color: '#64748b',
            font: { size: 12 },
            padding: { bottom: 10 },
          },
          grid: { display: false },
          border: { display: true, color: '#e2e8f0' },
          ticks: { color: '#64748b', font: { size: 12 }, stepSize: 2, padding: 10 },
        },
      },
    };
  });

  constructor() {
    effect(() => {
      const trends = this.store.deviationTrends();
      const envId = this.environmentId();
      if (envId !== null) {
        for (const t of trends) {
          if (t.equipmentId) this.store.loadProfile(t.equipmentId, envId);
        }
      }
    });
  }

  async ngOnInit() {
    this.store.loadDevices();
    if (!this.store.environmentsLoaded()) await this.store.loadEnvironments();
    const preferred = this.store.preferredEnvironmentId();
    if (preferred !== null) this.changeEnvironment(preferred);
  }

  protected changeEnvironment(environmentId: number) {
    this.store.rememberEnvironment(environmentId);
    this.environmentId.set(environmentId);
    this.reload();
  }

  protected changePeriod(days: number) {
    this.days.set(days);
    this.reload();
  }

  protected reload() {
    if (this.environmentId() === null) return;
    this.store.loadDeviationTrends(this.environmentId()!, lastDays(this.days()));
  }

  protected select(trend: any) {
    this.selectedKey.set(this.key(trend));
  }
  protected isActive(trend: any) {
    return this.activeTrend() ? this.key(this.activeTrend()) === this.key(trend) : false;
  }
  protected deviceLabel(id: number) {
    return this.store.deviceName(id) ?? `#${id}`;
  }

  protected trendIcon(dir: string) {
    return dir === 'INCREASING'
      ? 'trending_up'
      : dir === 'DECREASING'
        ? 'trending_down'
        : 'trending_flat';
  }

  private key(trend: any) {
    return `${trend.equipmentId}|${trend.parameterName}|${trend.unit ?? ''}`;
  }
  private formatDate(value: number) {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(value),
    );
  }
  private formatDateTick(value: number): string {
    const locale = this.translate.currentLang()?.startsWith('es') ? 'es-PE' : 'en-US';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(
      new Date(value),
    );
  }
}
