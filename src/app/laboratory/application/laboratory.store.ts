import { Injectable, computed, signal } from '@angular/core';
import { retry } from 'rxjs';

import { LaboratoryApi } from '../infrastructure/laboratory-api';

import { Laboratory } from '../domain/model/laboratory.entity';
import { StaffMember } from '../domain/model/staff-member.entity';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';

import { CreateLaboratoryCommand } from '../domain/model/create-laboratory.command';
import { UpdateLaboratoryCommand } from '../domain/model/update-laboratory.command';
import { RegisterStaffCommand } from '../domain/model/register-staff.command';
import { CreateProductCommand } from '../domain/model/create-product.command';

/**
 * Application store for managing Laboratory bounded context state.
 *
 * @remarks
 * This store coordinates the presentation layer with the Laboratory API facade.
 * It exposes readonly Angular signals for laboratory profile data, staff,
 * pharmaceutical products, raw materials, loading state, and user-facing messages.
 */
@Injectable({ providedIn: 'root' })
export class LaboratoryStore {
  /**
   * Internal signal containing the currently loaded laboratory profile.
   */
  private readonly _laboratory = signal<Laboratory | null>(null);

  /**
   * Internal signal containing staff members for the current laboratory.
   */
  private readonly _staffList = signal<StaffMember[]>([]);

  /**
   * Internal signal containing pharmaceutical products for the current laboratory.
   */
  private readonly _products = signal<PharmaceuticalProduct[]>([]);

  /**
   * Internal signal indicating whether an API operation is running.
   */
  private readonly _isLoading = signal<boolean>(false);

  /**
   * Internal signal containing the latest error message, if any.
   */
  private readonly _error = signal<string | null>(null);

  /**
   * Internal signal containing the latest success message, if any.
   */
  private readonly _successMsg = signal<string | null>(null);

  /**
   * Readonly signal exposing the currently loaded laboratory profile.
   */
  readonly laboratory = this._laboratory.asReadonly();

  /**
   * Readonly signal exposing staff members.
   */
  readonly staffList = this._staffList.asReadonly();

  /**
   * Readonly signal exposing pharmaceutical products.
   */
  readonly products = this._products.asReadonly();

  /**
   * Readonly signal exposing loading state.
   */
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Readonly signal exposing the latest error message.
   */
  readonly error = this._error.asReadonly();

  /**
   * Readonly signal exposing the latest success message.
   */
  readonly successMsg = this._successMsg.asReadonly();

  /**
   * Computed signal exposing only active staff members.
   */
  readonly activeStaff = computed(() => this._staffList().filter((staff) => staff.active));

  /**
   * Creates a new LaboratoryStore.
   *
   * @param api - Laboratory API facade used for HTTP operations
   */
  constructor(private readonly api: LaboratoryApi) {}

  /**
   * Creates a new laboratory and stores the created profile.
   *
   * @param command - Command containing laboratory registration data
   */
  createLaboratory(command: CreateLaboratoryCommand, onCreated?: (laboratory: Laboratory) => void): void {
    this.startOperation();

    this.api
      .createLaboratory(command)
      .subscribe({
        next: (laboratory: Laboratory) => {
          this._laboratory.set(laboratory);
          this._successMsg.set('Laboratory created successfully');
          this.finishOperation();
          onCreated?.(laboratory);
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to create laboratory');
        },
      });
  }

  /**
   * Loads a laboratory profile by its numeric identifier.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   */
  loadLaboratory(laboratoryId: number): void {
    this.startOperation();

    this.api
      .getLaboratory(laboratoryId)
      .pipe(retry(2))
      .subscribe({
        next: (laboratory: Laboratory) => {
          this._laboratory.set(laboratory);
          this.finishOperation();
        },
        error: (error: unknown) => {
          this.failOperation(error, `Failed to fetch laboratory ${laboratoryId}`);
        },
      });
  }

  /**
   * Updates mutable laboratory profile information.
   *
   * @param laboratoryId - Numeric identifier of the laboratory to update
   * @param command - Command containing updated laboratory data
   */
  updateLaboratory(laboratoryId: number, command: UpdateLaboratoryCommand): void {
    this.startOperation();

    this.api
      .updateLaboratory(laboratoryId, command)
      .pipe(retry(2))
      .subscribe({
        next: (laboratory: Laboratory) => {
          this._laboratory.set(laboratory);
          this._successMsg.set('Laboratory updated successfully');
          this.finishOperation();
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to update laboratory');
        },
      });
  }

  /**
   * Loads staff members associated with a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   */
  loadStaff(laboratoryId: number): void {
    this.startOperation();

    this.api
      .getStaff(laboratoryId)
      .pipe(retry(2))
      .subscribe({
        next: (staff: StaffMember[]) => {
          this._staffList.set(staff);
          this.finishOperation();
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to load staff');
        },
      });
  }

  /**
   * Registers a new staff member under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param command - Command containing staff registration data
   */
  registerStaff(laboratoryId: number, command: RegisterStaffCommand): void {
    this.startOperation();

    this.api
      .registerStaff(laboratoryId, { ...command, laboratoryId })
      .pipe(retry(2))
      .subscribe({
        next: () => {
          this._successMsg.set('Staff member registered successfully');
          this.finishOperation();
          this.loadStaff(laboratoryId);
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to register staff');
        },
      });
  }

  /**
   * Deactivates an existing staff member.
   *
   * @param laboratoryId - Numeric identifier of the laboratory used to update local state
   * @param staffId - Numeric identifier of the staff member to deactivate
   */
  deactivateStaff(laboratoryId: number, staffId: number): void {
    this.startOperation();

    this.api
      .deactivateStaff(staffId)
      .pipe(retry(2))
      .subscribe({
        next: () => {
          this._staffList.update((staffList) =>
            staffList.map((staff) => (staff.id === staffId ? { ...staff, active: false } : staff)),
          );
          this._successMsg.set('Staff member deactivated successfully');
          this.finishOperation();
          this.loadStaff(laboratoryId);
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to deactivate staff');
        },
      });
  }

  /**
   * Loads pharmaceutical products registered under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   */
  loadProducts(laboratoryId: number): void {
    this.startOperation();

    this.api
      .getProducts(laboratoryId)
      .pipe(retry(2))
      .subscribe({
        next: (products: PharmaceuticalProduct[]) => {
          this._products.set(products);
          this.finishOperation();
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to load products');
        },
      });
  }

  /**
   * Creates a new pharmaceutical product under a laboratory.
   *
   * @param laboratoryId - Numeric identifier of the laboratory
   * @param command - Command containing product creation data
   */
  createProduct(laboratoryId: number, command: CreateProductCommand): void {
    this.startOperation();

    this.api
      .createProduct(laboratoryId, { ...command, laboratoryId })
      .pipe(retry(2))
      .subscribe({
        next: () => {
          this._successMsg.set('Product created successfully');
          this.finishOperation();
          this.loadProducts(laboratoryId);
        },
        error: (error: unknown) => {
          this.failOperation(error, 'Failed to create product');
        },
      });
  }

  /**
   * Clears active user-facing messages from the store.
   */
  clearMessages(): void {
    this._error.set(null);
    this._successMsg.set(null);
  }

  /**
   * Initializes operation state before an API call.
   */
  private startOperation(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._successMsg.set(null);
  }

  /**
   * Marks the current operation as finished.
   */
  private finishOperation(): void {
    this._isLoading.set(false);
  }

  /**
   * Stores a formatted error message and marks the operation as finished.
   *
   * @param error - Error value emitted by the failed operation
   * @param fallback - Fallback message used when the error cannot be parsed
   */
  private failOperation(error: unknown, fallback: string): void {
    this._error.set(this.formatError(error, fallback));
    this._isLoading.set(false);
  }

  /**
   * Converts an unknown error value into a user-facing message.
   *
   * @param error - Error value emitted by an API call
   * @param fallback - Default message used when no specific error is available
   * @returns Formatted error message
   */
  private formatError(error: unknown, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not Found`
        : error.message;
    }

    return fallback;
  }
}
