import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { ApiError } from '../../shared/infrastructure/api-error';
import { EquipmentApi } from '../infrastructure/equipment-api';
import { Equipment } from '../domain/model/equipment.entity';
import { BpmParameterConfig } from '../domain/model/bpm-parameter-config.entity';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { RegisterEquipmentCommand } from '../domain/model/register-equipment.command';
import { RegisterIotDeviceCommand } from '../domain/model/register-iot-device.command';
import { ChangeEquipmentStatusCommand } from '../domain/model/change-equipment-status.command';
import { ConfigureBpmCommand } from '../domain/model/configure-bpm.command';
import { RegisterMaintenanceCommand } from '../domain/model/register-maintenance.command';
import { ATTENTION_STATUSES } from '../domain/model/equipment-status';

/**
 * Maps an API failure to a translation key, or to the server message for business rule violations.
 */
export function equipmentError(error: unknown): string {
  const status = error instanceof ApiError ? error.status : error instanceof HttpErrorResponse ? error.status : null;
  if (status === 0) return 'equipment.errors.connection';
  if (status === 403) return 'equipment.errors.forbidden';
  if (status === 404) return 'equipment.errors.not-found';
  if (error instanceof ApiError) return error.details || error.message;
  if (error instanceof HttpErrorResponse) return error.error?.details || error.error?.message || 'equipment.errors.failed';
  return 'equipment.errors.failed';
}

/**
 * Application store of the equipment and IoT devices of the current laboratory (US45-US54).
 *
 * @remarks
 * Equipment belongs to the laboratory; once located in an environment, its status changes and
 * maintenance are registered there. IoT devices (environmental devices and container monitors)
 * are the only equipment shown in the tracking views.
 */
@Injectable({ providedIn: 'root' })
export class EquipmentStore {
  private readonly api = inject(EquipmentApi);
  private readonly iam = inject(IamStore);
  /** Discards late responses: the list and the selected equipment load independently. */
  private listGeneration = 0;
  private itemGeneration = 0;

  private readonly _equipmentList = signal<Equipment[]>([]);
  private readonly _selectedEquipment = signal<Equipment | null>(null);
  private readonly _bpmConfigs = signal<BpmParameterConfig[]>([]);
  private readonly _maintenanceHistory = signal<MaintenanceRecord[]>([]);
  private readonly _listLoading = signal<boolean>(false);
  private readonly _itemLoading = signal<boolean>(false);
  private readonly _saving = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMsg = signal<string | null>(null);

  readonly equipmentList = this._equipmentList.asReadonly();
  readonly selectedEquipment = this._selectedEquipment.asReadonly();
  readonly bpmConfigs = this._bpmConfigs.asReadonly();
  readonly maintenanceHistory = this._maintenanceHistory.asReadonly();
  readonly isLoading = computed(() => this._listLoading() || this._itemLoading());
  readonly saving = this._saving.asReadonly();
  /** Translation key or server message of the last failure. */
  readonly error = this._error.asReadonly();
  readonly successMsg = this._successMsg.asReadonly();

  /** Equipment and devices are registered and located by quality managers and administrators (US45, US47). */
  readonly canManage = this.iam.canManageQuality;
  /** Status changes and maintenance are registered by operators and quality managers, not auditors. */
  readonly canOperate = this.iam.canOperate;

  /** IoT devices of the laboratory, the only equipment that sends telemetry. */
  readonly iotDevices = computed(() => this._equipmentList().filter((equipment) => equipment.isIotDevice));

  /** Equipment that is not an IoT device, used in manufacturing processes. */
  readonly processEquipment = computed(() => this._equipmentList().filter((equipment) => !equipment.isIotDevice));

  readonly operationalEquipment = computed(() =>
    this._equipmentList().filter((equipment) => equipment.status === 'OPERATIONAL'),
  );

  /** Equipment in maintenance or out of service. */
  readonly needsMaintenance = computed(() =>
    this._equipmentList().filter((equipment) => ATTENTION_STATUSES.includes(equipment.status)),
  );

  /**
   * Loads the equipment and IoT devices of the laboratory.
   *
   * @param labId - The laboratory to load; the laboratory of the session by default
   */
  loadEquipment(labId: number = this.laboratoryId): void {
    void this.refresh(labId);
  }

  /** Loads one equipment of the laboratory and keeps it as the selected equipment. */
  async loadEquipmentById(equipmentId: number): Promise<Equipment | null> {
    const generation = ++this.itemGeneration;
    this._selectedEquipment.set(null);
    this._itemLoading.set(true);
    this._error.set(null);
    try {
      const equipment = await firstValueFrom(this.api.getEquipmentById(this.laboratoryId, equipmentId));
      if (generation !== this.itemGeneration) return null;
      this.replace(equipment);
      return equipment;
    } catch (error) {
      if (generation === this.itemGeneration) this._error.set(equipmentError(error));
      return null;
    } finally {
      if (generation === this.itemGeneration) this._itemLoading.set(false);
    }
  }

  /** Registers an equipment of the laboratory (US45). */
  async registerEquipment(command: RegisterEquipmentCommand): Promise<Equipment | null> {
    return this.save(async () => {
      const equipment = await firstValueFrom(this.api.registerEquipment(this.laboratoryId, {
        name: command.name.trim(),
        type: command.type.trim(),
        model: command.model.trim(),
        serialNumber: command.serialNumber.trim(),
      }));
      this.replace(equipment);
      return equipment;
    });
  }

  /**
   * Registers an environmental device or container monitor (US51, US53) and, when an environment is
   * given, associates it with that environment (US52, US54).
   *
   * @returns The device, or null when it could not be registered. When the association fails the
   * device stays registered and the error explains why it was not located.
   */
  async registerDevice(command: RegisterIotDeviceCommand, environmentId: number | null): Promise<Equipment | null> {
    const device = await this.save(async () => {
      const registered = await firstValueFrom(this.api.registerDevice(this.laboratoryId, command.deviceType, {
        name: command.name.trim(),
        sensorExternalId: command.sensorExternalId.trim(),
        serialNumber: command.serialNumber.trim(),
        model: command.model.trim(),
        firmwareVersion: command.firmwareVersion?.trim() || null,
      }));
      this.replace(registered);
      return registered;
    });
    if (!device || environmentId === null) return device;
    return (await this.assignToEnvironment(device, environmentId)) ?? device;
  }

  /** Locates the equipment or IoT device in an environment of the laboratory (US47, US52, US54). */
  async assignToEnvironment(equipment: Equipment, environmentId: number): Promise<Equipment | null> {
    return this.save(async () => {
      const located = await firstValueFrom(this.api.assignToEnvironment(this.laboratoryId, environmentId, equipment));
      this.replace(located);
      return located;
    });
  }

  /** Registers a change of operational status of an equipment located in an environment (US48). */
  async changeStatus(equipment: Equipment, command: ChangeEquipmentStatusCommand): Promise<boolean> {
    if (equipment.environmentId === null) return false;
    const environmentId = equipment.environmentId;
    const updated = await this.save(async () => {
      await firstValueFrom(this.api.changeStatus(this.laboratoryId, environmentId, equipment.id, {
        status: command.status,
        reason: command.reason?.trim() || null,
      }));
      const reloaded = await firstValueFrom(this.api.getEquipmentById(this.laboratoryId, equipment.id));
      this.replace(reloaded);
      return reloaded;
    });
    return updated !== null;
  }

  /** Loads the maintenance history of an equipment located in an environment (US50). */
  async loadMaintenanceHistory(equipment: Equipment): Promise<void> {
    this._maintenanceHistory.set([]);
    if (equipment.environmentId === null) return;
    try {
      this._maintenanceHistory.set(await firstValueFrom(
        this.api.getMaintenanceHistory(this.laboratoryId, equipment.environmentId, equipment.id)));
    } catch (error) {
      this._error.set(equipmentError(error));
    }
  }

  /** Registers a maintenance performed on an equipment located in an environment (US49). */
  async registerMaintenance(equipment: Equipment, command: RegisterMaintenanceCommand): Promise<boolean> {
    if (equipment.environmentId === null) return false;
    const environmentId = equipment.environmentId;
    const record = await this.save(() => firstValueFrom(this.api.registerMaintenance(
      this.laboratoryId, environmentId, equipment.id, {
        ...command,
        description: command.description.trim(),
      })));
    if (record) this._maintenanceHistory.update((history) => [record, ...history]);
    return record !== null;
  }

  /** Loads the BPM parameter limits of an equipment. */
  loadBpmConfig(equipmentId: number): void {
    this.api.getBpmConfig(this.iam.requireLaboratoryId(), equipmentId).subscribe({
      next: (configs) => this._bpmConfigs.set(configs),
      error: (error: unknown) => this._error.set(equipmentError(error)),
    });
  }

  /** Configures the limits of a BPM parameter of an equipment. */
  configureBpm(command: ConfigureBpmCommand): void {
    this._saving.set(true);
    this._error.set(null);
    this.api.configureBpm(this.iam.requireLaboratoryId(), command).subscribe({
      next: () => {
        this.loadBpmConfig(command.equipmentId);
        this._successMsg.set('bpm-config.saved');
        this._saving.set(false);
      },
      error: (error: unknown) => {
        this._error.set(equipmentError(error));
        this._saving.set(false);
      },
    });
  }

  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  private async refresh(labId: number): Promise<void> {
    const generation = ++this.listGeneration;
    this._listLoading.set(true);
    this._error.set(null);
    try {
      const equipment = await firstValueFrom(this.api.getEquipment(labId));
      if (generation === this.listGeneration) this._equipmentList.set(equipment);
    } catch (error) {
      if (generation === this.listGeneration) this._error.set(equipmentError(error));
    } finally {
      if (generation === this.listGeneration) this._listLoading.set(false);
    }
  }

  private async save<T>(operation: () => Promise<T>): Promise<T | null> {
    if (this._saving()) return null;
    this._saving.set(true);
    this._error.set(null);
    try {
      return await operation();
    } catch (error) {
      this._error.set(equipmentError(error));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  private replace(equipment: Equipment): void {
    this._selectedEquipment.set(equipment);
    this._equipmentList.update((list) => list.some((item) => item.id === equipment.id)
      ? list.map((item) => (item.id === equipment.id ? equipment : item))
      : [...list, equipment].sort((a, b) => a.name.localeCompare(b.name)));
  }

  private get laboratoryId(): number {
    return this.iam.requireLaboratoryId();
  }
}
