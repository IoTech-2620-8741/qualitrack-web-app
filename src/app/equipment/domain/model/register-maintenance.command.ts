/** Maintenance performed on an equipment located in an environment (US49). */
export interface RegisterMaintenanceCommand {
  /** Date of the intervention (yyyy-MM-dd), not in the future. */
  maintenanceDate: string;
  /** Staff member who performed it, chosen from the staff list; operators can only choose themselves. */
  technicianStaffId: number;
  description: string;
  type: string;
}
