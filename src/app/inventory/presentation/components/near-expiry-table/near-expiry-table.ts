
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';

@Component({
  selector: 'app-near-expiry-table',
  imports: [DecimalPipe, RouterLink, TranslatePipe],
  templateUrl: './near-expiry-table.html',
  styleUrl: './near-expiry-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NearExpiryTable {

  readonly batches = input.required<readonly RawMaterialBatch[]>();

  readonly materialNames = input.required<ReadonlyMap<number, string>>();

  readonly environmentId = input.required<number | null>();
}

