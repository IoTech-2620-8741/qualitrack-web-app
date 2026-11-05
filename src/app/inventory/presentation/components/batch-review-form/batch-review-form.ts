import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

import {
  RawMaterialBatch,
  RawMaterialBatchStatus,
} from '../../../domain/model/raw-material-batch.entity';

export type BatchReviewFormGroup = FormGroup<{
  status: FormControl<RawMaterialBatchStatus>;
  reason: FormControl<string>;
}>;

@Component({
  selector: 'app-batch-review-form',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './batch-review-form.html',
  styleUrl: './batch-review-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchReviewForm {

  readonly receipt = input.required<RawMaterialBatch>();

  readonly form = input.required<BatchReviewFormGroup>();

  readonly saving = input(false);

  readonly confirmRequested = output<void>();
  readonly cancelRequested = output<void>();
}
