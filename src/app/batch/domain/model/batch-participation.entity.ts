/**
 * Equipment used in a product batch (US76). The name is the one it had when it was associated.
 */
export interface EquipmentUsage {
  id: number;
  batchId: number;
  equipmentId: number;
  equipmentName: string;
  registeredByUserId: number | null;
  registeredAt: string;
}

/**
 * Staff member who took part in a product batch (US77). Name and role are the ones registered then.
 */
export interface StaffParticipation {
  id: number;
  batchId: number;
  staffId: number;
  staffName: string;
  staffRole: string | null;
  registeredByUserId: number | null;
  registeredAt: string;
}
