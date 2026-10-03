import { InventoryUnit } from '../domain/model/raw-material.entity';
import { RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';
export interface ReceiveRawMaterialBatchRequest {
  supplier: string;
  batchNumber: string;
  unit: InventoryUnit;
  amount: number;
  receivedOn: string;
  expiresOn: string;
}
export interface ReviewRawMaterialBatchRequest {
  status: RawMaterialBatchStatus;
  reason: string;
}
