import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';

import { Equipment } from '../domain/model/equipment.entity';
import { BpmParameterConfig } from '../domain/model/bpm-parameter-config.entity';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { IotDeviceType } from '../domain/model/iot-device-type';

import { EquipmentApiEndpoint } from './equipment-api-endpoint';
import { BpmConfigApiEndpoint } from './bpm-config-api-endpoint';
import { MaintenanceApiEndpoint } from './maintenance-api-endpoint';

import { ChangeEquipmentStatusRequest, RegisterEquipmentRequest, RegisterIotDeviceRequest } from './equipment.request';
import { ConfigureBpmRequest } from './bpm-config.request';
import { RegisterMaintenanceRequest } from './maintenance.request';

/**
 * Infrastructure facade of the Equipment bounded context.
 *
 * @remarks
 * Equipment and IoT devices belong to a laboratory; their location, status changes and maintenance are
 * registered under the environment where they are located.
 */
@Injectable({ providedIn: 'root' })
export class EquipmentApi extends BaseApi {
  private readonly _equipmentEndpoint: EquipmentApiEndpoint;

  private readonly _bpmEndpoint: BpmConfigApiEndpoint;

  private readonly _maintenanceEndpoint: MaintenanceApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this._equipmentEndpoint = new EquipmentApiEndpoint(http);
    this._bpmEndpoint = new BpmConfigApiEndpoint(http);
    this._maintenanceEndpoint = new MaintenanceApiEndpoint(http);
  }

  /** Equipment and IoT devices of the laboratory (TS32). */
  getEquipment(laboratoryId: number): Observable<Equipment[]> {
    return this._equipmentEndpoint.getEquipmentByLab(laboratoryId);
  }

  getEquipmentById(laboratoryId: number, equipmentId: number): Observable<Equipment> {
    return this._equipmentEndpoint.getEquipmentById(laboratoryId, equipmentId);
  }

  /** Registers an equipment of the laboratory (TS31). */
  registerEquipment(laboratoryId: number, request: RegisterEquipmentRequest): Observable<Equipment> {
    return this._equipmentEndpoint.registerEquipment(laboratoryId, request);
  }

  /** Registers an environmental device or container monitor (TS37, TS39). */
  registerDevice(laboratoryId: number, deviceType: IotDeviceType, request: RegisterIotDeviceRequest): Observable<Equipment> {
    return this._equipmentEndpoint.registerDevice(laboratoryId, deviceType, request);
  }

  /**
   * Locates an equipment in an environment (TS33); IoT devices use their own resource (TS38, TS40).
   */
  assignToEnvironment(laboratoryId: number, environmentId: number, equipment: Equipment): Observable<Equipment> {
    return equipment.deviceType
      ? this._equipmentEndpoint.assignDevice(laboratoryId, environmentId, equipment.deviceType, { deviceId: equipment.id })
      : this._equipmentEndpoint.assignEquipment(laboratoryId, environmentId, { equipmentId: equipment.id });
  }

  /** Registers a change of operational status (TS34). */
  changeStatus(laboratoryId: number, environmentId: number, equipmentId: number,
               request: ChangeEquipmentStatusRequest): Observable<void> {
    return this._equipmentEndpoint.changeStatus(laboratoryId, environmentId, equipmentId, request);
  }

  getBpmConfig(laboratoryId: number, equipmentId: number): Observable<BpmParameterConfig[]> {
    return this._bpmEndpoint.getConfigByEquipment(laboratoryId, equipmentId);
  }

  /** Creates or replaces the range of a BPM parameter of an equipment. */
  configureBpm(laboratoryId: number, request: ConfigureBpmRequest): Observable<BpmParameterConfig> {
    return this._bpmEndpoint.configureBpm(laboratoryId, request);
  }

  /** Maintenance history of an equipment located in the environment (TS36). */
  getMaintenanceHistory(laboratoryId: number, environmentId: number, equipmentId: number): Observable<MaintenanceRecord[]> {
    return this._maintenanceEndpoint.getMaintenanceHistory(laboratoryId, environmentId, equipmentId);
  }

  /** Registers a maintenance performed on an equipment located in the environment (TS35). */
  registerMaintenance(laboratoryId: number, environmentId: number, equipmentId: number,
                      request: RegisterMaintenanceRequest): Observable<MaintenanceRecord> {
    return this._maintenanceEndpoint.registerMaintenance(laboratoryId, environmentId, equipmentId, request);
  }
}
