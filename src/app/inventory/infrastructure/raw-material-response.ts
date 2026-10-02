import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { InventoryUnit, StockStatus } from '../domain/model/raw-material.entity';

export interface RawMaterialResource extends BaseResource {
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
}
export interface RawMaterialsResponse extends BaseResponse {
  rawMaterials: RawMaterialResource[];
}
