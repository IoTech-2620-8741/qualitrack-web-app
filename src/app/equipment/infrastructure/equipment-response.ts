import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/** Equipment or IoT device returned by /laboratories/{laboratoryId}/equipments. */
export interface EquipmentResource extends BaseResource {
  id: number;
  laboratoryId: number;
  environmentId: number | null;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  status: string;
  deviceType: string | null;
  sensorExternalId: string | null;
  firmwareVersion: string | null;
  createdAt?: string;
}

export interface EquipmentsResponse extends BaseResponse {
  equipments: EquipmentResource[];
}
