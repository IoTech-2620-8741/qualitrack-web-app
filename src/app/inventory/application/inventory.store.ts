import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../shared/infrastructure/api-error';
import { firstValueFrom, forkJoin, Observable } from 'rxjs';
import { InventoryApi } from '../infrastructure/inventory-api';
import { RawMaterial } from '../domain/model/raw-material.entity';
import { InventoryMovement } from '../domain/model/inventory-movement.entity';
import { LegacyMaterial } from '../domain/model/legacy-material.entity';
import { RawMaterialBatch } from '../domain/model/raw-material-batch.entity';
import { BatchApi } from '../../batch/infrastructure/batch-api';
import { RawMaterialUsage } from '../../batch/domain/model/raw-material-usage.entity';
import { IamStore } from '../../iam/application/iam.store';
import { SaveRawMaterialCommand } from '../domain/model/save-raw-material.command';
import { ReceiveRawMaterialBatchCommand } from '../domain/model/receive-raw-material-batch.command';
import { ReviewRawMaterialBatchCommand } from '../domain/model/review-raw-material-batch.command';

export function inventoryError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'inventory.connectionError';
    if (error.status === 403) return 'inventory.forbidden';
    return error.details || error.message;
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'inventory.connectionError';
    if (error.status === 403) return 'inventory.forbidden';
    return error.error?.details || error.error?.message || 'inventory.error';
  }
  return 'inventory.error';
}

/**
 * Inventory state of one environment of the current laboratory.
 *
 * @remarks
 * Each inventory view provides its own instance and sets the environment taken from the route.
 */
@Injectable()
export class InventoryStore {
  private readonly api = inject(InventoryApi);
  private readonly iam = inject(IamStore);
  private readonly batchApi = inject(BatchApi);
  readonly environmentId = signal<number | null>(null);
  readonly materials = signal<RawMaterial[]>([]);
  readonly lowStockMaterials = signal<RawMaterial[]>([]);
  readonly receipts = signal<RawMaterialBatch[]>([]);
  readonly nearExpiry = signal<RawMaterialBatch[]>([]);
  readonly movements = signal<InventoryMovement[]>([]);
  readonly usages = signal<RawMaterialUsage[]>([]);
  readonly legacy = signal<LegacyMaterial[]>([]);
  readonly legacyHistory = signal<RawMaterialUsage[]>([]);
  readonly legacyError = signal('');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly selectedId = signal<number | null>(null);
  readonly selected = computed(
    () => this.materials().find((material) => material.id === this.selectedId()) ?? null,
  );
  readonly lowCount = computed(() => this.materials().filter((material) => material.isLowStock).length);
  /** Product batches that used lots of this material that are now OBSERVED or REJECTED (US89). */
  readonly affectedBatches = computed(() => {
    const blocked = new Set(
      this.receipts()
        .filter((receipt) => ['OBSERVED', 'REJECTED'].includes(receipt.status))
        .map((receipt) => receipt.id),
    );
    return [
      ...new Set(
        this.usages()
          .filter((usage) => usage.inventoryReceiptId !== null && blocked.has(usage.inventoryReceiptId))
          .map((usage) => usage.batchId),
      ),
    ];
  });
  readonly canReview = this.iam.canManageQuality;
  /** Receipts are registered by operators and quality managers, not auditors. */
  readonly canOperate = this.iam.canOperate;
  private generation = 0;
  get lab(): number {
    return this.iam.requireLaboratoryId();
  }
  private get environment(): number {
    const environmentId = this.environmentId();
    if (environmentId === null) throw new Error('inventory.noEnvironment');
    return environmentId;
  }
  saveMaterial(command: SaveRawMaterialCommand, id?: number) {
    return this.write(this.api.save(this.lab, this.environment, command, id));
  }
  receive(material: number, command: ReceiveRawMaterialBatchCommand) {
    return this.write(this.api.receive(this.lab, this.environment, material, command));
  }
  review(receipt: RawMaterialBatch, command: ReviewRawMaterialBatchCommand) {
    return this.write(
      this.api.review(this.lab, this.environment, receipt.rawMaterialId, receipt.id, command.status, command.reason),
    );
  }
  importMaterial(legacyId: number) {
    return this.write(this.api.import(this.lab, this.environment, legacyId));
  }
  /**
   * Loads the raw materials of an environment and, when given, the detail of one of them.
   *
   * @returns true when the environment answered with its raw materials
   */
  async load(environmentId: number, id: number | null = null): Promise<boolean> {
    const generation = ++this.generation;
    this.environmentId.set(environmentId);
    this.selectedId.set(id);
    this.loading.set(true);
    this.error.set('');
    this.receipts.set([]);
    this.movements.set([]);
    this.usages.set([]);
    this.legacyHistory.set([]);
    this.legacyError.set('');
    let materialsLoaded = false;
    try {
      const materials = await firstValueFrom(this.api.materials(this.lab, environmentId));
      if (generation !== this.generation) return false;
      this.materials.set(materials);
      materialsLoaded = true;
      if (id !== null) {
        if (!materials.some((material) => material.id === id)) throw new Error('inventory.notFound');
        const detail = await firstValueFrom(
          forkJoin({
            receipts: this.api.receipts(this.lab, environmentId, id),
            movements: this.api.movements(this.lab, environmentId, id),
            usages: this.batchApi.getRawMaterialUsages(this.lab, environmentId, id),
          }),
        );
        if (generation !== this.generation) return false;
        this.receipts.set(detail.receipts);
        this.movements.set(detail.movements);
        this.usages.set(detail.usages);
        const legacyId = this.selected()?.legacyId;
        if (legacyId) {
          try {
            const history = await firstValueFrom(this.batchApi.getMaterialHistory(this.lab, legacyId));
            if (generation === this.generation) this.legacyHistory.set(history);
          } catch (error) {
            if (generation === this.generation) this.legacyError.set(inventoryError(error));
          }
        }
      }
    } catch (error) {
      if (generation === this.generation) {
        this.materials.set([]);
        this.error.set(error instanceof Error && error.message.startsWith('inventory.') ? error.message : inventoryError(error));
      }
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
    return materialsLoaded && generation === this.generation;
  }
  /** Loads the materials below their minimum stock using the server classification (TS27). */
  async loadLowStock(): Promise<void> {
    try {
      this.lowStockMaterials.set(await firstValueFrom(this.api.materials(this.lab, this.environment, 'LOW')));
    } catch (error) {
      this.error.set(inventoryError(error));
    }
  }
  /** Loads the lots that expire within the near expiry period (TS28). */
  async loadNearExpiry(withinDays?: number): Promise<void> {
    try {
      this.nearExpiry.set(
        await firstValueFrom(this.api.environmentReceipts(this.lab, this.environment, 'NEAR_EXPIRY', withinDays)),
      );
    } catch (error) {
      this.error.set(inventoryError(error));
    }
  }
  async loadLegacy(): Promise<void> {
    this.error.set('');
    try {
      this.legacy.set(await firstValueFrom(this.api.legacy(this.lab)));
    } catch (error) {
      this.error.set(inventoryError(error));
    }
  }
  private async write(request: Observable<unknown>): Promise<boolean> {
    if (this.saving()) return false;
    this.saving.set(true);
    this.error.set('');
    this.notice.set('');
    try {
      await firstValueFrom(request);
      this.notice.set('inventory.saved');
      await this.load(this.environment, this.selectedId());
      return true;
    } catch (error) {
      this.error.set(inventoryError(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
