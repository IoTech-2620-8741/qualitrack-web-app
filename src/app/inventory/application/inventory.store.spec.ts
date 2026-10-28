import { TestBed } from '@angular/core/testing';
import { IamStore } from '../../iam/application/iam.store';
import { InventoryApi } from '../infrastructure/inventory-api';
import { RawMaterialBatch, RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';
import { MaterialConsumption } from '../domain/model/material-consumption.entity';
import { InventoryStore } from './inventory.store';

describe('InventoryStore affected batches', () => {
  const receipt = (id: number, status: RawMaterialBatchStatus) => new RawMaterialBatch({
    id, status, laboratoryId: 1, rawMaterialId: 1, supplier: 'Supplier', batchNumber: String(id), unit: 'kg', initialAmount: 20, availableAmount: 10, receivedOn: '2026-10-01', expiresOn: '2027-10-01',
  });
  const usage = (id: number, batchId: number, inventoryReceiptId: number | null) => new MaterialConsumption({
    id, batchId, inventoryReceiptId, quantityUsed: 1, unit: 'kg', usageDate: '2026-10-02',
  });
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    { provide: InventoryApi, useValue: {} },
    { provide: IamStore, useValue: { canManageQuality: () => true, canOperate: () => true } },
  ] }));
  it('warns for observed and rejected receipts and deduplicates production batches', () => {
    const store = TestBed.inject(InventoryStore);
    store.receipts.set([receipt(1, 'OBSERVED'), receipt(2, 'REJECTED'), receipt(3, 'RELEASED')]);
    store.usages.set([usage(1, 8, 1), usage(2, 8, 2), usage(3, 9, 2), usage(4, 10, 3), usage(5, 11, null), usage(6, 12, 99)]);
    expect(store.affectedBatches()).toEqual([8, 9]);
  });
  it('removes the warning when the receipt is released and retains unlinked legacy consumption', () => {
    const store = TestBed.inject(InventoryStore);
    store.usages.set([usage(1, 8, 1), usage(2, 9, null)]);
    store.receipts.set([receipt(1, 'OBSERVED')]);
    expect(store.affectedBatches()).toEqual([8]);
    store.receipts.set([receipt(1, 'RELEASED')]);
    expect(store.affectedBatches()).toEqual([]);
    expect(store.usages().length).toBe(2);
  });
});
