import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { BatchApi } from '../infrastructure/batch-api';
import { PharmaceuticalProduct } from '../domain/model/pharmaceutical-product.entity';
import { CreateProductCommand } from '../domain/model/create-product.command';
import { batchError } from './batch.store';

/**
 * Pharmaceutical products of one environment of the current laboratory (US71, US72).
 *
 * @remarks
 * Each product view provides its own instance and sets the environment taken from the route.
 */
@Injectable()
export class ProductStore {
  private readonly api = inject(BatchApi);
  private readonly iam = inject(IamStore);
  private generation = 0;

  readonly environmentId = signal<number | null>(null);
  readonly products = signal<PharmaceuticalProduct[]>([]);
  readonly product = signal<PharmaceuticalProduct | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  /** Products are registered by quality managers and administrators (US71). */
  readonly canManage = this.iam.canManageQuality;

  /** Loads the products of the environment. */
  async load(environmentId: number): Promise<boolean> {
    const generation = ++this.generation;
    this.environmentId.set(environmentId);
    this.loading.set(true);
    this.error.set(null);
    try {
      const products = await firstValueFrom(this.api.getProducts(this.laboratoryId, environmentId));
      if (generation !== this.generation) return false;
      this.products.set(products);
      return true;
    } catch (error) {
      if (generation === this.generation) {
        this.products.set([]);
        this.error.set(batchError(error));
      }
      return false;
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /** Loads one product of the environment. */
  async loadProduct(environmentId: number, productId: number): Promise<void> {
    const generation = ++this.generation;
    this.environmentId.set(environmentId);
    this.product.set(null);
    this.loading.set(true);
    this.error.set(null);
    try {
      const product = await firstValueFrom(this.api.getProduct(this.laboratoryId, environmentId, productId));
      if (generation === this.generation) this.product.set(product);
    } catch (error) {
      if (generation === this.generation) this.error.set(batchError(error));
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  /** Registers a product in the environment and returns it. */
  async create(environmentId: number, command: CreateProductCommand): Promise<PharmaceuticalProduct | null> {
    if (this.saving()) return null;
    this.saving.set(true);
    this.error.set(null);
    try {
      return await firstValueFrom(this.api.createProduct(this.laboratoryId, environmentId, {
        ...command,
        description: command.description?.trim() || null,
      }));
    } catch (error) {
      this.error.set(batchError(error));
      return null;
    } finally {
      this.saving.set(false);
    }
  }

  private get laboratoryId(): number {
    return this.iam.requireLaboratoryId();
  }
}
