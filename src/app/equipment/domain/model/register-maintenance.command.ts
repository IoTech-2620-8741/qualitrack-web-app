/** Maintenance performed on an equipment located in an environment (US49). */
export interface RegisterMaintenanceCommand {
  /** Date of the intervention (yyyy-MM-dd), not in the future. */
  maintenanceDate: string;
  technicianName: string;
  description: string;
  type: string;
}
