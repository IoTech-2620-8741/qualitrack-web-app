import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { ExpirationStatus, RawMaterialBatch } from '../domain/model/raw-material-batch.entity';
import {
  RawMaterialBatchResource,
  RawMaterialBatchesResponse,
  RawMaterialBatchReviewResource,
  RawMaterialBatchContainerResource,
} from './raw-material-batch-response';
import { RawMaterialBatchAssembler } from './raw-material-batch-assembler';
import {
  AssignRawMaterialBatchContainerRequest,
  ReceiveRawMaterialBatchRequest,
  ReviewRawMaterialBatchRequest,
} from './raw-material-batch.request';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client for raw material lots (TS23, TS24, TS25, TS28, TS29).
 * Maps to /laboratories/{laboratoryId}/environments/{environmentId}/raw-materials/{rawMaterialId}/batches
 * and /laboratories/{laboratoryId}/environments/{environmentId}/raw-material-batches.
 */
export class RawMaterialBatchApiEndpoint extends BaseApiEndpoint<
  RawMaterialBatch,
  RawMaterialBatchResource,
  RawMaterialBatchesResponse,
  RawMaterialBatchAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new RawMaterialBatchAssembler());
  }

  getByMaterial(lab: number, environmentId: number, material: number, usable?: boolean) {
    const params = usable ? new HttpParams().set('usable', true) : undefined;
    return this.http.get<RawMaterialBatchResource[]>(this.batches(lab, environmentId, material), { params }).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError('Failed to load supplier receipts')),
    );
  }

  getByEnvironment(lab: number, environmentId: number, expirationStatus?: ExpirationStatus, withinDays?: number) {
    let params = new HttpParams();
    if (expirationStatus) params = params.set('expirationStatus', expirationStatus);
    if (withinDays !== undefined) params = params.set('withinDays', withinDays);
    return this.http
      .get<RawMaterialBatchResource[]>(
        `${this.environmentRoot(lab, environmentId)}${environment.inventoryEnvironmentRawMaterialBatchesEndpointPath}`,
        { params },
      )
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError('Failed to load raw material lots')),
      );
  }

  receive(lab: number, environmentId: number, material: number, request: ReceiveRawMaterialBatchRequest) {
    return this.http.post<RawMaterialBatchResource>(this.batches(lab, environmentId, material), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register receipt')),
    );
  }

  review(lab: number, environmentId: number, material: number, batch: number, request: ReviewRawMaterialBatchRequest) {
    return this.http
      .post<RawMaterialBatchReviewResource>(
        `${this.batches(lab, environmentId, material)}/${batch}${environment.inventoryRawMaterialBatchReviewsEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError('Failed to review receipt')));
  }

  /** Stores the lot in a container monitor of its environment, replacing the previous one (TS29). */
  assignContainer(lab: number, environmentId: number, material: number, batch: number,
                  request: AssignRawMaterialBatchContainerRequest) {
    return this.http
      .put<RawMaterialBatchContainerResource>(
        `${this.batches(lab, environmentId, material)}/${batch}${environment.inventoryRawMaterialBatchContainerAssignmentEndpointPath}`,
        request,
      )
      .pipe(catchError(this.handleError('Failed to store the lot in the container')));
  }

  private environmentRoot(lab: number, environmentId: number) {
    return `${this.endpointUrl}/${lab}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`;
  }

  private batches(lab: number, environmentId: number, material: number) {
    return `${this.environmentRoot(lab, environmentId)}${environment.inventoryRawMaterialsEndpointPath}/${material}${environment.inventoryRawMaterialBatchesEndpointPath}`;
  }

}
