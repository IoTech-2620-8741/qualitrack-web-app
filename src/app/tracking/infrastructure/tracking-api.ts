import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Measurement } from '../domain/model/measurement.entity';
import { DeviceConnection } from '../domain/model/device-connection.entity';
import { ActuationEvent } from '../domain/model/actuation-event.entity';
import { ActuationRule, EnvironmentalProfile, ThresholdInput } from '../domain/model/environmental-profile.entity';
import { MonitoredMetric } from '../domain/model/monitored-metric';
import { DeviceConnectionApiEndpoint } from './device-connection-api-endpoint';
import {
  ActuationEventApiEndpoint,
  DeviceTarget,
  EnvironmentalProfileApiEndpoint,
  MeasurementApiEndpoint,
  TelemetryPeriod,
} from './tracking-api-endpoints';

/**
 * Facade of the Tracking & Telemetry API: environmental profiles, readings, actions and connection of the IoT devices.
 */
@Injectable({ providedIn: 'root' })
export class TrackingApi extends BaseApi {
  private readonly measurementEndpoint: MeasurementApiEndpoint;
  private readonly actuationEventEndpoint: ActuationEventApiEndpoint;
  private readonly profileEndpoint: EnvironmentalProfileApiEndpoint;
  private readonly deviceConnectionEndpoint: DeviceConnectionApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.measurementEndpoint = new MeasurementApiEndpoint(http);
    this.actuationEventEndpoint = new ActuationEventApiEndpoint(http);
    this.profileEndpoint = new EnvironmentalProfileApiEndpoint(http);
    this.deviceConnectionEndpoint = new DeviceConnectionApiEndpoint(http);
  }

  getMeasurements(target: DeviceTarget, period: TelemetryPeriod, metric?: MonitoredMetric | null): Observable<Measurement[]> {
    return this.measurementEndpoint.getMeasurements(target, period, metric);
  }

  getActuationEvents(target: DeviceTarget, period: TelemetryPeriod): Observable<ActuationEvent[]> {
    return this.actuationEventEndpoint.getActuationEvents(target, period);
  }

  getProfile(target: DeviceTarget): Observable<EnvironmentalProfile | null> {
    return this.profileEndpoint.getProfile(target);
  }

  updateThresholds(target: DeviceTarget, thresholds: ThresholdInput[]): Observable<EnvironmentalProfile> {
    return this.profileEndpoint.updateThresholds(target, thresholds);
  }

  updateActuationRules(target: DeviceTarget, rules: ActuationRule[]): Observable<EnvironmentalProfile> {
    return this.profileEndpoint.updateActuationRules(target, rules);
  }

  getDeviceConnection(laboratoryId: number, environmentId: number, deviceId: number): Observable<DeviceConnection> {
    return this.deviceConnectionEndpoint.getConnection(laboratoryId, environmentId, deviceId);
  }
}
