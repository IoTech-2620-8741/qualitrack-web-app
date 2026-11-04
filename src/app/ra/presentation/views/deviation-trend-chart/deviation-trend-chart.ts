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
import { ActivatedRoute, Router } from '@angular/router';
import { RaStore } from '../../../application/ra.store';
import { lastDays } from '../../../domain/model/indicator-period';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';

import { DeviationTable } from '../../components/deviation-table/deviation-table';
import { DeviationKpiCards } from '../../components/deviation-kpi-cards/deviation-kpi-cards';
import { ChartThresholds, DeviationChart } from '../../components/deviation-chart/deviation-chart';
import { DeviationChartFactory } from '../../components/deviation-chart/deviation-chart.factory';

const PERIOD_DAYS = [1, 7, 31] as const;

/**
 * Smart component for the main Deviation Trend Chart view.
 *
 * @remarks
 * This component orchestrates the KPI cards, the data table, and the chart visualization.
 * It also synchronizes the UI state (selected environment, period, and active trend)
 * with the URL query parameters, allowing the view to be shareable and reloadable.
 */
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
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './deviation-trend-chart.css',
})
export class DeviationTrendChartComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(RaStore);
  private readonly translate = inject(TranslateService);

  /** Signal used to trigger recalculations when the language changes. */
  private readonly language = toSignal(this.translate.onLangChange, { initialValue: null });

  /** Available period options (in days). */
  protected readonly periods = PERIOD_DAYS;

  /** Currently selected period in days. */
  protected readonly days = signal<number>(7);

  /** Currently selected environment ID. */
  protected readonly environmentId = signal<number | null>(null);

  /** Internal key to track the currently selected trend from the table. */
  private readonly selectedKey = signal<string | null>(null);

  /**
   * The trend to display in the chart and table.
   * Falls back to the first trend if none is explicitly selected.
   */
  protected readonly activeTrend = computed(() => {
    const trends = this.store.deviationTrends();
    return trends.find((trend) => this.key(trend) === this.selectedKey()) ?? trends[0] ?? null;
  });

  /**
   * Extracts the thresholds (limits) for the active trend.
   * Uses the environment profile if available, otherwise applies fallback defaults.
   */
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

  /** Computes the Chart.js data object using the factory. */
  protected readonly chartData = computed(() =>
    DeviationChartFactory.createChartData(this.activeTrend())
  );

  /** Computes the Chart.js options object using the factory. Re-runs on language change. */
  protected readonly chartOptions = computed(() => {
    this.language();
    return DeviationChartFactory.createChartOptions(
      this.activeTrend(),
      this.activeThresholds(),
      this.translate
    );
  });

  constructor() {
    // Effect to fetch environmental profiles whenever the trends or environment change.
    // This is required to render the correct threshold colors in the chart.
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

  /**
   * Initializes the component and restores state from URL query parameters.
   *
   * @remarks
   * If no environment is provided in the URL, it attempts to use the preferred
   * environment stored in the browser.
   */
  async ngOnInit() {
    this.store.loadDevices();
    if (!this.store.environmentsLoaded()) await this.store.loadEnvironments();

    this.route.queryParams.subscribe(params => {
      const daysParam = params['days'] ? Number(params['days']) : 7;
      const envParam = params['env'] ? Number(params['env']) : null;
      const keyParam = params['selected'] || null;

      this.days.set(daysParam);
      if (keyParam) this.selectedKey.set(keyParam);

      if (envParam) {
        this.environmentId.set(envParam);
        this.reload();
      } else {
        const preferred = this.store.preferredEnvironmentId();
        if (preferred !== null) this.changeEnvironment(preferred);
      }
    });
  }

  /** Handles environment changes, reloads data, and updates the URL. */
  protected changeEnvironment(environmentId: number) {
    this.store.rememberEnvironment(environmentId);
    this.environmentId.set(environmentId);
    this.reload();
    this.updateUrl();
  }

  /** Handles period changes, reloads data, and updates the URL. */
  protected changePeriod(days: number) {
    this.days.set(days);
    this.reload();
    this.updateUrl();
  }

  /** Reloads the trends from the backend based on the current environment and period. */
  protected reload() {
    if (this.environmentId() === null) return;
    this.store.loadDeviationTrends(this.environmentId()!, lastDays(this.days()));
  }

  /** Selects a trend from the table to be displayed, and updates the URL. */
  protected select(trend: any) {
    this.selectedKey.set(this.key(trend));
    this.updateUrl();
  }

  /** Checks if a given trend is the currently active one. */
  protected isActive(trend: any) {
    return this.activeTrend() ? this.key(this.activeTrend()) === this.key(trend) : false;
  }

  /** Resolves a device ID to its human-readable label. */
  protected deviceLabel(id: number) {
    return this.store.deviceName(id) ?? `#${id}`;
  }

  /** Returns the Material Icon name for a given trend direction. */
  protected trendIcon(dir: string) {
    return dir === 'INCREASING'
      ? 'trending_up'
      : dir === 'DECREASING'
        ? 'trending_down'
        : 'trending_flat';
  }

  /**
   * Navigates to the detailed events view.
   *
   * @remarks
   * Passes the current `days` and `env` as query parameters to ensure
   * the detail view can reload the data correctly.
   */
  protected openDetail(trend: any) {
    this.router.navigate([
      '/reports/deviation-trends',
      trend.equipmentId,
      encodeURIComponent(trend.parameterName),
    ], {
      queryParams: { days: this.days(), env: this.environmentId() }
    });
  }

  /** Synchronizes the current component state with the URL query parameters. */
  private updateUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        days: this.days(),
        env: this.environmentId(),
        selected: this.selectedKey()
      },
      queryParamsHandling: 'merge',
      replaceUrl: true // Prevents polluting the browser history with every click
    });
  }

  /** Generates a unique key for a trend to identify it in the UI. */
  private key(trend: any) {
    return `${trend.equipmentId}|${trend.parameterName}|${trend.unit ?? ''}`;
  }
}
