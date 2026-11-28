/** Fields of an audit entry of Reporting & Audit that Laboratory lists as activity of a staff member. */
export interface StaffActivityEntryResource {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  timestamp: string;
}
