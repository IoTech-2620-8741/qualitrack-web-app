import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/** Reading returned by .../telemetry-measurements. */
export interface MeasurementResource extends BaseResource {
  id: number;
  deviceId: number;
  environmentId: number | null;
  metric: string;
  value: number | null;
  textValue: string | null;
  unit: string;
  measuredAt: string;
  state: string | null;
  thresholdValue: number | null;
  profileVersion: number | null;
}

export interface MeasurementsResponse extends BaseResponse {
  measurements: MeasurementResource[];
}

/** Action returned by .../actuation-events. */
export interface ActuationEventResource extends BaseResource {
  id: number;
  deviceId: number;
  environmentId: number;
  action: string;
  triggerMetric: string | null;
  triggerState: string | null;
  result: string;
  occurredAt: string;
  profileVersion: number | null;
}

export interface ActuationEventsResponse extends BaseResponse {
  actuationEvents: ActuationEventResource[];
}

export interface ThresholdResource {
  metric: string;
  unit?: string;
  normalMin: number | null;
  normalMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
}

export interface ActuationRuleResource {
  metric: string;
  state: string;
  action: string;
}

/** Profile returned by .../environmental-profile. */
export interface EnvironmentalProfileResource extends BaseResource {
  id: number;
  scope: string;
  laboratoryId: number;
  environmentId: number | null;
  deviceId: number | null;
  version: number;
  thresholds: ThresholdResource[];
  actuationRules: ActuationRuleResource[];
  updatedAt: string | null;
  updatedBy: number | null;
}

export interface EnvironmentalProfilesResponse extends BaseResponse {
  profiles: EnvironmentalProfileResource[];
}
