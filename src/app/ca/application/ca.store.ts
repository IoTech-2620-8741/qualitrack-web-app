import { computed, DestroyRef, inject, Injectable, Signal, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry, Subject, takeUntil } from 'rxjs';

import { DeviationAlert } from '../domain/model/deviation-alert.entity';
import { ComplianceEvent } from '../domain/model/compliance-event.entity';
import { NotificationPreference } from '../domain/model/notification-preference.entity';
import { CaApi } from '../infrastructure/ca-api';
import { AlertFilters } from '../infrastructure/alert-api-endpoint';
import { UpdateNotificationPreferenceRequest } from '../infrastructure/notification-preference.request';
import { ResolveAlertRequest } from '../infrastructure/resolve-alert.request';
import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';
import { EquipmentApi } from '../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../equipment/domain/model/equipment.entity';

/**
 * Translates failures of the alert views into translation keys, or the server details when they explain a rule.
 *
 * @param error - The failure raised by the API facade
 */
export function alertError(error: unknown): string {
  const status = error instanceof ApiError ? error.status : error instanceof HttpErrorResponse ? error.status : null;
  if (status === 0) return 'ca-alerts.errors.connection';
  if (status === 403) return 'ca-alerts.errors.forbidden';
  if (status === 404) return 'ca-alerts.not-found';
  if (error instanceof ApiError && error.details) return error.details;
  if (error instanceof HttpErrorResponse && (error.error?.details || error.error?.message)) {
    return error.error.details || error.error.message;
  }
  return 'ca-alerts.errors.failed';
}

/**
 * Application store for Compliance & Alerting (CA).
 *
 * @remarks
 * Alerts are read per environment (US85, TS74); the selected alert keeps its detail with the related actions
 * (US86) and is acknowledged (US87) or resolved (US88) by the authenticated user. Operators and quality managers
 * attend alerts; auditors only consult them (decision of 2026-10-04).
 */
@Injectable({ providedIn: 'root' })
export class CaStore {
  private readonly _alertsSignal = signal<DeviationAlert[]>([]);
  private readonly _selectedAlertSignal = signal<DeviationAlert | null>(null);
  private readonly _eventsSignal = signal<ComplianceEvent[]>([]);
  private readonly _preferenceSignal = signal<NotificationPreference | null>(null);
  private readonly _devicesSignal = signal<Equipment[]>([]);

  private readonly _loadingSignal = signal<boolean>(false);
  private readonly _savingSignal = signal<boolean>(false);
  private readonly _errorSignal = signal<string | null>(null);
  private readonly _noticeSignal = signal<string | null>(null);

  /** Alerts of the environment currently shown, newest first. */
  readonly alerts = this._alertsSignal.asReadonly();

  /** Alert shown in the detail, with its related actions. */
  readonly selectedAlert = this._selectedAlertSignal.asReadonly();

  /** Compliance audit events of an equipment or batch. */
  readonly complianceEvents = this._eventsSignal.asReadonly();

  /** Notification preferences of the user. */
  readonly preference = this._preferenceSignal.asReadonly();

  /** Equipment and IoT devices of the laboratory, to name the device of each alert. */
  readonly devices = this._devicesSignal.asReadonly();

  readonly loading = this._loadingSignal.asReadonly();

  /** Indicates whether an acknowledgement or resolution is being registered. */
  readonly saving = this._savingSignal.asReadonly();

  /** Latest error as a translation key or server detail. */
  readonly error = this._errorSignal.asReadonly();

  /** Latest confirmation as a translation key. */
  readonly notice = this._noticeSignal.asReadonly();

  /** Open alerts (unresolved or being attended) of the list. */
  readonly openAlertsCount = computed(() => this.alerts().filter((alert) => alert.isOpen).length);

  /** Open critical alerts of the list. */
  readonly criticalAlertsCount = computed(
    () => this.alerts().filter((alert) => alert.isOpen && alert.severity === 'CRITICAL').length,
  );

  /** Open alerts somebody is already attending. */
  readonly acknowledgedAlertsCount = computed(
    () => this.alerts().filter((alert) => alert.status === 'ACKNOWLEDGED').length,
  );

  /** Users who register operations attend alerts; auditors only consult them. */
  readonly canAttend: Signal<boolean>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly iam = inject(IamStore);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly reloadAlerts = new Subject<void>();
  private readonly reloadAlert = new Subject<void>();

  constructor(private caApi: CaApi) {
    this.canAttend = this.iam.canOperate;
  }

  /**
   * The alert shown by the detail, or one of the listed alerts.
   *
   * @param id - The unique numeric identifier of the deviation alert.
   */
  getAlertById(id: number): Signal<DeviationAlert | undefined> {
    return computed(() => {
      const selectedAlert = this.selectedAlert();

      return selectedAlert?.id === id
        ? selectedAlert
        : this.alerts().find((alert) => alert.id === id);
    });
  }

  /** Name of the device or equipment of an alert, or null while it is unknown. */
  deviceName(equipmentId: number): string | null {
    return this.devices().find((device) => device.id === equipmentId)?.name ?? null;
  }

  /** Loads the equipment of the laboratory once, to show the name of the device of each alert. */
  loadDevices(): void {
    if (this._devicesSignal().length) return;
    this.equipmentApi
      .getEquipment(this.iam.requireLaboratoryId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (devices) => this._devicesSignal.set(devices), error: () => this._devicesSignal.set([]) });
  }

  /**
   * Loads the alerts of an environment and its monitored containers (US85, TS74).
   *
   * @param environmentId - The environment
   * @param filters - Optional status, severity, device and active filters
   */
  loadEnvironmentAlerts(environmentId: number, filters: AlertFilters = {}): void {
    this.reloadAlerts.next();
    this._alertsSignal.set([]);
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getEnvironmentAlerts(this.iam.requireLaboratoryId(), environmentId, filters)
      .pipe(takeUntil(this.reloadAlerts), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alerts) => {
          this._alertsSignal.set(alerts);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Loads an alert with its origin and the actions related to the incident (US86).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   */
  loadAlertById(alertId: number): void {
    if (!alertId) return;
    this.reloadAlert.next();
    this._selectedAlertSignal.set(null);
    this._loadingSignal.set(true);
    this._errorSignal.set(null);
    this._noticeSignal.set(null);

    this.caApi
      .getAlertById(alertId)
      .pipe(takeUntil(this.reloadAlert), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (alert) => {
          this.replaceAlert(alert);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Registers that the authenticated user attends the alert (US87).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   */
  acknowledgeAlert(alertId: number): void {
    this.attend(alertId, this.caApi.acknowledgeAlert(alertId), 'ca-alerts.acknowledged');
  }

  /**
   * Registers the resolution of the alert by the authenticated user (US88).
   *
   * @param alertId - The unique numeric identifier of the deviation alert.
   * @param request - DTO containing the resolution notes.
   */
  resolveAlert(alertId: number, request: ResolveAlertRequest): void {
    this.attend(alertId, this.caApi.resolveAlert(alertId, request), 'ca-alerts.resolved');
  }

  /**
   * Fetches compliance events related to an equipment.
   *
   * @param equipmentId - The unique numeric identifier of the equipment.
   */
  loadEquipmentComplianceEvents(equipmentId: number): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getEquipmentComplianceEvents(this.iam.requireLaboratoryId(), equipmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this._eventsSignal.set(events);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  loadBatchComplianceEvents(batchId: number): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getBatchComplianceEvents(batchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          this._eventsSignal.set(events);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Fetches notification preferences for a specific user.
   *
   * @param userId - The unique numeric identifier of the user.
   */
  loadNotificationPreferences(userId: number): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .getPreferences(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preference) => {
          this._preferenceSignal.set(preference);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  /**
   * Updates notification preferences and refreshes the local state.
   *
   * @param userId - The unique numeric identifier of the user.
   * @param request - DTO containing the updated preference values.
   */
  updateNotificationPreferences(
    userId: number,
    request: UpdateNotificationPreferenceRequest,
  ): void {
    this._loadingSignal.set(true);
    this._errorSignal.set(null);

    this.caApi
      .updatePreferences(userId, request)
      .pipe(retry(2), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedPreference) => {
          this._preferenceSignal.set(updatedPreference);
          this._loadingSignal.set(false);
        },
        error: (err) => {
          this._errorSignal.set(alertError(err));
          this._loadingSignal.set(false);
        },
      });
  }

  clearAlerts(): void {
    this.reloadAlerts.next();
    this._alertsSignal.set([]);
    this._loadingSignal.set(false);
  }

  clearError(): void {
    this._errorSignal.set(null);
    this._noticeSignal.set(null);
  }

  setError(message: string): void {
    this._errorSignal.set(message);
  }

  private attend(alertId: number, request: ReturnType<CaApi['acknowledgeAlert']>, notice: string): void {
    if (!alertId || this._savingSignal()) return;
    this._savingSignal.set(true);
    this._errorSignal.set(null);
    this._noticeSignal.set(null);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updatedAlert) => {
        // The acknowledgement and resolution responses do not repeat the related actions of the detail.
        const current = this._selectedAlertSignal();
        if (current?.id === updatedAlert.id) updatedAlert.relatedActuations = current.relatedActuations;
        this.replaceAlert(updatedAlert);
        this._noticeSignal.set(notice);
        this._savingSignal.set(false);
      },
      error: (err) => {
        this._errorSignal.set(alertError(err));
        this._savingSignal.set(false);
      },
    });
  }

  /**
   * Replaces an alert in the local collection and marks it as the selected alert.
   *
   * @param updatedAlert - The latest version of the deviation alert.
   */
  private replaceAlert(updatedAlert: DeviationAlert): void {
    this._selectedAlertSignal.set(updatedAlert);
    this._alertsSignal.update((alerts) =>
      alerts.map((alert) => (alert.id === updatedAlert.id ? updatedAlert : alert)),
    );
  }
}
