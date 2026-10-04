import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TrackingStore, DeviceSnapshot } from '../../../application/tracking.store';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';
import { MonitoredMetric } from '../../../domain/model/monitored-metric';
import { Measurement } from '../../../domain/model/measurement.entity';

/**
 * Current conditions of the environment: air quality and motion from its environmental device, and temperature,
 * humidity, luminosity, RFID tag and latest action of each container monitor (US60, US61, US63-US66).
 */
@Component({
  selector: 'app-environmental-monitoring',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, TranslateModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, EnvironmentSelector],
  templateUrl: './environmental-monitoring.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', '../tracking-views.css'],
})
export class EnvironmentalMonitoring implements OnInit {
  protected readonly store = inject(TrackingStore);
  protected readonly environments = inject(EnvironmentStore);

  protected readonly containerMetrics: MonitoredMetric[] = ['TEMPERATURE', 'HUMIDITY', 'LUMINOSITY'];

  async ngOnInit(): Promise<void> {
    if (!this.environments.loaded()) await this.environments.loadEnvironments();
    const current = this.store.environmentId() ?? this.environments.preferredEnvironment(undefined, 'tracking')?.id ?? null;
    if (current !== null) await this.changeEnvironment(current);
  }

  protected async changeEnvironment(environmentId: number): Promise<void> {
    this.environments.rememberEnvironment(environmentId, 'tracking');
    await this.store.selectEnvironment(environmentId);
    await this.store.loadSnapshots();
  }

  protected refresh(): void {
    void this.store.loadSnapshots();
  }

  protected snapshotOf(deviceId: number): DeviceSnapshot | undefined {
    return this.store.snapshots().find((snapshot) => snapshot.device.id === deviceId);
  }

  protected reading(snapshot: DeviceSnapshot | undefined, metric: MonitoredMetric): Measurement | undefined {
    return snapshot?.readings.get(metric);
  }
}
