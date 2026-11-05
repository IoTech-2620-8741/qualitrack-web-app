
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

import { InventoryUnit } from '../../../domain/model/raw-material.entity';
import { MAX_STOCK } from '../../../domain/model/stock-limits';

export type RawMaterialMetadataForm = FormGroup<{
  code: FormControl<string>;
  name: FormControl<string>;
  minimumStock: FormControl<number>;
}>;

@Component({
  selector: 'app-raw-material-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './raw-material-form.html',
  styleUrl: './raw-material-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RawMaterialForm {
  readonly form = input.required<RawMaterialMetadataForm>();
  readonly unit = input.required<InventoryUnit>();
  readonly saving = input(false);

  readonly saveRequested = output<void>();
  readonly cancelRequested = output<void>();

  readonly maxStock = MAX_STOCK;
}

