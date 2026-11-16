import { Component, DestroyRef, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { codeValidator } from '../../../../shared/presentation/validators/code.validator';
import {
  addYears,
  maxDateValidator,
  MIN_DATE,
  minDateValidator,
} from '../../../../shared/presentation/validators/date.validators';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';
import { stockQuantityValidator } from '../../../../shared/presentation/validators/stock-quantity.validator';
import { BatchStore } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchPath } from '../../../domain/model/batch-path';

/**
 * Registers a manufacturing batch of the product taken from the route.
 *
 * @remarks
 * The product is loaded to show its name in the back link. On `/batches/new` the route has no product, so the form
 * also asks for the environment (the last one used, by default) and one of its products. When the batch is
 * registered, the view navigates to its detail.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
    EnvironmentSelector,
  ],
  templateUrl: './batch-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './batch-form.css',
})
export class BatchForm implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly iam = inject(IamStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Earliest start date accepted by the date input.
   */
  protected readonly minDate = MIN_DATE;

  /**
   * Latest start date: a batch can be planned up to one year ahead.
   *
   * @returns The date as yyyy-MM-dd.
   */
  protected get maxDate(): string {
    return addYears(todayInLima(), 1);
  }

  /**
   * Largest quantity the form accepts.
   */
  protected readonly maxQuantity = 999_999_999;

  /**
   * Production units offered by the form.
   */
  protected readonly units = ['units', 'kg', 'g', 'L', 'mL'];

  /**
   * Laboratory, environment and product of the batch, taken from the route.
   */
  protected path!: BatchPath;

  /**
   * True on `/batches/new`, where the environment and the product are chosen in the form.
   */
  protected readonly choosing = !this.route.snapshot.paramMap.get('productId');

  /**
   * Environment chosen on `/batches/new`.
   */
  protected readonly environmentId = signal<number | null>(null);

  /**
   * Product chosen on `/batches/new`, kept apart from the batch form because the route gives it otherwise.
   */
  protected readonly productId = this.fb.control<number | null>(null, Validators.required);

  /**
   * Production unit control, kept apart because the quantity rules depend on it.
   */
  private readonly unit = this.fb.nonNullable.control('units', Validators.required);

  /**
   * Form of the batch: number (a code of up to 50 characters), quantity (from 0.001 to 999999999, whole in units and
   * with up to three decimals otherwise), unit, start date (today by default, from 2020 to one year ahead) and
   * optional notes (up to 500 characters).
   */
  protected readonly form = this.fb.nonNullable.group({
    batchNumber: [
      '',
      [Validators.required, notBlankValidator, codeValidator, Validators.maxLength(50)],
    ],
    quantity: [
      1,
      [
        Validators.required,
        Validators.min(0.001),
        Validators.max(this.maxQuantity),
        (control: AbstractControl) => stockQuantityValidator(this.unit.value)(control),
      ],
    ],
    unit: this.unit,
    startDate: [
      todayInLima(),
      [Validators.required, minDateValidator(), maxDateValidator(() => this.maxDate)],
    ],
    notes: ['', Validators.maxLength(500)],
  });

  constructor() {
    this.unit.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.quantity.updateValueAndValidity());
  }

  /**
   * Lifecycle hook that reads the route parameters and loads the product of the batch.
   */
  ngOnInit(): void {
    this.store.clearMessages();
    if (this.choosing) {
      void this.store.loadEnvironments().then(() => {
        const preferred = this.store.preferredProductionEnvironment();
        if (preferred && this.environmentId() === null) this.chooseEnvironment(preferred.id);
      });
      return;
    }
    const params = this.route.snapshot.paramMap;
    this.path = {
      laboratoryId: this.iam.requireLaboratoryId(),
      environmentId: Number(params.get('environmentId')),
      productId: Number(params.get('productId')),
    };
    void this.store.loadProduct(this.path.environmentId, this.path.productId);
  }

  /**
   * Chooses the environment on `/batches/new` and loads its products.
   *
   * @param environmentId - The environment identifier.
   */
  protected chooseEnvironment(environmentId: number): void {
    this.environmentId.set(environmentId);
    this.productId.reset(null);
    this.store.rememberProductionEnvironment(environmentId);
    void this.store.loadProducts(environmentId);
  }

  /**
   * Where the back link and Cancel lead: the product the batch will belong to, or the list of batches on
   * `/batches/new`.
   *
   * @returns The router link segments.
   */
  protected get productLink(): (string | number)[] {
    if (this.choosing) return ['/batches'];
    return ['/batches/environments', this.path.environmentId, 'products', this.path.productId];
  }

  /**
   * Validates the form, registers the batch and opens its detail.
   */
  protected async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.choosing) this.productId.markAsTouched();
    if (this.form.invalid || (this.choosing && this.productId.invalid)) return;
    const path = this.choosing
      ? { laboratoryId: this.iam.requireLaboratoryId(), environmentId: this.environmentId()!, productId: this.productId.value! }
      : this.path;
    const value = this.form.getRawValue();
    const batch = await this.store.createBatch(path, {
      batchNumber: value.batchNumber.trim(),
      quantity: Number(value.quantity),
      unit: value.unit,
      startDate: value.startDate,
      notes: value.notes.trim() || undefined,
    });
    if (batch?.detailLink) await this.router.navigate(batch.detailLink);
  }
}
