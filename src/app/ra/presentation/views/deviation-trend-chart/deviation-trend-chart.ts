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
import { Router } from '@angular/router';

import { RaStore } from '../../../application/ra.store';
import { lastDays } from '../../../domain/model/indicator-period';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';

import { DeviationTable } from '../../components/deviation-table/deviation-table';
import { DeviationKpiCards } from '../../components/deviation-kpi-cards/deviation-kpi-cards';
import { ChartThresholds, DeviationChart } from '../../components/deviation-chart/deviation-chart';
import { DeviationChartFactory } from '../../components/deviation-chart/deviation-chart.factory'; // 👈 Importas la factoría

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

    return {
      normalMin: deviceThreshold?.normalMin ?? 0,
      warningMax: deviceThreshold?.normalMax ?? 10,
      criticalMax: deviceThreshold?.criticalMax ?? 20,
      unit: trend.unit ?? '°C',
    };
  });

  protected readonly chartData = computed(() =>
    DeviationChartFactory.createChartData(this.activeTrend())
  );

  protected readonly chartOptions = computed(() => {
    this.language(); // Dependencia para reaccionar al cambio de idioma
    return DeviationChartFactory.createChartOptions(
      this.activeTrend(),
      this.activeThresholds(),
      this.translate
    );
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

  protected openDetail(trend: any) {
    this.router.navigate([
      '/reports/deviation-trends',
      trend.equipmentId,
      encodeURIComponent(trend.parameterName),
    ]);
  }

  private key(trend: any) {
    return `${trend.equipmentId}|${trend.parameterName}|${trend.unit ?? ''}`;
  }
}
