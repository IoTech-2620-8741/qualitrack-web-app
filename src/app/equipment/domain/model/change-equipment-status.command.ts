import { EquipmentStatus } from './equipment-status';

/** Change of the operational status of an equipment located in an environment (US48). */
export interface ChangeEquipmentStatusCommand {
  status: EquipmentStatus;
  reason: string | null;
}
