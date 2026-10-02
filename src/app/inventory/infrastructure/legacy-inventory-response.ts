import { BaseResource } from '../../shared/infrastructure/base-response';
export interface LegacyMaterialResource extends BaseResource {
  id: number;
  code: string;
  name: string;
  unit: string;
  balance: number;
  supplier: string;
  batchNumber: string;
  expiresOn: string;
}
/** Request for POST .../environments/{environmentId}/raw-material-imports. */
export interface ImportRawMaterialRequest {
  legacyId: number;
}
