import { BaseEntity } from '../../../shared/domain/model/base-entity';

/** CONNECTED when the device communicated within the expected period, otherwise it requires review (US55). */
export type DeviceConnectionStatus = 'CONNECTED' | 'REQUIRES_REVIEW';

/**
 * Whether an environmental device or container monitor is communicating with Edge (US55, TS41).
 *
 * @remarks
 * The platform derives the status from the latest telemetry or heartbeat it received.
 */
export class DeviceConnection implements BaseEntity {
  /** Device (equipment) identifier. */
  id: number;

  connectionStatus: DeviceConnectionStatus;

  /** Moment of the latest communication, or null when the device never communicated. */
  lastCommunicationAt: string | null;

  /** Expected period between communications, in seconds. */
  expectedPeriodSeconds: number;

  constructor(params: {
    id: number;
    connectionStatus: DeviceConnectionStatus;
    lastCommunicationAt: string | null;
    expectedPeriodSeconds: number;
  }) {
    this.id = params.id;
    this.connectionStatus = params.connectionStatus;
    this.lastCommunicationAt = params.lastCommunicationAt;
    this.expectedPeriodSeconds = params.expectedPeriodSeconds;
  }

  get isConnected(): boolean {
    return this.connectionStatus === 'CONNECTED';
  }
}
