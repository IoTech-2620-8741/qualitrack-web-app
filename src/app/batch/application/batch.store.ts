import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ApiError } from '../../shared/infrastructure/api-error';
import { IamStore } from '../../iam/application/iam.store';
import { BatchApi } from '../infrastructure/batch-api';
import { BatchPath } from '../infrastructure/batch-api-endpoint';
import { Batch } from '../domain/model/batch.entity';
import { BatchTraceability } from '../domain/model/batch-traceability.entity';
import { CreateBatchCommand } from '../domain/model/create-batch.command';
import { ReleaseBatchCommand } from '../domain/model/release-batch.command';
import { RejectBatchCommand } from '../domain/model/reject-batch.command';

/**
 * Translates API failures of the product batch views into translation keys or server details.
 *
 * @param error - The failure raised by the API facade
 * @returns A translation key, or the server message when it explains the business rule
 */
export function batchError(error: unknown): string {
  const status = error instanceof ApiError ? error.status : error instanceof HttpErrorResponse ? error.status : null;
  if (status === 0) return 'batches.errors.connection';
  if (status === 403) return 'batches.errors.forbidden';
  if (status === 404) return 'batches.errors.not-found';
  if (error instanceof ApiError) return error.details || error.message;
  if (error instanceof HttpErrorResponse) return error.error?.details || error.error?.message || 'batches.errors.failed';
  return 'batches.errors.failed';
}

/**
 * Application store of product batches (US73-US82).
 *
 * @remarks
 * Batches are addressed through their laboratory, environment and product. The laboratory-wide list
 * feeds the batch list, the dashboard and the report generator; the selected batch keeps its
 * traceability so the detail tabs show consumptions, equipment, staff and the final decision.
 */
@Injectable({ providedIn: 'root' })
export class BatchStore {
  private readonly api = inject(BatchApi);
  private readonly iam = inject(IamStore);

  private readonly _batches = signal<Batch[]>([]);
  private readonly _productBatches = signal<Batch[]>([]);
  private readonly _selectedBatch = signal<Batch | null>(null);
  private readonly _traceability = signal<BatchTraceability | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMsg = signal<string | null>(null);

  readonly batches = this._batches.asReadonly();
  readonly productBatches = this._productBatches.asReadonly();
  readonly selectedBatch = this._selectedBatch.asReadonly();
  readonly traceability = this._traceability.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMsg = this._successMsg.asReadonly();
  /** Releases and rejections are reserved to quality managers and administrators (US81, US82). */
  readonly canDecide = this.iam.canManageQuality;

  /** Loads every batch of the laboratory, newest first. */
  loadBatches(labId: number): void {
    this.startRequest();
    this.api.getBatches(labId).subscribe({
      next: (batches) => {
        this._batches.set([...batches].sort((a, b) => b.id - a.id));
        this._isLoading.set(false);
      },
      error: (error) => this.fail(error),
    });
  }

  /** Loads the batches of one product (TS64). */
  async loadProductBatches(path: BatchPath): Promise<void> {
    this.startRequest();
    this._productBatches.set([]);
    try {
      this._productBatches.set(await firstValueFrom(this.api.getProductBatches(path)));
    } catch (error) {
      this._error.set(batchError(error));
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Loads a batch together with its traceability (US74, US80). */
  async loadBatch(path: BatchPath, batchId: number): Promise<void> {
    this.startRequest();
    this._selectedBatch.set(null);
    this._traceability.set(null);
    try {
      const traceability = await firstValueFrom(this.api.getTraceability(path, batchId));
      this._traceability.set(traceability);
      this._selectedBatch.set(traceability.batch);
    } catch (error) {
      this._error.set(batchError(error));
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Reloads the traceability of the selected batch after a manufacturing record is added. */
  async refreshTraceability(path: BatchPath, batchId: number): Promise<void> {
    try {
      const traceability = await firstValueFrom(this.api.getTraceability(path, batchId));
      this._traceability.set(traceability);
      this._selectedBatch.set(traceability.batch);
    } catch (error) {
      this._error.set(batchError(error));
    }
  }

  /** Registers a pending batch of the product (TS63). */
  async createBatch(path: BatchPath, command: CreateBatchCommand): Promise<Batch | null> {
    return this.write(() => firstValueFrom(this.api.createBatch(path, { ...command, notes: command.notes || undefined })),
      'batch-form.saved');
  }

  /** Releases the batch with the signature of the current user (TS71). */
  async releaseBatch(path: BatchPath, batchId: number, command: ReleaseBatchCommand): Promise<boolean> {
    return (await this.write(() => firstValueFrom(this.api.releaseBatch(path, batchId, command)), 'batch-release.saved')) !== null;
  }

  /** Rejects the batch and keeps the reason (TS72). */
  async rejectBatch(path: BatchPath, batchId: number, command: RejectBatchCommand): Promise<boolean> {
    return (await this.write(() => firstValueFrom(this.api.rejectBatch(path, batchId, command)), 'batch-reject.saved')) !== null;
  }

  /** Associates an operational equipment with the batch (TS66). */
  async registerEquipment(path: BatchPath, batchId: number, equipmentId: number): Promise<boolean> {
    const saved = await this.write(() => firstValueFrom(this.api.registerEquipmentUsage(path, batchId, equipmentId)),
      'batch-participants.equipment-saved');
    if (saved) await this.refreshTraceability(path, batchId);
    return saved !== null;
  }

  /** Associates a staff member with the batch (TS67). */
  async registerStaff(path: BatchPath, batchId: number, staffId: number): Promise<boolean> {
    const saved = await this.write(() => firstValueFrom(this.api.registerStaffParticipation(path, batchId, staffId)),
      'batch-participants.staff-saved');
    if (saved) await this.refreshTraceability(path, batchId);
    return saved !== null;
  }

  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  private async write<T>(request: () => Promise<T>, success: string): Promise<T | null> {
    if (this._saving()) return null;
    this._saving.set(true);
    this.clearMessages();
    try {
      const result = await request();
      this._successMsg.set(success);
      return result ?? ({} as T);
    } catch (error) {
      this._error.set(batchError(error));
      return null;
    } finally {
      this._saving.set(false);
    }
  }

  private startRequest(): void {
    this._isLoading.set(true);
    this._error.set(null);
  }

  private fail(error: unknown): void {
    this._error.set(batchError(error));
    this._isLoading.set(false);
  }
}
