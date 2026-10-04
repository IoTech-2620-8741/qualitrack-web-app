import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { Batch } from '../domain/model/batch.entity';
import { BatchContainer, BatchTraceability } from '../domain/model/batch-traceability.entity';
import { EquipmentUsage, StaffParticipation } from '../domain/model/batch-participation.entity';
import {
  BatchContainerResource,
  BatchesResponse,
  BatchResource,
  BatchTraceabilityResource,
  EquipmentUsageResource,
  StaffParticipationResource,
} from './batch-response';
import { BatchAssembler } from './batch-assembler';
import {
  AssignBatchContainerRequest,
  CreateBatchRequest,
  RegisterEquipmentUsageRequest,
  RegisterStaffParticipationRequest,
  RejectBatchRequest,
  ReleaseBatchRequest,
} from './batch.request';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/** Path of a batch inside its laboratory, environment and product. */
export interface BatchPath {
  laboratoryId: number;
  environmentId: number;
  productId: number;
}

/**
 * HTTP client of the product batches of a laboratory.
 *
 * @remarks
 * Batches live under /laboratories/{laboratoryId}/environments/{environmentId}/products/{productId}/batches
 * (TS63-TS72); the laboratory-wide list comes from /laboratories/{laboratoryId}/batches.
 */
export class BatchApiEndpoint extends BaseApiEndpoint<Batch, BatchResource, BatchesResponse, BatchAssembler> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new BatchAssembler());
  }

  getLaboratoryBatches(laboratoryId: number): Observable<Batch[]> {
    return this.http
      .get<BatchResource[]>(`${this.endpointUrl}/${laboratoryId}${environment.productBatchesEndpointPath}`)
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch batches for laboratory ${laboratoryId}`)),
      );
  }

  getProductBatches(path: BatchPath): Observable<Batch[]> {
    return this.http.get<BatchResource[]>(this.collection(path)).pipe(
      map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
      catchError(this.handleError(`Failed to fetch batches of product ${path.productId}`)),
    );
  }

  getBatch(path: BatchPath, batchId: number): Observable<Batch> {
    return this.http.get<BatchResource>(`${this.collection(path)}/${batchId}`).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch batch ${batchId}`)),
    );
  }

  createBatch(path: BatchPath, request: CreateBatchRequest): Observable<Batch> {
    return this.http.post<BatchResource>(this.collection(path), request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to register batch')),
    );
  }

  releaseBatch(path: BatchPath, batchId: number, request: ReleaseBatchRequest): Observable<unknown> {
    return this.http
      .post(`${this.collection(path)}/${batchId}${environment.batchReleasesEndpointPath}`, request)
      .pipe(catchError(this.handleError(`Failed to release batch ${batchId}`)));
  }

  rejectBatch(path: BatchPath, batchId: number, request: RejectBatchRequest): Observable<unknown> {
    return this.http
      .post(`${this.collection(path)}/${batchId}${environment.batchRejectionsEndpointPath}`, request)
      .pipe(catchError(this.handleError(`Failed to reject batch ${batchId}`)));
  }

  registerEquipmentUsage(path: BatchPath, batchId: number, request: RegisterEquipmentUsageRequest): Observable<EquipmentUsage> {
    return this.http
      .post<EquipmentUsageResource>(`${this.collection(path)}/${batchId}${environment.batchEquipmentUsagesEndpointPath}`, request)
      .pipe(catchError(this.handleError('Failed to register equipment usage')));
  }

  registerStaffParticipation(path: BatchPath, batchId: number, request: RegisterStaffParticipationRequest): Observable<StaffParticipation> {
    return this.http
      .post<StaffParticipationResource>(`${this.collection(path)}/${batchId}${environment.batchStaffParticipationsEndpointPath}`, request)
      .pipe(catchError(this.handleError('Failed to register staff participation')));
  }

  getTraceability(path: BatchPath, batchId: number): Observable<BatchTraceability> {
    return this.http
      .get<BatchTraceabilityResource>(`${this.collection(path)}/${batchId}${environment.batchTraceabilityEndpointPath}`)
      .pipe(
        map((resource) => this.assembler.toTraceabilityFromResource(resource)),
        catchError(this.handleError(`Failed to fetch traceability of batch ${batchId}`)),
      );
  }

  /** Stores the batch in a container monitor of a product storage environment (TS68). */
  assignContainer(path: BatchPath, batchId: number, request: AssignBatchContainerRequest): Observable<BatchContainer> {
    return this.http
      .put<BatchContainerResource>(`${this.collection(path)}/${batchId}${environment.batchContainerAssignmentEndpointPath}`, request)
      .pipe(catchError(this.handleError(`Failed to store batch ${batchId} in the container`)));
  }

  private collection(path: BatchPath): string {
    return `${this.endpointUrl}/${path.laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${path.environmentId}`
      + `${environment.productsEndpointPath}/${path.productId}${environment.productBatchesEndpointPath}`;
  }
}
