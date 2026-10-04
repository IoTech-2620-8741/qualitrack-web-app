import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AlertOrigin, AlertSeverity, AlertStatus } from '../domain/model/deviation-alert.entity';

/** Deviation alert as returned by /laboratories/{laboratoryId}/environments/{environmentId}/deviation-alerts. */
export interface AlertResource extends BaseResource {
  id: number;
  laboratoryId: number | null;
  environmentId: number | null;
  origin: AlertOrigin | null;
  equipmentId: number;
  batchId: number | null;
  measurementId: number | null;
  lastMeasurementId: number | null;
  parameterName: string;
  recordedValue: number;
  thresholdValue: number;
  unit: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;
  deviationCount: number | null;
  lastDetectedAt: string | null;
  normalizedAt: string | null;
  acknowledgedBy: number | null;
  acknowledgedAt: string | null;
  resolvedBy: number | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
}

/** Action related to an alert, part of GET /deviation-alerts/{alertId}. */
export interface RelatedActuationResource {
  id: number;
  action: string;
  triggerState: string | null;
  result: string;
  occurredAt: string;
}

/** Alert detail: the alert and the actions related to its incident (US86). */
export interface AlertDetailResource extends AlertResource {
  relatedActuations: RelatedActuationResource[];
}

export interface AlertsResponse extends BaseResponse {
  alerts: AlertResource[];
}
