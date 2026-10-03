import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EquipmentStatus } from './equipment-status';
import { IotDeviceType } from './iot-device-type';

/**
 * Equipment registered in a laboratory (US45, US46).
 *
 * @remarks
 * An IoT device is an equipment with a device type and the identity Edge uses to recognise it;
 * only IoT devices send telemetry and appear in the tracking views. Equipment is located in one
 * environment of the laboratory once it is associated with it (US47).
 */
export class Equipment implements BaseEntity {
  id: number;

  labId: number;

  /** Environment where the equipment is located; null until it is associated with one. */
  environmentId: number | null;

  name: string;

  type: string;

  model: string;

  serialNumber: string;

  status: EquipmentStatus;

  /** IoT device type; null for equipment that sends no telemetry. */
  deviceType: IotDeviceType | null;

  /** Identifier with which Edge recognises the device. */
  sensorExternalId: string | null;

  firmwareVersion: string | null;

  createdAt: string;

  constructor(params: {
    id: number;
    labId: number;
    environmentId: number | null;
    name: string;
    type: string;
    model: string;
    serialNumber: string;
    status: EquipmentStatus;
    deviceType: IotDeviceType | null;
    sensorExternalId: string | null;
    firmwareVersion: string | null;
    createdAt: string;
  }) {
    this.id = params.id;
    this.labId = params.labId;
    this.environmentId = params.environmentId;
    this.name = params.name;
    this.type = params.type;
    this.model = params.model;
    this.serialNumber = params.serialNumber;
    this.status = params.status;
    this.deviceType = params.deviceType;
    this.sensorExternalId = params.sensorExternalId;
    this.firmwareVersion = params.firmwareVersion;
    this.createdAt = params.createdAt;
  }

  /** Whether the equipment is an IoT device that communicates with Edge. */
  get isIotDevice(): boolean {
    return this.deviceType !== null;
  }

  /** Whether the equipment is already located in an environment. */
  get isLocated(): boolean {
    return this.environmentId !== null;
  }
}
