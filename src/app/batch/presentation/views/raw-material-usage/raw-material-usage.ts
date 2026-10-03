import { Component, OnInit, effect, inject, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { RawMaterialConsumptionStore } from '../../../application/raw-material-consumption.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';
import { TracedRawMaterialUsage } from '../../../domain/model/batch-traceability.entity';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';
import { stockQuantityValidator } from '../../../../shared/presentation/validators/stock-quantity.validator';

/**
 * Raw material lots consumed by a batch (US75), with the consumption form while the batch is open.
 */
@Component({
  selector: 'app-raw-material-usage',
  standalone: true,
  providers: [RawMaterialConsumptionStore],
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    EnvironmentSelector,
  ],
  templateUrl: './raw-material-usage.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class RawMaterialUsageComponent implements OnInit {
  readonly path = input.required<BatchPath>();
  readonly batchId = input.required<number>();
  readonly open = input(false);
  protected readonly store = inject(BatchStore);
  protected readonly consumption = inject(RawMaterialConsumptionStore);
  private readonly environments = inject(EnvironmentStore);
  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group({
    rawMaterialId: [null as number | null, Validators.required],
    lotId: [null as number | null, Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0.001)]],
  });

  constructor() {
    this.form.controls.rawMaterialId.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => {
      this.form.controls.lotId.reset();
      void this.consumption.selectMaterial(id);
    });
    this.form.controls.lotId.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => this.consumption.lotId.set(id));
    effect(() => {
      const lot = this.consumption.selectedLot();
      this.form.controls.amount.setValidators([
        Validators.required,
        Validators.min(0.001),
        Validators.max(lot?.availableAmount ?? 0),
        stockQuantityValidator(lot?.unit ?? ''),
      ]);
      this.form.controls.amount.updateValueAndValidity({ emitEvent: false });
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.open()) return;
    if (!this.environments.loaded()) await this.environments.loadEnvironments();
    const storage = this.environments.preferredEnvironment('RAW_MATERIAL_STORAGE');
    if (storage) await this.changeEnvironment(storage.id);
  }

  protected async changeEnvironment(environmentId: number): Promise<void> {
    this.form.reset();
    await this.consumption.selectEnvironment(environmentId);
  }

  protected async consume(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const saved = await this.consumption.consume(this.path(), this.batchId(), Number(this.form.controls.amount.value));
    // The lot list was refreshed: keep the selection only while the lot is still usable.
    this.form.controls.lotId.setValue(this.consumption.lotId(), { emitEvent: false });
    if (saved) {
      this.form.controls.amount.reset();
      await this.store.refreshTraceability(this.path(), this.batchId());
    }
  }

  /** Link to the raw material: Inventory detail for lots, legacy detail for pre-Inventory usages. */
  protected materialLink(usage: TracedRawMaterialUsage): (string | number)[] | null {
    if (usage.inventoryReceiptId === null) return ['/laboratories/raw-materials', usage.rawMaterialId];
    return usage.rawMaterialEnvironmentId === null
      ? null
      : ['/inventory/environments', usage.rawMaterialEnvironmentId, 'raw-materials', usage.rawMaterialId];
  }
}
