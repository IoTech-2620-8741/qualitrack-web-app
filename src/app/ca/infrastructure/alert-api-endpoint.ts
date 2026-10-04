import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { AlertSeverity, AlertStatus, DeviationAlert } from '../domain/model/deviation-alert.entity';
import { AlertDetailResource, AlertResource, AlertsResponse } from './alert-response';
import { AlertAssembler } from './alert-assembler';
import { ResolveAlertRequest } from './resolve-alert.request';

const apiBaseUrl = environment.serverBasePath;

/** Filters of the alerts of an environment (TS74). */
export interface AlertFilters {
  status?: AlertStatus;
  severity?: AlertSeverity;
  deviceId?: number;
  /** Only open alerts: unresolved or being attended (US85). */
  active?: boolean;
}

/**
 * HTTP client of deviation alerts: listed per environment under
 * /laboratories/{laboratoryId}/environments/{environmentId}/deviation-alerts (TS74) and attended through
 * /deviation-alerts/{alertId} (TS75, TS76).
 */
export class AlertApiEndpoint extends BaseApiEndpoint<
  DeviationAlert,
  AlertResource,
  AlertsResponse,
  AlertAssembler
> {
  constructor(http: HttpClient) {
    super(http, `${apiBaseUrl}${environment.deviationAlertsEndpointPath}`, new AlertAssembler());
  }

  getEnvironmentAlerts(laboratoryId: number, environmentId: number, filters: AlertFilters = {}): Observable<DeviationAlert[]> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.severity) params = params.set('severity', filters.severity);
    if (filters.deviceId) params = params.set('deviceId', filters.deviceId);
    if (filters.active) params = params.set('active', true);
    const url = `${apiBaseUrl}${environment.laboratoryLabsEndpointPath}/${laboratoryId}`
      + `${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.deviationAlertsEndpointPath}`;
    return this.http.get<AlertResource[]>(url, { params }).pipe(
      map((resources) => this.assembler.toEntitiesFromResources(resources)),
      catchError(this.handleError('Failed to fetch deviation alerts')),
    );
  }

  /** Alert with its origin and the actions related to the incident (US86). */
  getAlertById(alertId: number): Observable<DeviationAlert> {
    return this.http.get<AlertDetailResource>(`${this.endpointUrl}/${alertId}`).pipe(
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
