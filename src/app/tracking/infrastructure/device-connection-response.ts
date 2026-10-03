import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/** Body of GET /laboratories/{laboratoryId}/environments/{environmentId}/devices/{deviceId}/telemetry-status. */
export interface DeviceConnectionResource extends BaseResource {
  deviceId: number;
  connectionStatus: string;
  lastCommunicationAt: string | null;
  expectedPeriodSeconds: number;
}

export interface DeviceConnectionsResponse extends BaseResponse {
  devices: DeviceConnectionResource[];
}
