import { BaseEntity } from '../../../shared/domain/model/base-entity';

/**
 * One record a staff member registered with their account, as Laboratory lists it in their detail,
 * translated from the audit log of Reporting & Audit.
 */
export class StaffActivityEntry implements BaseEntity {
  /** Identifier of the audit entry. */
  id: number;
  /** What the person did, such as `REGISTER` or `RELEASE`. */
  action: string;
  /** Type of record, such as `BATCH` or `EQUIPMENT`. */
  entityType: string;
  /** Identifier of the record. */
  entityId: number;
  /** When it happened (ISO-8601). */
  timestamp: string;

  constructor(params: {
    id: number;
    action: string;
    entityType: string;
    entityId: number;
    timestamp: string;
  }) {
    this.id = params.id;
    this.action = params.action;
    this.entityType = params.entityType;
    this.entityId = params.entityId;
    this.timestamp = params.timestamp;
  }
}
