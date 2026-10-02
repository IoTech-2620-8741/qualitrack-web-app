import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { ExpirationStatus, RawMaterialBatch } from '../domain/model/raw-material-batch.entity';
import {
  RawMaterialBatchResource,
  RawMaterialBatchesResponse,
  RawMaterialBatchReviewResource,
} from './raw-material-batch-response';
import { RawMaterialBatchAssembler } from './raw-material-batch-assembler';
import {
  ReceiveRawMaterialBatchRequest,
  ReviewRawMaterialBatchRequest,
  ConsumeRawMaterialBatchRequest,
} from './raw-material-batch.request';
import {
  AvailableReceiptResource,
  ReceiptConsumptionResponse,
} from './receipt-consumption-response';
import { AvailableReceipt } from '../domain/model/available-receipt.entity';
import type { RawMaterialBatchConsumption } from '../application/raw-material-batch-consumption.result';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * HTTP client for raw material lots (TS23, TS24, TS25, TS28).
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

  getByMaterial(lab: number, environmentId: number, material: number) {
    return this.http.get<RawMaterialBatchResource[]>(this.batches(lab, environmentId, material)).pipe(
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

  /** Laboratory-wide usable lots kept for product batch consumption (deprecated backend read). */
  getUsable(lab: number, material: number) {
    return this.http
      .get<AvailableReceiptResource[]>(
        `${this.laboratoryInventory(lab)}${environment.inventoryMaterialsEndpointPath}/${material}${environment.inventoryUsableReceiptsEndpointPath}`,
      )
      .pipe(
        map((resources) =>
          resources.map((resource): AvailableReceipt => ({
            id: resource.id,
            rawMaterialId: resource.rawMaterialId,
            batchNumber: resource.batchNumber,
            unit: resource.unit,
            availableAmount: resource.availableAmount,
            expiresOn: resource.expiresOn,
          })),
        ),
        catchError(this.handleError('Failed to load available receipts')),
      );
  }

  /** Atomic consumption for a product batch; moves to product batch raw material usages in a later phase. */
  consume(lab: number, request: ConsumeRawMaterialBatchRequest) {
    return this.http
      .post<ReceiptConsumptionResponse>(
        `${this.laboratoryInventory(lab)}${environment.inventoryConsumptionsEndpointPath}`,
        request,
      )
      .pipe(
        map((resource): RawMaterialBatchConsumption => ({
          rawMaterialBatchId: resource.rawMaterialBatchId,
          productBatchId: resource.productBatchId,
          amountUsed: resource.amountUsed,
          unit: resource.unit,
          stockBefore: resource.stockBefore,
          stockAfter: resource.stockAfter,
          operationId: resource.operationId,
        })),
        catchError(this.handleError('Failed to consume receipt')),
      );
  }

  private environmentRoot(lab: number, environmentId: number) {
    return `${this.endpointUrl}/${lab}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}`;
  }

  private batches(lab: number, environmentId: number, material: number) {
    return `${this.environmentRoot(lab, environmentId)}${environment.inventoryRawMaterialsEndpointPath}/${material}${environment.inventoryRawMaterialBatchesEndpointPath}`;
  }

  private laboratoryInventory(lab: number) {
    return `${this.endpointUrl}/${lab}${environment.inventoryEndpointPath}`;
  }
}
