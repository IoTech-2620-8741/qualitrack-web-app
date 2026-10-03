/** Operational status of an equipment (US48). */
export type EquipmentStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'INACTIVE';

export const EQUIPMENT_STATUSES: readonly EquipmentStatus[] = ['OPERATIONAL', 'MAINTENANCE', 'OUT_OF_SERVICE', 'INACTIVE'];

/** Statuses that take the equipment out of normal use and need attention. */
export const ATTENTION_STATUSES: readonly EquipmentStatus[] = ['MAINTENANCE', 'OUT_OF_SERVICE'];
