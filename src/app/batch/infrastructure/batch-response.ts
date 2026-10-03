import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/** Product batch as returned by the API. */
export interface BatchResource extends BaseResource {
  id: number;
  labId: number;
  environmentId: number | null;
  productId: number;
  productName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
}

/** Envelope variant of a batch collection. */
export interface BatchesResponse extends BaseResponse {
  batches: BatchResource[];
}

/** Equipment associated with a batch. */
export interface EquipmentUsageResource {
  id: number;
  batchId: number;
  equipmentId: number;
  equipmentName: string;
  registeredByUserId: number | null;
  registeredAt: string;
}

/** Staff member associated with a batch. */
export interface StaffParticipationResource {
  id: number;
  batchId: number;
  staffId: number;
  staffName: string;
  staffRole: string | null;
  registeredByUserId: number | null;
  registeredAt: string;
}

/** Traceability of a batch. */
export interface BatchTraceabilityResource {
  batch: BatchResource;
  product: { id: number; code: string; name: string };
  rawMaterials: {
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
  }[];
  equipment: EquipmentUsageResource[];
  staff: StaffParticipationResource[];
  release: { signedByUserId: number; signatureHash: string; signedAt: string } | null;
  rejection: { rejectionDate: string; reason: string } | null;
}
