import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Measurement } from '../domain/model/measurement.entity';
import { DeviceConnection } from '../domain/model/device-connection.entity';
import { TelemetryHistoryPoint } from '../domain/model/telemetry-history-point.entity';

import { MeasurementApiEndpoint } from './measurement-api-endpoint';
import { DeviceConnectionApiEndpoint } from './device-connection-api-endpoint';
import { TelemetryHistoryApiEndpoint } from './telemetry-history-api-endpoint';

/**
 * Facade service for Tracking infrastructure API operations.
 *
 * @remarks
 * This service centralizes access to the Tracking bounded context endpoints.
 * It hides endpoint-specific details from the application store and provides
 * a clean API for telemetry measurements, equipment status, and historical data.
 */
@Injectable({ providedIn: 'root' })
export class TrackingApi {
  /**
   * Endpoint client for telemetry measurement operations.
   */
  private readonly measurementEndpoint: MeasurementApiEndpoint;

  /**
   * Endpoint client for equipment status operations.
   */
  private readonly deviceConnectionEndpoint: DeviceConnectionApiEndpoint;

  /**
   * Endpoint client for telemetry history operations.
   */
  private readonly telemetryHistoryEndpoint: TelemetryHistoryApiEndpoint;

  /**
   * Creates a new TrackingApi facade.
   *
   * @param http - Angular HttpClient used by the internal endpoint clients
   */
  constructor(private readonly http: HttpClient) {
    this.measurementEndpoint = new MeasurementApiEndpoint(this.http);
    this.deviceConnectionEndpoint = new DeviceConnectionApiEndpoint(this.http);
    this.telemetryHistoryEndpoint = new TelemetryHistoryApiEndpoint(this.http);
  }

  /**
   * Retrieves the latest telemetry measurements.
   *
   * @param equipmentId - Optional numeric equipment identifier used for filtering
   * @returns Observable stream emitting Measurement domain entities
   */
  getLatestMeasurements(equipmentId: number): Observable<Measurement[]> {
    return this.measurementEndpoint.getLatestMeasurements(equipmentId);
  }

  /**
   * Whether an IoT device located in the environment is communicating with Edge (TS41).
   */
  getDeviceConnection(laboratoryId: number, environmentId: number, deviceId: number): Observable<DeviceConnection> {
    return this.deviceConnectionEndpoint.getConnection(laboratoryId, environmentId, deviceId);
  }

  /**
   * Retrieves historical telemetry points using optional filters.
   *
   * @param filters - Optional telemetry history filters
   * @returns Observable stream emitting TelemetryHistoryPoint domain entities
   */
  getTelemetryHistory(filters: {
    equipmentId: number;
    from?: string;
    to?: string;
  }): Observable<TelemetryHistoryPoint[]> {
    return this.telemetryHistoryEndpoint.getTelemetryHistory(filters);
  }
}
