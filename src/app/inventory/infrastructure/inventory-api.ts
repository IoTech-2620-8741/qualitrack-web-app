import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { RawMaterialApiEndpoint } from './raw-material-api-endpoint';
import { RawMaterialBatchApiEndpoint } from './raw-material-batch-api-endpoint';
import { InventoryMovementApiEndpoint } from './inventory-movement-api-endpoint';
import { LegacyInventoryApiEndpoint } from './legacy-inventory-api-endpoint';
import { SaveRawMaterialRequest } from './raw-material.request';
import { ReceiveRawMaterialBatchRequest } from './raw-material-batch.request';
import { ExpirationStatus, RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';
import { StockStatus } from '../domain/model/raw-material.entity';

/**
 * Inventory gateway: stores depend on this facade, not on individual HTTP endpoint clients.
 * Raw materials and lots are addressed inside an environment of the laboratory.
 */
@Injectable({ providedIn: 'root' })
export class InventoryApi extends BaseApi {
  private readonly materialEndpoint: RawMaterialApiEndpoint;
  private readonly receiptEndpoint: RawMaterialBatchApiEndpoint;
  private readonly movementEndpoint: InventoryMovementApiEndpoint;
  private readonly legacyEndpoint: LegacyInventoryApiEndpoint;
  constructor(http: HttpClient) {
    super();
    this.materialEndpoint = new RawMaterialApiEndpoint(http);
    this.receiptEndpoint = new RawMaterialBatchApiEndpoint(http);
    this.movementEndpoint = new InventoryMovementApiEndpoint(http);
    this.legacyEndpoint = new LegacyInventoryApiEndpoint(http);
  }
  materials(lab: number, environmentId: number, stockStatus?: StockStatus) {
    return this.materialEndpoint.getByEnvironment(lab, environmentId, stockStatus);
  }
  material(lab: number, environmentId: number, id: number) {
    return this.materialEndpoint.getRawMaterial(lab, environmentId, id);
  }
  save(lab: number, environmentId: number, request: SaveRawMaterialRequest, id?: number) {
    return this.materialEndpoint.saveMaterial(lab, environmentId, request, id);
  }
  /** Lots of a raw material; usable=true keeps only released, unexpired lots with stock. */
  receipts(lab: number, environmentId: number, material: number, usable?: boolean) {
    return this.receiptEndpoint.getByMaterial(lab, environmentId, material, usable);
  }
  environmentReceipts(lab: number, environmentId: number, expirationStatus?: ExpirationStatus, withinDays?: number) {
    return this.receiptEndpoint.getByEnvironment(lab, environmentId, expirationStatus, withinDays);
  }
  receive(lab: number, environmentId: number, material: number, request: ReceiveRawMaterialBatchRequest) {
    return this.receiptEndpoint.receive(lab, environmentId, material, request);
  }
  review(lab: number, environmentId: number, material: number, receipt: number, status: RawMaterialBatchStatus, reason: string) {
    return this.receiptEndpoint.review(lab, environmentId, material, receipt, { status, reason });
  }
  movements(lab: number, environmentId: number, material: number) {
    return this.movementEndpoint.getByMaterial(lab, environmentId, material);
  }
  legacy(lab: number) {
    return this.legacyEndpoint.pending(lab);
  }
  import(lab: number, environmentId: number, legacyId: number) {
    return this.legacyEndpoint.importMaterial(lab, environmentId, legacyId);
  }
  /** Laboratory-wide catalogue used by product batch consumption and the dashboard (deprecated backend read). */
}
