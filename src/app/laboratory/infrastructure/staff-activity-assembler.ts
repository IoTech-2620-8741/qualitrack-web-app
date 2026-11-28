import { StaffActivityEntry } from '../domain/model/staff-activity-entry.entity';
import { StaffActivityEntryResource } from './staff-activity-response';

/** Translates the audit entries of Reporting & Audit into the activity of a staff member owned by Laboratory. */
export class StaffActivityAssembler {
  /**
   * @param resource - Audit entry performed by the staff member
   * @returns The entry as Laboratory lists it
   */
  toEntityFromResource(resource: StaffActivityEntryResource): StaffActivityEntry {
    return new StaffActivityEntry({
      id: resource.id,
      action: resource.action,
      entityType: resource.entityType,
      entityId: resource.entityId,
      timestamp: resource.timestamp,
    });
  }
}
