import { BaseEntity } from '../../../shared/domain/model/base-entity';

/** Lifecycle status of a product batch. */
export type BatchStatus = 'PENDING' | 'IN_PROGRESS' | 'RELEASED' | 'REJECTED';

/**
 * One manufacturing run of a pharmaceutical product (US73).
 *
 * @remarks
 * A batch is addressed through its laboratory, environment and product. Batches registered before
 * environments existed have a null environment and can only be listed.
 */
export class Batch implements BaseEntity {
  id: number;
  labId: number;
  environmentId: number | null;
  productId: number;
  productName: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  status: BatchStatus;
  startDate: string;
  endDate?: string;
  notes?: string;
  /** Container monitor of the container where the batch is stored; null while it has none (US78). */
  containerMonitorId: number | null;

  constructor(params: {
    id: number;
    labId: number;
    environmentId: number | null;
    productId: number;
    productName: string;
    batchNumber: string;
    quantity: number;
    unit: string;
    status: BatchStatus;
    startDate: string;
    endDate?: string;
    notes?: string;
    containerMonitorId?: number | null;
  }) {
    this.id = params.id;
    this.labId = params.labId;
    this.environmentId = params.environmentId;
    this.productId = params.productId;
    this.productName = params.productName;
    this.batchNumber = params.batchNumber;
    this.quantity = params.quantity;
    this.unit = params.unit;
    this.status = params.status;
    this.startDate = params.startDate;
    this.endDate = params.endDate;
    this.notes = params.notes;
    this.containerMonitorId = params.containerMonitorId ?? null;
  }

  /** Pending and in-progress batches still accept consumptions, equipment and staff. */
  get isOpen(): boolean {
    return this.status === 'PENDING' || this.status === 'IN_PROGRESS';
  }

  /** Route of the batch detail, or null when the batch has no environment yet. */
  get detailLink(): (string | number)[] | null {
    return this.environmentId === null
      ? null
      : ['/batches/environments', this.environmentId, 'products', this.productId, 'batches', this.id];
  }
}
