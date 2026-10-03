import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DeviceConnection, DeviceConnectionStatus } from '../domain/model/device-connection.entity';
import { DeviceConnectionResource, DeviceConnectionsResponse } from './device-connection-response';

export class DeviceConnectionAssembler implements BaseAssembler<
  DeviceConnection,
  DeviceConnectionResource,
  DeviceConnectionsResponse
> {
  toEntitiesFromResponse(response: DeviceConnectionsResponse): DeviceConnection[] {
    return response.devices.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: DeviceConnectionResource): DeviceConnection {
    return new DeviceConnection({
      id: resource.deviceId,
      connectionStatus: resource.connectionStatus as DeviceConnectionStatus,
      lastCommunicationAt: resource.lastCommunicationAt,
      expectedPeriodSeconds: resource.expectedPeriodSeconds,
    });
  }

  toResourceFromEntity(entity: DeviceConnection): DeviceConnectionResource {
    return {
      id: entity.id,
      deviceId: entity.id,
      connectionStatus: entity.connectionStatus,
      lastCommunicationAt: entity.lastCommunicationAt,
      expectedPeriodSeconds: entity.expectedPeriodSeconds,
    };
  }
}
