import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  effect
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RaStore } from '../../../application/ra.store';
import { ALL_ENVIRONMENTS, lastDays } from '../../../domain/model/indicator-period';
import { KpiSummaryCards } from '../../components/kpi-summary-cards/kpi-summary-cards';
import { KpiTable } from '../../components/kpi-table/kpi-table';
import { KpiRecords } from '../../components/kpi-records/kpi-records';

/** Lengths of the period offered, in days; the platform accepts up to 31. */
const PERIOD_DAYS = [1, 7, 31] as const;

/**
 * Indicators of the laboratory: average, minimum and maximum of the environmental readings of a period per device and
 * variable (US93), and the current counts of its records. Every value comes from persisted records; without readings
 * nothing is calculated.
 *
 * @remarks
 * This component acts as an orchestrator for the KPI dashboard. It manages the global filters
 * (period and environment), calculates the grouped summaries, and handles the logic
 * to load the necessary environmental profiles to color-code the cards correctly.
 */
@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    KpiSummaryCards,
    KpiTable,
    KpiRecords
  ],
  templateUrl: './kpi-dashboard.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './kpi-dashboard.css',
})
export class KpiDashboardComponent implements OnInit {
  /** The application store managing the Reporting and Analysis state. */
  protected readonly store = inject(RaStore);

  /** Available period options in days. */
  protected readonly periods = PERIOD_DAYS;

  /** Constant representing the "All environments" selection. */
  protected readonly ALL_ENVIRONMENTS = ALL_ENVIRONMENTS;

  /** Selected period in days. */
  protected readonly days = signal<number>(7);

  /** Selected environment, or null for all. */
  protected readonly environmentId = signal<number | null>(null);

  /** Current view mode: 'cards' or 'table'. */
  protected readonly viewMode = signal<'cards' | 'table'>('cards');

  /**
   * Readings summarized per environment, ordered as the laboratory environments.
   * Groups are filtered to only show environments that actually have summaries.
   */
  protected readonly groups = computed(() => {
    const summaries = this.store.dashboard()?.measurementSummaries ?? [];
    return this.store
      .environments()
      .map((environment) => ({
        environment,
        summaries: summaries.filter((item) => item.environmentId === environment.id),
      }))
      .filter((group) => group.summaries.length);
  });

  /**
   * Creates an instance of KpiDashboardComponent.
   *
   * @remarks
   * The constructor sets up an `effect` that automatically loads the environmental profiles
   * (thresholds) for every device present in the dashboard summaries. This is required
   * to calculate the visual state (normal, warning, critical) of the KPI cards.
   */
  constructor() {
    effect(() => {
      const summaries = this.store.dashboard()?.measurementSummaries ?? [];
      for (const s of summaries) {
        if (s.deviceId != null && s.environmentId != null) {
          this.store.loadProfile(s.deviceId, s.environmentId);
        }
      }
    });
  }

  /**
   * Lifecycle hook that initializes the dashboard.
   * Loads devices, ensures environments are loaded, and triggers the first data fetch.
   */
  async ngOnInit(): Promise<void> {
    this.store.loadDevices();
    if (!this.store.environmentsLoaded()) await this.store.loadEnvironments();
    this.reload();
  }

  /**
   * Changes the selected period and reloads the dashboard data.
   *
   * @param days - The number of days for the new period.
   */
  protected changePeriod(days: number): void {
    this.days.set(days);
    this.reload();
  }

  /**
   * Changes the selected environment and reloads the dashboard data.
   *
   * @param environmentId - The environment identifier, or ALL_ENVIRONMENTS.
   */
  protected changeEnvironment(environmentId: number): void {
    this.environmentId.set(environmentId === ALL_ENVIRONMENTS ? null : environmentId);
    this.reload();
  }

  /**
   * Switches the visualization mode between cards and table.
   *
   * @param mode - The new view mode.
   */
  protected changeView(mode: 'cards' | 'table'): void {
    this.viewMode.set(mode);
  }

  /**
   * Fetches the dashboard data from the store using the selected filters.
   */
  protected reload(): void {
    this.store.loadDashboard(lastDays(this.days()), this.environmentId());
  }
}
