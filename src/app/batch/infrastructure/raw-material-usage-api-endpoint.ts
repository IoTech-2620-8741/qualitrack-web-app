import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { RawMaterialUsage } from '../domain/model/raw-material-usage.entity';
import { RawMaterialUsageResource, RawMaterialUsagesResponse } from './raw-material-usage-response';
import { RawMaterialUsageAssembler } from './raw-material-usage-assembler';
import { RegisterRawMaterialUsageRequest } from './raw-material-usage.request';
import { BatchPath } from './batch-api-endpoint';

const usageEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;
/**
 * HTTP endpoint client for raw material usage and traceability operations.
 *
 * @remarks
 * In a Domain-Driven Design (DDD) architecture, this endpoint encapsulates all HTTP
 * communication related to the consumption and linking of raw materials within the
 * manufacturing bounded context. It extends {@link BaseApiEndpoint} to inherit
 * standard infrastructure behaviors for API interaction.
 *
 * The endpoint handles:
 * - POST .../products/{productId}/batches/{batchId}/raw-material-usages - Consume a raw material lot (TS65).
 * - GET .../environments/{environmentId}/raw-materials/{rawMaterialId}/usages - Batches that used a material (TS79).
 * - GET /raw-materials/{legacyRawMaterialId}/usages - History of a pre-Inventory raw material.
 *
 * Data transformation is delegated to {@link RawMaterialUsageAssembler}, ensuring the
 * application layer remains decoupled from API-specific resource shapes.
 *
 * @author Qualitrack
 */
export class RawMaterialUsageApiEndpoint extends BaseApiEndpoint<
  RawMaterialUsage,
  RawMaterialUsageResource,
  RawMaterialUsagesResponse,
  RawMaterialUsageAssembler
> {
  /**
   * Creates an instance of RawMaterialUsageApiEndpoint.
   *
   * @param http - Angular HttpClient for making HTTP requests.
   *
   * @remarks
   * Initializes the endpoint with the specific URL for material usage and
   * the assembler required to convert between domain entities and infrastructure resources.
   */
  constructor(http: HttpClient) {
    super(http, usageEndpointUrl, new RawMaterialUsageAssembler());
  }

  /**
   * Retrieves the product batches that consumed lots of an Inventory raw material (TS79, US89).
   *
   * @param laboratoryId - The laboratory that owns the environment.
   * @param environmentId - The environment where the raw material is kept.
   * @param rawMaterialId - The Inventory raw material identifier.
   * @returns An Observable emitting the usages, newest first.
   */
  getUsageByEnvironmentMaterial(laboratoryId: number, environmentId: number, rawMaterialId: number): Observable<RawMaterialUsage[]> {
    return this.http
      .get<RawMaterialUsageResource[]>(
        `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}/${laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${environmentId}${environment.inventoryRawMaterialsEndpointPath}/${rawMaterialId}${environment.inventoryRawMaterialUsagesEndpointPath}`,
      )
      .pipe(
        map((resources) => resources.map((resource) => this.assembler.toEntityFromResource(resource))),
        catchError(this.handleError(`Failed to fetch usages of raw material ${rawMaterialId}`)),
      );
  }

  /**
   * Retrieves the batches that used a raw material registered before Inventory Management existed.
   *
   * @param rawMaterialId - The legacy raw material identifier.
   * @returns An Observable emitting the usages of the material.
   */
  getUsageByMaterial(rawMaterialId: number): Observable<RawMaterialUsage[]> {
    return this.http.get<RawMaterialUsageResource[]>(`${environment.serverBasePath}/raw-materials/${rawMaterialId}/usages`)
      .pipe(map(resources => resources.map(resource => this.assembler.toEntityFromResource(resource))));
  }


  /**
   * Consumes a released raw material lot for a product batch and returns the recorded usage (TS65).
   *
   * @param path - Laboratory, environment and product of the batch.
   * @param batchId - The product batch.
   * @param request - Lot, amount, unit and idempotency key.
   */
  registerUsage(path: BatchPath, batchId: number, request: RegisterRawMaterialUsageRequest): Observable<RawMaterialUsage> {
    return this.http
      .post<RawMaterialUsageResource>(
        `${this.endpointUrl}/${path.laboratoryId}${environment.laboratoryEnvironmentsEndpointPath}/${path.environmentId}`
          + `${environment.productsEndpointPath}/${path.productId}${environment.productBatchesEndpointPath}/${batchId}`
          + environment.batchRawMaterialUsagesEndpointPath,
        request,
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError(`Failed to register raw material usage for batch ${batchId}`)),
      );
  }
}
