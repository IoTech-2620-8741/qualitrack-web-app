
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

import { InventoryUnit } from '../../../domain/model/raw-material.entity';
import { MAX_STOCK } from '../../../domain/model/stock-limits';

export type ReceiveBatchFormGroup = FormGroup<{
  supplier: FormControl<string>;
  batchNumber: FormControl<string>;
  amount: FormControl<number>;
  receivedOn: FormControl<string>;
  expiresOn: FormControl<string>;
}>;

@Component({
  selector: 'app-receive-batch-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './receive-batch-form.html',
  styleUrl: './receive-batch-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiveBatchForm {
  // Formulario administrado por InventoryDetail
  readonly form = input.required<ReceiveBatchFormGroup>();

  // Unidad de medida de la materia prima
  readonly unit = input.required<InventoryUnit>();

  // Límites de fechas definidos por la vista padre
  readonly minDate = input.required<string>();
  readonly maxReceiptDate = input.required<string>();
  readonly maxExpiryDate = input.required<string>();

  // Estado de la operación
  readonly saving = input(false);

  // Eventos enviados a InventoryDetail
  readonly saveRequested = output<void>();
  readonly cancelRequested = output<void>();

  readonly maxStock = MAX_STOCK;
}

