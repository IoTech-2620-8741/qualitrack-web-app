import { of, Subject, throwError } from 'rxjs';
import { LegacyMaterialSnapshot } from '../domain/model/legacy-material-snapshot.entity';
import { ConsumingBatch } from '../domain/model/consuming-batch.entity';
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

describe('InventoryStore legacy detail', () => {
  const material = new LegacyMaterialSnapshot({ id: 3, name: 'Legacy material', code: 'OLD-3', supplier: 'Supplier', batchNumber: 'OLD-LOT', expirationDate: '2026-09-01', quantityInStock: 0, minimumStock: 4, unit: 'kg' });
  const consumption = new MaterialConsumption({ id: 1, batchId: 8, quantityUsed: 4, unit: 'kg', usageDate: '2026-09-01' });
  const api = { legacyMaterialSnapshots: vi.fn(), legacyMaterialConsumptions: vi.fn(), consumingBatches: vi.fn() };
  beforeEach(() => {
    api.legacyMaterialSnapshots.mockReset().mockReturnValue(of([material]));
    api.legacyMaterialConsumptions.mockReset().mockReturnValue(of([consumption]));
    api.consumingBatches.mockReset().mockReturnValue(of([new ConsumingBatch({ id: 8, batchNumber: 'PB-8' })]));
    TestBed.configureTestingModule({ providers: [
      { provide: InventoryApi, useValue: api },
      { provide: IamStore, useValue: { requireLaboratoryId: () => 7, canManageQuality: () => true, canOperate: () => true } },
    ] });
  });
  it('keeps an empty material with historical consumption, labels and unrecorded balances', () => {
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(3);
    expect(store.legacyDetailMaterial()).toBe(material);
    expect(store.legacyDetailConsumptions()).toEqual([consumption]);
    expect(store.legacyDetailHasUnrecordedStock()).toBe(true);
    expect(store.legacyDetailBatchLabel(8)).toBe('PB-8');
    expect(store.legacyDetailBatchLabel(99)).toBe('#99');
    expect(api.legacyMaterialConsumptions).toHaveBeenCalledWith(7, 3);
    expect(store.legacyDetailLoading()).toBe(false);
  });
  it('discards stale responses and clears history when the page is left', () => {
    const stale = new Subject<MaterialConsumption[]>();
    api.legacyMaterialConsumptions.mockReturnValueOnce(stale);
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(3);
    store.clearLegacyDetail(); stale.next([consumption]); stale.complete();
    expect(store.legacyDetailMaterial()).toBeNull();
    expect(store.legacyDetailConsumptions()).toEqual([]);
    expect(store.legacyDetailLoading()).toBe(false);
  });
  it('shows not found for missing historical materials', () => {
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(999);
    expect(store.legacyDetailError()).toBe('material-history.not-found');
    expect(store.legacyDetailMaterial()).toBeNull();
  });
  it('reports load failure instead of showing stale stock', () => {
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(3);
    api.legacyMaterialSnapshots.mockReturnValue(throwError(() => new Error('unavailable')));
    store.loadLegacyDetail(3);
    expect(store.legacyDetailError()).toBe('material-history.load-error');
    expect(store.legacyDetailMaterial()).toBeNull();
    expect(store.legacyDetailLoading()).toBe(false);
  });
  it.each([0, -1, NaN, 1.5])('does not request history for invalid identifiers: %s', (id) => {
    const store = TestBed.inject(InventoryStore); store.loadLegacyDetail(id);
    expect(api.legacyMaterialSnapshots).not.toHaveBeenCalled();
    expect(store.legacyDetailError()).toBe('material-history.not-found');
  });
});
