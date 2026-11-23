import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { environment } from '../../../environments/environment';
import { IotDeviceType } from '../domain/model/iot-device-type';
import { MonitoringProfile } from '../domain/model/monitoring-profile.entity';
import { MonitoringProfileResource } from './monitoring-profile-response';
import { MonitoringProfileAssembler } from './monitoring-profile-assembler';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the environmental profiles that monitor IoT devices.
 *
 * @remarks
 * Reads the profile kept by Tracking: an environmental device follows the profile of its environment, and a container
 * monitor has its own under the environment where it is located. Translates it with {@link MonitoringProfileAssembler}.
 */
export class MonitoringProfileApiEndpoint extends ErrorHandlingEnabledBaseType {
  private readonly assembler = new MonitoringProfileAssembler();

  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Retrieves the current environmental profile of an IoT device.
   *
   * @param laboratoryId - The identifier of the laboratory.
   * @param environmentId - The identifier of the environment where the device is located.
   * @param deviceType - The type of the device, which decides whose profile it follows.
   * @param deviceId - The identifier of the device.
   * @returns An observable that emits the profile, or `null` when it has not been configured yet.
   */
  getProfile(
    laboratoryId: number,
    environmentId: number,
    deviceType: IotDeviceType,
    deviceId: number,
  ): Observable<MonitoringProfile | null> {
    const environmentUrl = `${laboratoriesEndpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`;
    const ownerUrl = deviceType === 'CONTAINER_MONITOR'
      ? `${environmentUrl}${environment.containerMonitorsEndpointPath}/${deviceId}`
      : environmentUrl;
    return this.http.get<MonitoringProfileResource>(`${ownerUrl}${environment.trackingEnvironmentalProfileEndpointPath}`).pipe(
      map((resource): MonitoringProfile | null => this.assembler.toEntityFromResource(resource)),
      catchError((error: HttpErrorResponse) =>
        error.status === 404 ? of(null) : this.handleError('Failed to fetch the monitoring profile')(error)),
    );
  }
}
