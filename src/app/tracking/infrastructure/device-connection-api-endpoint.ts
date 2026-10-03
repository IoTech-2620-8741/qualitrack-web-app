import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { DeviceConnection } from '../domain/model/device-connection.entity';
import { DeviceConnectionResource, DeviceConnectionsResponse } from './device-connection-response';
import { DeviceConnectionAssembler } from './device-connection-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/** Connection status of the IoT devices of an environment (TS41). */
export class DeviceConnectionApiEndpoint extends BaseApiEndpoint<
  DeviceConnection,
  DeviceConnectionResource,
  DeviceConnectionsResponse,
  DeviceConnectionAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new DeviceConnectionAssembler());
  }

  getConnection(laboratoryId: number, environmentId: number, deviceId: number): Observable<DeviceConnection> {
    const url = `${this.endpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`
      + `${environment.devicesEndpointPath}/${deviceId}${environment.equipmentTelemetryStatusEndpointPath}`;
    return this.http.get<DeviceConnectionResource>(url).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch the connection status of device ${deviceId}`)),
    );
  }
}
