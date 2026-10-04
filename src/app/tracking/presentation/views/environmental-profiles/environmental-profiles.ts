import { Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TrackingStore } from '../../../application/tracking.store';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';
import { ThresholdEditor } from '../../components/threshold-editor/threshold-editor';
import { ActuationRulesEditor } from '../../components/actuation-rules-editor/actuation-rules-editor';
import { configurableMetricsOf, MonitoredMetric } from '../../../domain/model/monitored-metric';
import {
  ActuationRule,
  EnvironmentalProfile,
  EnvironmentalThreshold,
  ThresholdInput,
} from '../../../domain/model/environmental-profile.entity';

// Stable empty values: a new array on every change detection would reset the editors while the user types.
const NO_THRESHOLDS: EnvironmentalThreshold[] = [];
const NO_RULES: ActuationRule[] = [];
const NO_METRICS: MonitoredMetric[] = [];

/**
 * Environmental profiles of an environment and of its container monitors: air quality thresholds of the environment,
 * temperature, humidity and luminosity thresholds of each container and its actuation rules (US56-US59). Quality
 * managers edit them; the other roles consult them.
 */
@Component({
  selector: 'app-environmental-profiles',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslateModule, MatIconModule, MatProgressSpinnerModule, EnvironmentSelector,
    ThresholdEditor, ActuationRulesEditor],
  templateUrl: './environmental-profiles.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', '../tracking-views.css'],
})
export class EnvironmentalProfiles implements OnInit {
  protected readonly store = inject(TrackingStore);
  protected readonly environments = inject(EnvironmentStore);

  protected readonly environmentMetrics = configurableMetricsOf('ENVIRONMENTAL_DEVICE');
  protected readonly containerMetrics = configurableMetricsOf('CONTAINER_MONITOR');

  private readonly configuredMetricsByDevice = computed(() => {
    const metrics = new Map<number, MonitoredMetric[]>();
    this.store.containerProfiles().forEach((profile, deviceId) =>
      metrics.set(deviceId, profile.thresholds.map((threshold) => threshold.metric)));
    return metrics;
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
    this.store.clearMessages();
    await this.store.loadProfiles();
  }

  protected containerProfile(deviceId: number): EnvironmentalProfile | null {
    return this.store.containerProfiles().get(deviceId) ?? null;
  }

  /** Metrics of the saved profile, the only ones an actuation rule can use. */
  protected configuredMetrics(deviceId: number): MonitoredMetric[] {
    return this.configuredMetricsByDevice().get(deviceId) ?? NO_METRICS;
  }

  protected thresholdsOf(profile: EnvironmentalProfile | null): EnvironmentalThreshold[] {
    return profile?.thresholds ?? NO_THRESHOLDS;
  }

  protected rulesOf(profile: EnvironmentalProfile | null): ActuationRule[] {
    return profile?.actuationRules ?? NO_RULES;
  }

  protected saveEnvironment(thresholds: ThresholdInput[]): void {
    void this.store.saveThresholds(null, thresholds);
  }

  protected saveContainer(deviceId: number, thresholds: ThresholdInput[]): void {
    void this.store.saveThresholds(deviceId, thresholds);
  }

  protected saveRules(deviceId: number, rules: ActuationRule[]): void {
    void this.store.saveActuationRules(deviceId, rules);
  }
}
