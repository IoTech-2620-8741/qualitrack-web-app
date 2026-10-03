/** Body of POST /laboratories/{laboratoryId}/equipments (TS31). */
export interface RegisterEquipmentRequest {
  name: string;
  type: string;
  model: string;
  serialNumber: string;
}

/** Body of POST /laboratories/{laboratoryId}/devices/{environmental-devices|container-monitors} (TS37, TS39). */
export interface RegisterIotDeviceRequest {
  name: string;
  sensorExternalId: string;
  serialNumber: string;
  model: string;
  firmwareVersion: string | null;
}

/** Body of POST .../environments/{environmentId}/equipments (TS33). */
export interface AssignEquipmentRequest {
  equipmentId: number;
}

/** Body of POST .../environments/{environmentId}/{environmental-devices|container-monitors} (TS38, TS40). */
export interface AssignDeviceRequest {
  deviceId: number;
}

/** Body of POST .../equipments/{equipmentId}/status-changes (TS34). */
export interface ChangeEquipmentStatusRequest {
  status: string;
  reason: string | null;
}
