
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';
import { StorageContainer } from '../../../domain/model/storage-container.entity';

export type ContainerAssignmentFormGroup = FormGroup<{
  containerMonitorId: FormControl<number | null>;
}>;

@Component({
  selector: 'app-container-assignment-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './container-assignment-form.html',
  styleUrl: './container-assignment-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerAssignmentForm {

  readonly receipt = input.required<RawMaterialBatch>();

  readonly form = input.required<ContainerAssignmentFormGroup>();

  readonly containers = input.required<readonly StorageContainer[]>();

  readonly saving = input(false);

  readonly confirmRequested = output<void>();
  readonly cancelRequested = output<void>();
}

