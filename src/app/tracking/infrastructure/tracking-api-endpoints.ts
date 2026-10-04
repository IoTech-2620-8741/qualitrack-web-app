import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Measurement } from '../domain/model/measurement.entity';
import { ActuationEvent } from '../domain/model/actuation-event.entity';
import { ActuationRule, EnvironmentalProfile, ThresholdInput } from '../domain/model/environmental-profile.entity';
import { MonitoredMetric } from '../domain/model/monitored-metric';
import { ActuationEventAssembler, EnvironmentalProfileAssembler, MeasurementAssembler } from './tracking-assemblers';
import {
  ActuationEventResource,
  ActuationEventsResponse,
  EnvironmentalProfileResource,
  EnvironmentalProfilesResponse,
  MeasurementResource,
  MeasurementsResponse,
} from './tracking-response';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * Device whose telemetry is requested: the environmental device of the environment (deviceId null) or a container
 * monitor located in it.
 */
export interface DeviceTarget {
  laboratoryId: number;
  environmentId: number;
  /** Container monitor; null for the environmental device of the environment. */
  deviceId: number | null;
}

/** Period of a query, ISO-8601 moments. */
export interface TelemetryPeriod {
  from: string;
  to: string;
}

/**
 * Path of the environment, or of a container monitor located in it.
 */
function targetPath(base: string, target: DeviceTarget): string {
  const environmentPath = `${base}/${target.laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${target.environmentId}`;
  return target.deviceId === null
    ? environmentPath
    : `${environmentPath}${environment.containerMonitorsEndpointPath}/${target.deviceId}`;
}

function periodParams(period: TelemetryPeriod, metric?: MonitoredMetric | null): HttpParams {
  let params = new HttpParams().set('from', period.from).set('to', period.to);
  if (metric) params = params.set('metric', metric);
  return params;
}

/**
 * Readings of the environmental device of an environment and of its container monitors (TS58, TS59).
 */
export class MeasurementApiEndpoint extends BaseApiEndpoint<
  Measurement,
  MeasurementResource,
  MeasurementsResponse,
  MeasurementAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new MeasurementAssembler());
  }

  getMeasurements(target: DeviceTarget, period: TelemetryPeriod, metric?: MonitoredMetric | null): Observable<Measurement[]> {
    const url = `${targetPath(this.endpointUrl, target)}${environment.trackingTelemetryMeasurementsEndpointPath}`;
    return this.http.get<MeasurementResource[]>(url, { params: periodParams(period, metric) }).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch the readings')),
    );
  }
}

/**
 * Actions of a container monitor (TS60).
 */
export class ActuationEventApiEndpoint extends BaseApiEndpoint<
  ActuationEvent,
  ActuationEventResource,
  ActuationEventsResponse,
  ActuationEventAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new ActuationEventAssembler());
  }

  getActuationEvents(target: DeviceTarget, period: TelemetryPeriod): Observable<ActuationEvent[]> {
    const url = `${targetPath(this.endpointUrl, target)}${environment.trackingActuationEventsEndpointPath}`;
    return this.http.get<ActuationEventResource[]>(url, { params: periodParams(period) }).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to fetch the actions of the container monitor')),
    );
  }
}

/**
 * Environmental profiles of an environment and of its container monitors (TS42-TS45).
 */
export class EnvironmentalProfileApiEndpoint extends BaseApiEndpoint<
  EnvironmentalProfile,
  EnvironmentalProfileResource,
  EnvironmentalProfilesResponse,
  EnvironmentalProfileAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new EnvironmentalProfileAssembler());
  }

  /**
   * Profile in force, or null when it has not been configured yet (404).
   */
  getProfile(target: DeviceTarget): Observable<EnvironmentalProfile | null> {
    return this.http.get<EnvironmentalProfileResource>(this.profileUrl(target)).pipe(
      map((resource): EnvironmentalProfile | null => this.assembler.toEntityFromResource(resource)),
      catchError((error: HttpErrorResponse) => error.status === 404
        ? of(null) : this.handleError('Failed to fetch the environmental profile')(error)),
    );
  }

  updateThresholds(target: DeviceTarget, thresholds: ThresholdInput[]): Observable<EnvironmentalProfile> {
    return this.http.put<EnvironmentalProfileResource>(`${this.profileUrl(target)}${environment.trackingThresholdsEndpointPath}`,
      { thresholds }).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to save the thresholds')),
    );
  }

  updateActuationRules(target: DeviceTarget, rules: ActuationRule[]): Observable<EnvironmentalProfile> {
    return this.http.put<EnvironmentalProfileResource>(`${this.profileUrl(target)}${environment.trackingActuationRulesEndpointPath}`,
      { rules }).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to save the actuation rules')),
    );
  }

  private profileUrl(target: DeviceTarget): string {
    return `${targetPath(this.endpointUrl, target)}${environment.trackingEnvironmentalProfileEndpointPath}`;
  }
}
