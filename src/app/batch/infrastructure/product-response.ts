import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/** Pharmaceutical product as returned by the API. */
export interface PharmaceuticalProductResource extends BaseResource {
  id: number;
  laboratoryId: number;
  environmentId: number | null;
  code: string;
  name: string;
  description: string | null;
  specifications: string;
  active: boolean;
}

/** Envelope variant of a product collection. */
export interface PharmaceuticalProductsResponse extends BaseResponse {
  products: PharmaceuticalProductResource[];
}
