import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { filter, fromEvent, merge, timer } from 'rxjs';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule} from '@angular/material/tooltip';
import { TrackingStore, DeviceSnapshot } from '../../../application/tracking.store';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { MonitoredMetric } from '../../../domain/model/monitored-metric';
import { Measurement } from '../../../domain/model/measurement.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { SetupNotice } from '../../../../shared/presentation/components/setup-notice/setup-notice';
import { IamStore } from '../../../../iam/application/iam.store';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { TRACKING_TABS } from '../../tracking-tabs';

/**
 * How often the view reads the devices again while it is open: a container monitor sends its
 * climate every 30 seconds and every action at once.
 */
const REFRESH_INTERVAL_MS = 30_000;

/** The containers whose lock needs a look, for the summary above them. */
export interface ContainerLockSummary {
  /** Names of the containers with the lock open. */
  open: string[];
  /** Names of the containers whose lock is unknown, because they are not reporting. */
  unknown: string[];
  /** Number of containers with a lock read. */
  total: number;
}

/**
 * Component responsible for displaying the current environmental monitoring status.
 *
 * This view provides a real-time overview of IoT devices within a selected environment,
 * including:
 * - Air quality, luminosity and motion information from environmental devices.
 * - Temperature, humidity, luminosity and RFID information from container monitors.
 * - The lock of each container, open or closed, and which ones are open.
 * - Latest device actions and connectivity information.
 *
 * While it is open and visible, it reads the devices again every 30 seconds without the loading
 * state, and when the tab comes back, as the alerts view does.
 *
 * The component coordinates environment selection and delegates
 * telemetry state management to the TrackingStore.
 *
 * It provides the main user interface for monitoring current environmental
 * conditions according to the configured IoT devices.
 */
@Component({
  selector: 'app-environmental-monitoring',
  standalone: true,
  imports: [
    PageHeader,
    ListToolbar,
    SetupNotice,
    DateTimePipe,
    DecimalPipe,
    NgTemplateOutlet,
    RouterLink,
    TranslatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EnvironmentSelector,
    MatTooltipModule
  ],
  templateUrl: './environmental-monitoring.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './environmental-monitoring.css',
})
export class EnvironmentalMonitoring implements OnInit {
  /** Operations of the tracking module. */
  protected readonly tabs = TRACKING_TABS;

  /**
   * Central application store responsible for IoT telemetry state,
   * device snapshots and environmental monitoring information.
   */
  protected readonly store = inject(TrackingStore);
  protected readonly iam = inject(IamStore);
  private readonly document = inject(DOCUMENT);
  /** Whether a periodic refresh is still waiting for its answers. */
  private refreshing = false;

  /**
   * Metrics with a value displayed for the environmental device of the environment.
   *
   * Motion is shown apart, with its last detection.
   */
  protected readonly environmentMetrics: MonitoredMetric[] = ['AIR_QUALITY', 'LUMINOSITY'];

  /**
   * Metrics displayed for container monitoring devices.
   *
   * These metrics represent the main environmental conditions
   * required for container status visualization.
   */
  protected readonly containerMetrics: MonitoredMetric[] = [
    'TEMPERATURE',
    'HUMIDITY',
    'LUMINOSITY',
  ];

  /** The open containers and the ones whose lock is unknown, in the order of the containers. */
  protected readonly lockSummary = computed<ContainerLockSummary>(() => {
    const locked = this.store.snapshots().filter((snapshot) => snapshot.lock !== null);
    const named = (status: string) =>
      locked
        .filter((snapshot) => snapshot.lock?.status === status)
        .map((snapshot) => snapshot.device.name);
    return { open: named('OPEN'), unknown: named('UNKNOWN'), total: locked.length };
  });

  constructor() {
    // An opened container shows up without the user refreshing the page
    merge(
      timer(REFRESH_INTERVAL_MS, REFRESH_INTERVAL_MS),
      fromEvent(this.document, 'visibilitychange'),
    )
      .pipe(
        filter(() => !this.document.hidden),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.refreshQuietly());
  }

  /**
   * Initializes the monitoring view.
   *
   * Loads available environments when necessary and restores
   * the preferred environment selected by the user.
   *
   * After selecting an environment, the component retrieves
   * the latest device snapshots for monitoring purposes.
   */
  async ngOnInit(): Promise<void> {
    await this.store.loadEnvironments();
    const current =
      this.store.environmentId() ??
      this.store.preferredEnvironmentId() ??
      null;
    if (current !== null) await this.changeEnvironment(current);
  }

  /**
   * Changes the active environment displayed by the monitoring view.
   *
   * Execution flow:
   * 1. Stores the selected environment preference.
   * 2. Updates the TrackingStore environment context.
   * 3. Loads the latest IoT device snapshots.
   *
   * @param environmentId Identifier of the selected environment.
   */
  protected async changeEnvironment(environmentId: number): Promise<void> {
    this.store.rememberEnvironment(environmentId);
    await this.store.selectEnvironment(environmentId);
    await this.store.loadSnapshots();
  }

  /**
   * Refreshes the current monitoring information.
   *
   * Requests updated device snapshots to display
   * the latest available IoT telemetry data.
   */
  protected refresh(): void {
    void this.store.loadSnapshots();
  }

  /**
   * Reads the devices again without the loading state, unless a load is under way or the previous
   * refresh has not answered yet.
   */
  private async refreshQuietly(): Promise<void> {
    if (this.refreshing || this.store.isLoading()) return;
    this.refreshing = true;
    try {
      await this.store.loadSnapshots(true);
    } finally {
      this.refreshing = false;
    }
  }

  /**
   * Retrieves the current snapshot associated with a device.
   *
   * Device snapshots contain the latest readings, actions
   * and connectivity information used by the monitoring view.
   *
   * @param deviceId Identifier of the IoT device.
   * @returns Device snapshot when available.
   */
  protected snapshotOf(deviceId: number): DeviceSnapshot | undefined {
    return this.store.snapshots().find((snapshot) => snapshot.device.id === deviceId);
  }

  /**
   * Retrieves the latest measurement of a specific metric
   * from a device snapshot.
   *
   * @param snapshot Current device snapshot.
   * @param metric Environmental metric to retrieve.
   * @returns Latest measurement when available.
   */
  protected reading(
    snapshot: DeviceSnapshot | undefined,
    metric: MonitoredMetric,
  ): Measurement | undefined {
    return snapshot?.readings.get(metric);
  }
}
