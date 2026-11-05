
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';
import { StorageContainer } from '../../../domain/model/storage-container.entity';

@Component({
  selector: 'app-raw-material-batches-table',
  standalone: true,
  imports: [DecimalPipe, RouterLink, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './raw-material-batches-table.html',
  styleUrl: './raw-material-batches-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RawMaterialBatchesTable {

  readonly receipts = input.required<readonly RawMaterialBatch[]>();
  readonly containers = input.required<readonly StorageContainer[]>();
  readonly environmentId = input<number | null>(null);

  readonly canOperate = input(false);
  readonly canReview = input(false);
  readonly storesInContainers = input(false);
  readonly saving = input(false);

  readonly storageRequested = output<RawMaterialBatch>();
  readonly reviewRequested = output<RawMaterialBatch>();

  containerName(containerMonitorId: number): string | null {
    return this.containers().find((container) => container.id === containerMonitorId)?.name ?? null;
  }
}

