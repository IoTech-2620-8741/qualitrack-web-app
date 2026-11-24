import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * Limits of one metric in the environmental profile that monitors an IoT device.
 *
 * @remarks
 * Inside `[normalMin, normalMax]` a reading is normal, up to the critical limits it is a warning and beyond them it is
 * critical. A side without limits is `null`, as the minimums of a metric limited only from above.
 */
export interface MonitoringThreshold {
  /** Metric the limits apply to, such as `TEMPERATURE`. */
  metric: string;

  /** Unit of the metric set by the platform, such as `°C`; empty when the API omits it. */
  unit: string;

  normalMin: number | null;

  normalMax: number | null;

  criticalMin: number | null;

  criticalMax: number | null;
}

/**
 * Environmental profile that monitors an IoT device, as Equipment Management shows it.
 *
 * @remarks
 * Tracking owns and edits the profile; Equipment Management only reads its current version, so the detail of a device
 * shows the limits that classify its readings and raise its alerts (Customer/Supplier relation Tracking → Equipment).
 */
export class MonitoringProfile implements BaseEntity {
  id: number;

  /** Version of the profile; every change in Tracking creates a new one. */
  version: number;

  /** When the current version was saved, or `null` when the API does not say. */
  updatedAt: string | null;

  thresholds: MonitoringThreshold[];

  constructor(params: { id: number; version: number; updatedAt: string | null; thresholds: MonitoringThreshold[] }) {
    this.id = params.id;
    this.version = params.version;
    this.updatedAt = params.updatedAt;
    this.thresholds = params.thresholds;
  }
}
