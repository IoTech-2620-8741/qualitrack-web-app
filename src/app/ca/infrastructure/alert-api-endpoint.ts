import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { AlertSeverity, AlertStatus, DeviationAlert } from '../domain/model/deviation-alert.entity';
import { AlertResource, AlertsResponse } from './alert-response';
import { AlertAssembler } from './alert-assembler';
import { ResolveAlertRequest } from './resolve-alert.request';

const apiBaseUrl = environment.serverBasePath;

export class AlertApiEndpoint extends BaseApiEndpoint<
  DeviationAlert,
  AlertResource,
  AlertsResponse,
  AlertAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${apiBaseUrl}${environment.deviationAlertsEndpointPath}`, new AlertAssembler());
  }

  getAlerts(laboratoryId: number, filters?: {
    equipmentId?: number;
    batchId?: number;
    status?: AlertStatus;
    severity?: AlertSeverity;
  }): Observable<DeviationAlert[]> {
    if (!filters?.equipmentId && !filters?.batchId) {
      return of([]);
    }

    let params = new HttpParams();

    if (filters.status) params = params.set('status', filters.status);
    if (filters.severity) params = params.set('severity', filters.severity);

    const url = filters.equipmentId
      ? `${apiBaseUrl}${environment.laboratoryLabsEndpointPath}/${laboratoryId}${environment.equipmentEndpointPath}/${filters.equipmentId}${environment.equipmentDeviationAlertsEndpointPath}`
      : `${apiBaseUrl}${environment.batchEndpointPath}/${filters.batchId}${environment.batchDeviationAlertsEndpointPath}`;

    return this.http.get<AlertResource[]>(url, { params }).pipe(
      map((resources) => this.assembler.toEntitiesFromResources(resources)),
      catchError(this.handleError('Failed to fetch deviation alerts')),
    );
  }

  getAlertById(alertId: number): Observable<DeviationAlert> {
    return this.http.get<AlertResource>(`${this.endpointUrl}/${alertId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch deviation alert ${alertId}`)),
    );
  }

  /** Registers that the authenticated user attends the alert (TS75). */
  acknowledgeAlert(alertId: number): Observable<DeviationAlert> {
    return this.http
      .post<AlertResource>(`${this.endpointUrl}/${alertId}${environment.deviationAlertAcknowledgementsEndpointPath}`, null)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to acknowledge deviation alert ${alertId}`)),
      );
  }

  /** Registers the resolution of the alert by the authenticated user (TS76). */
  resolveAlert(alertId: number, request: ResolveAlertRequest): Observable<DeviationAlert> {
    return this.http
      .post<AlertResource>(`${this.endpointUrl}/${alertId}${environment.deviationAlertResolutionsEndpointPath}`, request)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to resolve deviation alert ${alertId}`)),
      );
  }
}
