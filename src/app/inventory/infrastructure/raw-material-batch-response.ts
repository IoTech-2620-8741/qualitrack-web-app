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
