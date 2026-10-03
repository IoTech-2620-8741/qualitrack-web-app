import { BaseEntity } from '../../../shared/domain/model/base-entity';
import { EnvironmentalState, MonitoredMetric } from './monitored-metric';

/**
 * Action of a container monitor: ventilation, simulated refrigeration or the servo.
 */
export type ActuationAction =
  | 'VENTILATION_ON'
  | 'VENTILATION_OFF'
  | 'COOLING_ON'
  | 'COOLING_OFF'
  | 'SERVO_OPEN'
  | 'SERVO_CLOSE';

/** Actions a rule can start; the others are reported when the device stops them. */
export const ACTIVATIONS: readonly ActuationAction[] = ['VENTILATION_ON', 'COOLING_ON', 'SERVO_OPEN'];

/**
 * Action executed by a container monitor and its result (Actuation Event).
 */
export class ActuationEvent implements BaseEntity {
  id: number;

  deviceId: number;

  environmentId: number;

  action: ActuationAction;

  triggerMetric: MonitoredMetric | null;

  triggerState: EnvironmentalState | null;

  result: 'EXECUTED' | 'FAILED';

  occurredAt: string;

  profileVersion: number | null;

  constructor(params: {
    id: number;
    deviceId: number;
    environmentId: number;
    action: ActuationAction;
    triggerMetric: MonitoredMetric | null;
    triggerState: EnvironmentalState | null;
    result: 'EXECUTED' | 'FAILED';
    occurredAt: string;
    profileVersion: number | null;
  }) {
    this.id = params.id;
    this.deviceId = params.deviceId;
    this.environmentId = params.environmentId;
    this.action = params.action;
    this.triggerMetric = params.triggerMetric;
    this.triggerState = params.triggerState;
    this.result = params.result;
    this.occurredAt = params.occurredAt;
    this.profileVersion = params.profileVersion;
  }
}
