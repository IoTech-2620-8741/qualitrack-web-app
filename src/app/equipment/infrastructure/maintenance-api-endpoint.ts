import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { MaintenanceResource, MaintenancesResponse } from './maintenance-response';
import { MaintenanceAssembler } from './maintenance-assembler';
import { RegisterMaintenanceRequest } from './maintenance.request';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * Maintenance history of an equipment located in an environment (TS35, TS36).
 */
export class MaintenanceApiEndpoint extends BaseApiEndpoint<
  MaintenanceRecord,
  MaintenanceResource,
  MaintenancesResponse,
  MaintenanceAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new MaintenanceAssembler());
  }

  getMaintenanceHistory(laboratoryId: number, environmentId: number, equipmentId: number): Observable<MaintenanceRecord[]> {
    return this.http.get<MaintenanceResource[]>(this.records(laboratoryId, environmentId, equipmentId)).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError(`Failed to fetch maintenance history for equipment ${equipmentId}`)),
    );
  }

  registerMaintenance(laboratoryId: number, environmentId: number, equipmentId: number,
                      request: RegisterMaintenanceRequest): Observable<MaintenanceRecord> {
    return this.http.post<MaintenanceResource>(this.records(laboratoryId, environmentId, equipmentId), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register maintenance record')),
    );
  }

  private records(laboratoryId: number, environmentId: number, equipmentId: number): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`
      + `${environment.equipmentEndpointPath}/${equipmentId}${environment.equipmentMaintenanceEndpointPath}`;
  }
}
