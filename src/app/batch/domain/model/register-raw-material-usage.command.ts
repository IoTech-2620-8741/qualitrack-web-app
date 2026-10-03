/**
 * Intent to consume a released raw material lot for a batch (US75).
 *
 * @remarks
 * The operation id makes the request idempotent: a retry with the same id returns the original usage
 * instead of consuming twice.
 */
export interface RegisterRawMaterialUsageCommand {
  rawMaterialBatchId: number;
  amountUsed: number;
  unit: string;
  operationId: string;
}
