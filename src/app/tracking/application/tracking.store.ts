import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription, finalize } from 'rxjs';
import { TrackingApi } from '../infrastructure/tracking-api';
import { Measurement } from '../domain/model/measurement.entity';
import { DeviceConnection } from '../domain/model/device-connection.entity';
import { IamStore } from '../../iam/application/iam.store';
import { TelemetryHistoryPoint } from '../domain/model/telemetry-history-point.entity';

@Injectable({ providedIn: 'root' })
export class TrackingStore {
  private readonly api = inject(TrackingApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _measurements = signal<Measurement[]>([]);
  private readonly iam = inject(IamStore);
  private readonly _deviceConnection = signal<DeviceConnection | null>(null);
  private readonly _telemetryHistory = signal<TelemetryHistoryPoint[]>([]);
  private readonly pending = signal(0);
  private readonly failures = signal<Record<string, string>>({});
  private readonly requests = new Map<string, Subscription>();
  private selectedEquipment: number | null = null;

  readonly measurements = this._measurements.asReadonly();
  /** Connection status of the selected IoT device; null until it is loaded or when the device has no environment. */
  readonly deviceConnection = this._deviceConnection.asReadonly();
  readonly telemetryHistory = this._telemetryHistory.asReadonly();
  readonly historyParameter = signal<string | null>(null);
  readonly historyParameters = computed(() => [...new Set(this._telemetryHistory().map(point => point.parameterName))]);
  readonly activeHistoryParameter = computed(() => {
    const selected = this.historyParameter();
    return selected && this.historyParameters().includes(selected) ? selected : this.historyParameters()[0] ?? null;
  });
  readonly selectedHistory = computed(() => this._telemetryHistory()
    .filter(point => point.parameterName === this.activeHistoryParameter())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  readonly isLoading = computed(() => this.pending() > 0);
  readonly error = computed(() => Object.values(this.failures())[0] ?? null);
  readonly successMsg = signal<string | null>(null).asReadonly();
  readonly anomaliesHistory = computed(() => this._telemetryHistory().filter(point => point.isAnomaly));

  loadLatestMeasurements(equipmentId: number): void {
    this.selectEquipment(equipmentId);
    this._measurements.set([]);
    this.load('measurements', this.api.getLatestMeasurements(equipmentId), value => this._measurements.set(value));
  }

  /** Loads whether the IoT device, located in its environment, is communicating with Edge (US55). */
  loadDeviceConnection(device: { id: number; environmentId: number | null }): void {
    this.selectEquipment(device.id);
    this._deviceConnection.set(null);
    if (device.environmentId === null) return;
    this.load('connection', this.api.getDeviceConnection(this.iam.requireLaboratoryId(), device.environmentId, device.id),
      value => this._deviceConnection.set(value));
  }

  loadTelemetryHistory(filters: { equipmentId: number; from?: string; to?: string }): void {
    this.selectEquipment(filters.equipmentId);
    this._telemetryHistory.set([]);
    this.load('history', this.api.getTelemetryHistory(filters), value => this._telemetryHistory.set(value));
  }

  clearMessages(): void { this.failures.set({}); }

  private selectEquipment(id: number): void {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('A valid equipment ID is required');
    if (this.selectedEquipment === id) return;
    this.requests.forEach(request => request.unsubscribe());
    this.requests.clear();
    this.selectedEquipment = id;
    this._measurements.set([]);
    this._deviceConnection.set(null);
    this._telemetryHistory.set([]);
    this.failures.set({});
  }

  private load<T>(key: string, source: Observable<T>, apply: (value: T) => void): void {
    // Cancel the previous request for this resource so a late response cannot replace a newer selection.
    this.requests.get(key)?.unsubscribe();
    this.failures.update(value => {
      const next = { ...value };
      delete next[key];
      return next;
    });
    this.pending.update(value => value + 1);
    this.requests.set(key, source.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.pending.update(value => value - 1)),
    ).subscribe({
      next: apply,
      error: () => this.failures.update(value => ({ ...value, [key]: 'onboarding.load-error' })),
    }));
  }
}
