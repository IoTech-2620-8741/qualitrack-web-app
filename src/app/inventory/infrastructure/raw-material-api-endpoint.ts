import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { RawMaterial, StockStatus } from '../domain/model/raw-material.entity';
import { RawMaterialResource, RawMaterialsResponse } from './raw-material-response';
import { RawMaterialAssembler } from './raw-material-assembler';
import { SaveRawMaterialRequest } from './raw-material.request';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client for raw materials kept in an environment (TS21, TS22, TS27).
 * Maps to /laboratories/{laboratoryId}/environments/{environmentId}/raw-materials.
 */
export class RawMaterialApiEndpoint extends BaseApiEndpoint<
  RawMaterial,
  RawMaterialResource,
  RawMaterialsResponse,
  RawMaterialAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new RawMaterialAssembler());
  }

  getByEnvironment(lab: number, environmentId: number, stockStatus?: StockStatus) {
    const params = stockStatus ? new HttpParams().set('stockStatus', stockStatus) : undefined;
    return this.http.get<RawMaterialResource[]>(this.collection(lab, environmentId), { params }).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to load inventory catalogue')),
    );
  }

  getRawMaterial(lab: number, environmentId: number, id: number) {
    return this.http.get<RawMaterialResource>(`${this.collection(lab, environmentId)}/${id}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to load inventory material')),
    );
  }

  saveMaterial(lab: number, environmentId: number, request: SaveRawMaterialRequest, id?: number) {
    const url = this.collection(lab, environmentId);
    const response = id
      ? this.http.put<RawMaterialResource>(`${url}/${id}`, request)
      : this.http.post<RawMaterialResource>(url, request);
    return response.pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to save inventory material')),
    );
  }

  private collection(lab: number, environmentId: number) {
    return `${this.endpointUrl}/${lab}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.inventoryRawMaterialsEndpointPath}`;
  }
}
