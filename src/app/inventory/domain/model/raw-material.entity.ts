import { BaseEntity } from '../../../shared/domain/model/base-entity';
export type InventoryUnit = 'kg' | 'g' | 'L' | 'mL' | 'units';

/** Stock classification computed by the server: LOW when usable stock is below the minimum stock (US41). */
export type StockStatus = 'LOW' | 'SUFFICIENT';

/** Domain state, independent from HTTP resources. Stock values are supplied by the server. */
export class RawMaterial implements BaseEntity {
  readonly id: number;
  readonly laboratoryId: number;
  /** Environment where the raw material is kept; null only for records created before environments. */
  readonly environmentId: number | null;
  readonly code: string;
  readonly name: string;
  readonly unit: InventoryUnit;
  readonly minimumStock: number;
  readonly usableStock: number;
  readonly physicalStock: number;
  readonly stockStatus: StockStatus;
  readonly legacyId: number | null;
  constructor(params: {
    id: number;
    laboratoryId: number;
    environmentId: number | null;
    code: string;
    name: string;
    unit: InventoryUnit;
    minimumStock: number;
    usableStock: number;
    physicalStock: number;
    stockStatus: StockStatus;
    legacyId: number | null;
  }) {
    this.id = params.id;
    this.laboratoryId = params.laboratoryId;
    this.environmentId = params.environmentId;
    this.code = params.code;
    this.name = params.name;
    this.unit = params.unit;
    this.minimumStock = params.minimumStock;
    this.usableStock = params.usableStock;
    this.physicalStock = params.physicalStock;
    this.stockStatus = params.stockStatus;
    this.legacyId = params.legacyId;
  }

  /** True when the server classified the material as below its minimum stock. */
  get isLowStock(): boolean {
    return this.stockStatus === 'LOW';
  }
}
