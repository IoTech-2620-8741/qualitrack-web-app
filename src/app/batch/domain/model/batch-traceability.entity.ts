import { Batch } from './batch.entity';
import { EquipmentUsage, StaffParticipation } from './batch-participation.entity';

/**
 * Raw material lot consumed by a batch, with the environment where the material is kept.
 *
 * @remarks
 * Usages recorded before Inventory Management existed have no lot nor environment.
 */
export interface TracedRawMaterialUsage {
  id: number;
  rawMaterialId: number;
  rawMaterialName: string;
  rawMaterialEnvironmentId: number | null;
  inventoryReceiptId: number | null;
  quantityUsed: number;
  unit: string;
  usageDate: string;
  stockBefore: number | null;
  stockAfter: number | null;
}

/** Signature stored when a batch is released (US81). */
export interface ReleaseEvidence {
  signedByUserId: number;
  signatureHash: string;
  signedAt: string;
}

/** Reason kept when a batch is rejected (US82). */
export interface RejectionEvidence {
  rejectionDate: string;
  reason: string;
}

/**
 * Everything that took part in a product batch (US80): consumed lots, equipment, staff and the final decision.
 */
export interface BatchTraceability {
  batch: Batch;
  product: { id: number; code: string; name: string };
  rawMaterials: TracedRawMaterialUsage[];
  equipment: EquipmentUsage[];
  staff: StaffParticipation[];
  release: ReleaseEvidence | null;
  rejection: RejectionEvidence | null;
}
