import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { ActuationAction } from './actuation-event.entity';
import { EnvironmentalState, MonitoredMetric } from './monitored-metric';

/**
 * WARNING/CRITICAL limits of a metric. A value inside [normalMin, normalMax] is NORMAL, up to the critical limits
 * WARNING and beyond them CRITICAL; each side is either complete or not configured.
 */
export interface EnvironmentalThreshold {
  metric: MonitoredMetric;
  unit: string;
  normalMin: number | null;
  normalMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
}

/**
 * Condition of the container and the action the container monitor executes.
 */
export interface ActuationRule {
  metric: MonitoredMetric;
  state: Exclude<EnvironmentalState, 'NORMAL'>;
  action: ActuationAction;
}

/**
 * Configuration in force for an environment (through its environmental device) or a container monitor.
 */
export class EnvironmentalProfile implements BaseEntity {
  id: number;

  scope: 'ENVIRONMENT' | 'CONTAINER_MONITOR';

  environmentId: number | null;

  deviceId: number | null;

  /** Configuration version the devices apply; it increases with every change. */
  version: number;

  thresholds: EnvironmentalThreshold[];

  actuationRules: ActuationRule[];

  updatedAt: string | null;

  constructor(params: {
    id: number;
    scope: 'ENVIRONMENT' | 'CONTAINER_MONITOR';
    environmentId: number | null;
    deviceId: number | null;
    version: number;
    thresholds: EnvironmentalThreshold[];
    actuationRules: ActuationRule[];
    updatedAt: string | null;
  }) {
    this.id = params.id;
    this.scope = params.scope;
    this.environmentId = params.environmentId;
    this.deviceId = params.deviceId;
    this.version = params.version;
    this.thresholds = params.thresholds;
    this.actuationRules = params.actuationRules;
    this.updatedAt = params.updatedAt;
  }

  threshold(metric: MonitoredMetric): EnvironmentalThreshold | undefined {
    return this.thresholds.find((threshold) => threshold.metric === metric);
  }
}

/** Thresholds and rules to save, without the values set by the platform. */
export type ThresholdInput = Omit<EnvironmentalThreshold, 'unit'>;
