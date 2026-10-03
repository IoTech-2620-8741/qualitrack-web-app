/**
 * Intent to register a manufacturing batch of the product taken from the route (US73).
 */
export interface CreateBatchCommand {
  /** Traceability code, unique in the laboratory (maximum 50 characters). */
  batchNumber: string;
  /** Quantity to produce, greater than zero. */
  quantity: number;
  /** Production unit. */
  unit: string;
  /** Start date (yyyy-MM-dd). */
  startDate: string;
  /** Optional manufacturing notes. */
  notes?: string;
}
