/** Body of POST .../environments/{environmentId}/equipments/{equipmentId}/maintenance-records (TS35). */
export interface RegisterMaintenanceRequest {
  maintenanceDate: string;
  technicianStaffId: number;
  description: string;
  type: string;
}
