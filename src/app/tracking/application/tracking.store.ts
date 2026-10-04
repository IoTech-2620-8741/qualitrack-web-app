import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TrackingApi } from '../infrastructure/tracking-api';
import { DeviceTarget, TelemetryPeriod } from '../infrastructure/tracking-api-endpoints';
import { Measurement, latestByMetric } from '../domain/model/measurement.entity';
import { ActuationEvent } from '../domain/model/actuation-event.entity';
import { DeviceConnection } from '../domain/model/device-connection.entity';
import { ActuationRule, EnvironmentalProfile, ThresholdInput } from '../domain/model/environmental-profile.entity';
import { MonitoredMetric } from '../domain/model/monitored-metric';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../equipment/domain/model/equipment.entity';
import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';

/**
 * Current condition of an IoT device: its latest reading per metric, latest motion detection, latest action and
 * connection.
 */
export interface DeviceSnapshot {
  device: Equipment;
  readings: Map<MonitoredMetric, Measurement>;
  /** Latest reading of MOTION with a detection (value 1) in the period. */
  lastMotion: Measurement | null;
  lastAction: ActuationEvent | null;
  connection: DeviceConnection | null;
  failed: boolean;
}

/** Readings and actions of a device in a period. */
export interface DeviceHistory {
  device: Equipment;
  period: TelemetryPeriod;
  measurements: Measurement[];
  actuationEvents: ActuationEvent[];
  profile: EnvironmentalProfile | null;
}

/** Period of the current conditions: a reading older than this is not current. */
const RECENT_PERIOD_HOURS = 24;

/**
 * Signal-based store of Tracking & Telemetry: the IoT devices of the selected environment, their current
 * conditions, their history and the environmental profiles of the environment and its container monitors.
 */
@Injectable({ providedIn: 'root' })
export class TrackingStore {
  private readonly api = inject(TrackingApi);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly iam = inject(IamStore);

  private readonly _environmentId = signal<number | null>(null);
  private readonly _devices = signal<Equipment[]>([]);
  private readonly _snapshots = signal<DeviceSnapshot[]>([]);
  private readonly _history = signal<DeviceHistory | null>(null);
  private readonly _environmentProfile = signal<EnvironmentalProfile | null>(null);
  private readonly _containerProfiles = signal<Map<number, EnvironmentalProfile>>(new Map());
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _notice = signal<string | null>(null);
  private generation = 0;

  readonly environmentId = this._environmentId.asReadonly();
  readonly devices = this._devices.asReadonly();
  readonly snapshots = this._snapshots.asReadonly();
  readonly history = this._history.asReadonly();
  readonly environmentProfile = this._environmentProfile.asReadonly();
  readonly containerProfiles = this._containerProfiles.asReadonly();
  readonly isLoading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly notice = this._notice.asReadonly();

  /** Profiles are configured by quality managers (US56-US59); the other roles consult them. */
  readonly canConfigure = this.iam.canManageQuality;

  readonly environmentalDevice = computed(() =>
    this._devices().find((device) => device.deviceType === 'ENVIRONMENTAL_DEVICE') ?? null);

  readonly containerMonitors = computed(() =>
    this._devices().filter((device) => device.deviceType === 'CONTAINER_MONITOR'));

  /**
   * Selects the environment and loads its IoT devices.
   */
  async selectEnvironment(environmentId: number): Promise<void> {
    const generation = ++this.generation;
    this._environmentId.set(environmentId);
    this._devices.set([]);
    this._snapshots.set([]);
    this._history.set(null);
    this._environmentProfile.set(null);
    this._containerProfiles.set(new Map());
    this.clearMessages();
    this._loading.set(true);
    try {
      const laboratoryId = this.iam.requireLaboratoryId();
      const equipment = await firstValueFrom(this.equipmentApi.getEquipment(laboratoryId));
      if (generation !== this.generation) return;
      this._devices.set(equipment.filter((item) => item.isIotDevice && item.labId === laboratoryId
        && item.environmentId === environmentId));
    } catch {
      if (generation === this.generation) this._error.set('tracking.errors.load');
    } finally {
      if (generation === this.generation) this._loading.set(false);
    }
  }

  /**
   * Loads the current condition of every device of the environment (US60, US61, US63-US66).
   */
  async loadSnapshots(): Promise<void> {
    const environmentId = this._environmentId();
    if (environmentId === null) return;
    const generation = this.generation;
    this._loading.set(true);
    const period = recentPeriod();
    const snapshots = await Promise.all(this._devices().map((device) => this.snapshot(device, environmentId, period)));
    if (generation !== this.generation) return;
    this._snapshots.set(snapshots);
    this._loading.set(false);
  }

  /**
   * Loads the readings and actions of a device in a period (US68, US69).
   */
  async loadHistory(device: Equipment, period: TelemetryPeriod, metric: MonitoredMetric | null): Promise<void> {
    const environmentId = this._environmentId();
    if (environmentId === null) return;
    const generation = this.generation;
    const target = this.target(device, environmentId);
    this.clearMessages();
    this._loading.set(true);
    try {
      const [measurements, actuationEvents, profile] = await Promise.all([
        firstValueFrom(this.api.getMeasurements(target, period, metric)),
        device.deviceType === 'CONTAINER_MONITOR' ? firstValueFrom(this.api.getActuationEvents(target, period)) : [],
        this.optionalProfile(target),
      ]);
      if (generation !== this.generation) return;
      this._history.set({ device, period, measurements, actuationEvents, profile });
    } catch (error) {
      if (generation === this.generation) {
        this._history.set(null);
        this._error.set(error instanceof ApiError && error.status === 400 ? 'tracking.errors.period' : 'tracking.errors.load');
      }
    } finally {
      if (generation === this.generation) this._loading.set(false);
    }
  }

  /**
   * Loads the profile of the environment and of each container monitor.
   */
  async loadProfiles(): Promise<void> {
    const environmentId = this._environmentId();
    if (environmentId === null) return;
    const generation = this.generation;
    this._loading.set(true);
    try {
      const laboratoryId = this.iam.requireLaboratoryId();
      const environmentProfile = this.environmentalDevice()
        ? await this.optionalProfile({ laboratoryId, environmentId, deviceId: null }) : null;
      const containerProfiles = new Map<number, EnvironmentalProfile>();
      for (const monitor of this.containerMonitors()) {
        const profile = await this.optionalProfile({ laboratoryId, environmentId, deviceId: monitor.id });
        if (profile) containerProfiles.set(monitor.id, profile);
      }
      if (generation !== this.generation) return;
      this._environmentProfile.set(environmentProfile);
      this._containerProfiles.set(containerProfiles);
    } catch {
      if (generation === this.generation) this._error.set('tracking.errors.load');
    } finally {
      if (generation === this.generation) this._loading.set(false);
    }
  }

  /**
   * Saves the thresholds of the environment (deviceId null) or of a container monitor (US56-US58).
   *
   * @returns whether the platform accepted them
   */
  async saveThresholds(deviceId: number | null, thresholds: ThresholdInput[]): Promise<boolean> {
    return this.saveProfile(deviceId, (target) => this.api.updateThresholds(target, thresholds), 'tracking.profiles.thresholds-saved');
  }

  /**
   * Saves the actuation rules of a container monitor (US59).
   */
  async saveActuationRules(deviceId: number, rules: ActuationRule[]): Promise<boolean> {
    return this.saveProfile(deviceId, (target) => this.api.updateActuationRules(target, rules), 'tracking.profiles.rules-saved');
  }

  clearMessages(): void {
    this._error.set(null);
    this._notice.set(null);
  }

  private async saveProfile(deviceId: number | null,
                            request: (target: DeviceTarget) => ReturnType<TrackingApi['updateThresholds']>,
                            notice: string): Promise<boolean> {
    const environmentId = this._environmentId();
    if (environmentId === null || this._saving()) return false;
    this.clearMessages();
    this._saving.set(true);
    try {
      const profile = await firstValueFrom(request({ laboratoryId: this.iam.requireLaboratoryId(), environmentId, deviceId }));
      if (deviceId === null) this._environmentProfile.set(profile);
      else this._containerProfiles.update((profiles) => new Map(profiles).set(deviceId, profile));
      this._notice.set(notice);
      return true;
    } catch (error) {
      this._error.set(error instanceof ApiError && error.status === 400 && error.details
        ? error.details : 'tracking.errors.save');
      return false;
    } finally {
      this._saving.set(false);
    }
  }

  private async snapshot(device: Equipment, environmentId: number, period: TelemetryPeriod): Promise<DeviceSnapshot> {
    const laboratoryId = this.iam.requireLaboratoryId();
    const target = this.target(device, environmentId);
    try {
      const [measurements, actuationEvents, connection] = await Promise.all([
        firstValueFrom(this.api.getMeasurements(target, period)),
        device.deviceType === 'CONTAINER_MONITOR' ? firstValueFrom(this.api.getActuationEvents(target, period)) : [],
        firstValueFrom(this.api.getDeviceConnection(laboratoryId, environmentId, device.id)),
      ]);
      const detections = measurements.filter((reading) => reading.metric === 'MOTION' && reading.value === 1);
      return {
        device,
        readings: latestByMetric(measurements),
        lastMotion: detections.at(-1) ?? null,
        lastAction: actuationEvents.at(-1) ?? null,
        connection,
        failed: false,
      };
    } catch {
      return { device, readings: new Map(), lastMotion: null, lastAction: null, connection: null, failed: true };
    }
  }

  /** Profile of a target, or null when it has not been configured yet. */
  private optionalProfile(target: DeviceTarget): Promise<EnvironmentalProfile | null> {
    return firstValueFrom(this.api.getProfile(target));
  }

  private target(device: Equipment, environmentId: number): DeviceTarget {
    return {
      laboratoryId: this.iam.requireLaboratoryId(),
      environmentId,
      deviceId: device.deviceType === 'CONTAINER_MONITOR' ? device.id : null,
    };
  }
}

/** The last 24 hours. */
export function recentPeriod(): TelemetryPeriod {
  const to = new Date();
  const from = new Date(to.getTime() - RECENT_PERIOD_HOURS * 3600_000);
  return { from: from.toISOString(), to: to.toISOString() };
}
