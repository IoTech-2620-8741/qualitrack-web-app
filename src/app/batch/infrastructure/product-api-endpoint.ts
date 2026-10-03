import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { PharmaceuticalProductResource, PharmaceuticalProductsResponse } from './product-response';
import { ProductAssembler } from './product-assembler';
import { CreateProductRequest } from './product.request';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client of the pharmaceutical products of an environment (TS61, TS62).
 */
export class ProductApiEndpoint extends BaseApiEndpoint<
  PharmaceuticalProduct,
  PharmaceuticalProductResource,
  PharmaceuticalProductsResponse,
  ProductAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new ProductAssembler());
  }

  getProducts(laboratoryId: number, environmentId: number): Observable<PharmaceuticalProduct[]> {
    return this.http.get<PharmaceuticalProductResource[]>(this.collection(laboratoryId, environmentId)).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError(`Failed to fetch products of environment ${environmentId}`)),
    );
  }

  getProduct(laboratoryId: number, environmentId: number, productId: number): Observable<PharmaceuticalProduct> {
    return this.http.get<PharmaceuticalProductResource>(`${this.collection(laboratoryId, environmentId)}/${productId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch product ${productId}`)),
    );
  }

  createProduct(laboratoryId: number, environmentId: number, request: CreateProductRequest): Observable<PharmaceuticalProduct> {
    return this.http.post<PharmaceuticalProductResource>(this.collection(laboratoryId, environmentId), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register pharmaceutical product')),
    );
  }

  private collection(laboratoryId: number, environmentId: number): string {
    return `${this.endpointUrl}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.productsEndpointPath}`;
  }
}
