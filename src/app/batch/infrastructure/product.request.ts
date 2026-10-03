/** Body of POST /laboratories/{laboratoryId}/environments/{environmentId}/products (TS61). */
export interface CreateProductRequest {
  code: string;
  name: string;
  description: string | null;
  specifications: string;
}
