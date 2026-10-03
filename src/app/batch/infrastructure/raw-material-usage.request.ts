/** Body of POST .../batches/{batchId}/raw-material-usages (TS65). */
export interface RegisterRawMaterialUsageRequest {
  rawMaterialBatchId: number;
  amountUsed: number;
  unit: string;
  operationId: string;
}
