import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { InventoryUnit } from '../domain/model/raw-material.entity';
import { ExpirationStatus, RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';

export interface RawMaterialBatchResource extends BaseResource {
  id: number;
  laboratoryId: number;
  rawMaterialId: number;
  supplier: string;
  batchNumber: string;
  unit: InventoryUnit;
  initialAmount: number;
  availableAmount: number;
  receivedOn: string;
  expiresOn: string;
  status: RawMaterialBatchStatus;
  usable?: boolean;
  availability?: string;
  expirationStatus?: ExpirationStatus;
  containerMonitorId?: number | null;
}

/** Container where a raw material lot is stored (PUT .../batches/{id}/container-assignment). */
export interface RawMaterialBatchContainerResource {
  rawMaterialBatchId: number;
  containerMonitorId: number;
  containerName: string | null;
  environmentId: number;
  assignedBy: number;
  assignedAt: string;
}

/** Review registered for a raw material lot (POST .../batches/{id}/reviews). */
export interface RawMaterialBatchReviewResource {
  rawMaterialBatchId: number;
  rawMaterialId: number;
  previousStatus: RawMaterialBatchStatus;
  status: RawMaterialBatchStatus;
  reason: string;
  reviewedBy: number;
  reviewedAt: string;
}
export interface RawMaterialBatchesResponse extends BaseResponse {
  rawMaterialBatches: RawMaterialBatchResource[];
}
