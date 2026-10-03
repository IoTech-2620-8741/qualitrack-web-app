import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { InventoryApi } from '../../inventory/infrastructure/inventory-api';
import { RawMaterial } from '../../inventory/domain/model/raw-material.entity';
import { RawMaterialBatch } from '../../inventory/domain/model/raw-material-batch.entity';
import { BatchApi } from '../infrastructure/batch-api';
import { BatchPath } from '../infrastructure/batch-api-endpoint';
import { batchError } from './batch.store';

/**
 * Consumption of raw material lots by a product batch (US75).
 *
 * @remarks
 * The user picks the environment where the raw material is kept, the material and one of its usable lots;
 * Product Batch Management asks Inventory to consume it. A retry of the same consumption reuses its
 * operation id, so the stock is never discounted twice.
 */
@Injectable()
export class RawMaterialConsumptionStore {
  private readonly inventory = inject(InventoryApi);
  private readonly batches = inject(BatchApi);
  private readonly iam = inject(IamStore);
  private generation = 0;
  private attempt?: { signature: string; key: string };

  readonly environmentId = signal<number | null>(null);
  readonly materials = signal<RawMaterial[]>([]);
  readonly lots = signal<RawMaterialBatch[]>([]);
  readonly lotId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saved = signal(false);
  readonly selectedLot = computed(() => this.lots().find((lot) => lot.id === this.lotId()) ?? null);

  /** Loads the raw materials kept in the environment. */
  async selectEnvironment(environmentId: number): Promise<void> {
    const generation = ++this.generation;
    this.environmentId.set(environmentId);
    this.materials.set([]);
    this.lots.set([]);
    this.lotId.set(null);
    this.error.set(null);
    this.loading.set(true);
    try {
      const materials = await firstValueFrom(this.inventory.materials(this.laboratoryId, environmentId));
      if (generation === this.generation) this.materials.set(materials);
    } catch (error) {
      if (generation === this.generation) this.error.set(batchError(error));
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /** Loads the usable lots of a raw material: released, not expired and with stock. */
  async selectMaterial(materialId: number | null): Promise<void> {
    const generation = ++this.generation;
    const environmentId = this.environmentId();
    this.lots.set([]);
    this.lotId.set(null);
    this.error.set(null);
    if (materialId === null || environmentId === null) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    try {
      const lots = await firstValueFrom(this.inventory.receipts(this.laboratoryId, environmentId, materialId, true));
      if (generation === this.generation) this.lots.set(lots);
    } catch (error) {
      if (generation === this.generation) this.error.set(batchError(error));
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /** Consumes the amount from the selected lot for the batch (TS65). */
  async consume(path: BatchPath, batchId: number, amount: number): Promise<boolean> {
    const lot = this.selectedLot();
    if (!lot || this.saving()) return false;
    const signature = JSON.stringify([batchId, lot.id, amount, lot.unit]);
    if (this.attempt?.signature !== signature) this.attempt = { signature, key: crypto.randomUUID() };
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    try {
      await firstValueFrom(this.batches.registerRawMaterialUsage(path, batchId, {
        rawMaterialBatchId: lot.id,
        amountUsed: amount,
        unit: lot.unit,
        operationId: this.attempt.key,
      }));
      this.attempt = undefined;
      await this.refreshStock(lot.rawMaterialId, lot.id);
      this.saved.set(true);
      return true;
    } catch (error) {
      // The stock may have changed meanwhile: show the current lots before explaining the failure.
      await this.refreshStock(lot.rawMaterialId, lot.id);
      this.error.set(batchError(error));
      return false;
    } finally {
      this.saving.set(false);
    }
  }


  /** Reloads materials and usable lots after a consumption, keeping the lot selected while it is still usable. */
  private async refreshStock(materialId: number, lotId: number): Promise<void> {
    const environmentId = this.environmentId();
    if (environmentId === null) return;
    try {
      const [materials, lots] = await Promise.all([
        firstValueFrom(this.inventory.materials(this.laboratoryId, environmentId)),
        firstValueFrom(this.inventory.receipts(this.laboratoryId, environmentId, materialId, true)),
      ]);
      this.materials.set(materials);
      this.lots.set(lots);
      this.lotId.set(lots.some((lot) => lot.id === lotId) ? lotId : null);
    } catch (error) {
      this.error.set(batchError(error));
    }
  }

  private get laboratoryId(): number {
    return this.iam.requireLaboratoryId();
  }
}
