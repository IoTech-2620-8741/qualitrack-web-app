import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Batch } from '../domain/model/batch.entity';
import { BatchTraceability } from '../domain/model/batch-traceability.entity';
import { EquipmentUsage, StaffParticipation } from '../domain/model/batch-participation.entity';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { RawMaterialUsage } from '../domain/model/raw-material-usage.entity';
import { BatchApiEndpoint, BatchPath } from './batch-api-endpoint';
import { ProductApiEndpoint } from './product-api-endpoint';
import { RawMaterialUsageApiEndpoint } from './raw-material-usage-api-endpoint';
import { CreateBatchRequest, RejectBatchRequest, ReleaseBatchRequest } from './batch.request';
import { CreateProductRequest } from './product.request';
import { RegisterRawMaterialUsageRequest } from './raw-material-usage.request';

/**
 * Facade of the Product Batch Management API: products, batches, manufacturing records and traceability.
 */
@Injectable({ providedIn: 'root' })
export class BatchApi extends BaseApi {
  private readonly batchEndpoint: BatchApiEndpoint;
  private readonly productEndpoint: ProductApiEndpoint;
  private readonly usageEndpoint: RawMaterialUsageApiEndpoint;

  constructor(http: HttpClient) {
    super();
    this.batchEndpoint = new BatchApiEndpoint(http);
    this.productEndpoint = new ProductApiEndpoint(http);
    this.usageEndpoint = new RawMaterialUsageApiEndpoint(http);
  }

  getProducts(laboratoryId: number, environmentId: number): Observable<PharmaceuticalProduct[]> {
    return this.productEndpoint.getProducts(laboratoryId, environmentId);
  }

  getProduct(laboratoryId: number, environmentId: number, productId: number): Observable<PharmaceuticalProduct> {
    return this.productEndpoint.getProduct(laboratoryId, environmentId, productId);
  }

  createProduct(laboratoryId: number, environmentId: number, request: CreateProductRequest): Observable<PharmaceuticalProduct> {
    return this.productEndpoint.createProduct(laboratoryId, environmentId, request);
  }

  /** Batches of every product of the laboratory, used by lists and dashboards. */
  getBatches(laboratoryId: number): Observable<Batch[]> {
    return this.batchEndpoint.getLaboratoryBatches(laboratoryId);
  }

  getProductBatches(path: BatchPath): Observable<Batch[]> {
    return this.batchEndpoint.getProductBatches(path);
  }

  getBatch(path: BatchPath, batchId: number): Observable<Batch> {
    return this.batchEndpoint.getBatch(path, batchId);
  }

  createBatch(path: BatchPath, request: CreateBatchRequest): Observable<Batch> {
    return this.batchEndpoint.createBatch(path, request);
  }

  releaseBatch(path: BatchPath, batchId: number, request: ReleaseBatchRequest): Observable<unknown> {
    return this.batchEndpoint.releaseBatch(path, batchId, request);
  }

  rejectBatch(path: BatchPath, batchId: number, request: RejectBatchRequest): Observable<unknown> {
    return this.batchEndpoint.rejectBatch(path, batchId, request);
  }

  registerRawMaterialUsage(path: BatchPath, batchId: number, request: RegisterRawMaterialUsageRequest): Observable<RawMaterialUsage> {
    return this.usageEndpoint.registerUsage(path, batchId, request);
  }

  registerEquipmentUsage(path: BatchPath, batchId: number, equipmentId: number): Observable<EquipmentUsage> {
    return this.batchEndpoint.registerEquipmentUsage(path, batchId, { equipmentId });
  }

  registerStaffParticipation(path: BatchPath, batchId: number, staffId: number): Observable<StaffParticipation> {
    return this.batchEndpoint.registerStaffParticipation(path, batchId, { staffId });
  }

  getTraceability(path: BatchPath, batchId: number): Observable<BatchTraceability> {
    return this.batchEndpoint.getTraceability(path, batchId);
  }

  /** Batches that used a raw material registered before Inventory Management existed. */
  getMaterialHistory(laboratoryId: number, rawMaterialId: number): Observable<RawMaterialUsage[]> {
    return this.usageEndpoint.getUsageByMaterial(laboratoryId, rawMaterialId);
  }

  /** Product batches that consumed lots of an Inventory raw material kept in an environment (TS79). */
  getRawMaterialUsages(laboratoryId: number, environmentId: number, rawMaterialId: number): Observable<RawMaterialUsage[]> {
    return this.usageEndpoint.getUsageByEnvironmentMaterial(laboratoryId, environmentId, rawMaterialId);
  }
}
