import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type AlertSeverity = 'LOW' | 'WARNING' | 'CRITICAL';

export type AlertStatus = 'UNRESOLVED' | 'ACKNOWLEDGED' | 'RESOLVED';

/** Whether the alert originated in the environment (environmental device) or in a monitored container (US86). */
export type AlertOrigin = 'ENVIRONMENT' | 'CONTAINER';

/** Action executed by the container monitor for the variable of an alert while the incident was open (US86). */
export interface RelatedActuation {
  id: number;
  action: string;
  triggerState: string | null;
  result: string;
  occurredAt: string;
}

/**
 * Deviation alert of an environment or of one of its monitored containers (US85-US88).
 *
 * @remarks
 * An alert is one incident: while it is open, new deviations of the same device and variable are counted in it, its
 * severity only rises and a return to normal is noted, but only a person closes it with a resolution.
 */
export class DeviationAlert implements BaseEntity {
  id: number;
  laboratoryId: number | null;
  environmentId: number | null;
  origin: AlertOrigin | null;
  /** Environmental device, container monitor or equipment that detected the deviation. */
  equipmentId: number;
  batchId: number | null;
  measurementId: number | null;
  lastMeasurementId: number | null;
  parameterName: string;
  /** Value and limit of the deviation that set the current severity. */
  recordedValue: number;
  thresholdValue: number;
  unit: string;
  /** When the incident started. */
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;
  deviationCount: number;
  lastDetectedAt: string | null;
  normalizedAt: string | null;
  acknowledgedBy: number | null;
  acknowledgedAt: string | null;
  resolvedBy: number | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  /** Only filled by the alert detail. */
  relatedActuations: RelatedActuation[];

  constructor(params: {
    id: number;
    laboratoryId?: number | null;
    environmentId?: number | null;
    origin?: AlertOrigin | null;
    equipmentId: number;
    batchId?: number | null;
    measurementId?: number | null;
    lastMeasurementId?: number | null;
    parameterName: string;
    recordedValue: number;
    thresholdValue: number;
    unit: string;
    timestamp: string;
    severity: AlertSeverity;
    status: AlertStatus;
    deviationCount?: number | null;
    lastDetectedAt?: string | null;
    normalizedAt?: string | null;
    acknowledgedBy?: number | null;
    acknowledgedAt?: string | null;
    resolvedBy?: number | null;
    resolvedAt?: string | null;
    resolutionNotes?: string | null;
    relatedActuations?: RelatedActuation[];
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId ?? null;
    this.environmentId = params.environmentId ?? null;
    this.origin = params.origin ?? null;
    this.equipmentId = params.equipmentId;
    this.batchId = params.batchId ?? null;
    this.measurementId = params.measurementId ?? null;
    this.lastMeasurementId = params.lastMeasurementId ?? null;
    this.parameterName = params.parameterName;
    this.recordedValue = params.recordedValue;
    this.thresholdValue = params.thresholdValue;
    this.unit = params.unit;
    this.timestamp = params.timestamp;
    this.severity = params.severity;
    this.status = params.status;
    this.deviationCount = params.deviationCount ?? 1;
    this.lastDetectedAt = params.lastDetectedAt ?? null;
    this.normalizedAt = params.normalizedAt ?? null;
    this.acknowledgedBy = params.acknowledgedBy ?? null;
    this.acknowledgedAt = params.acknowledgedAt ?? null;
    this.resolvedBy = params.resolvedBy ?? null;
    this.resolvedAt = params.resolvedAt ?? null;
    this.resolutionNotes = params.resolutionNotes ?? null;
    this.relatedActuations = params.relatedActuations ?? [];
  }

  /** Unresolved or being attended. */
  get isOpen(): boolean {
    return this.status !== 'RESOLVED';
  }

  /** The condition returned to normal after the latest deviation, although the alert is still open. */
  get isNormalized(): boolean {
    return this.isOpen && this.normalizedAt !== null;
  }
}
