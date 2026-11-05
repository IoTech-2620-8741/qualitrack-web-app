import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { RawMaterialBatch } from '../../../domain/model/raw-material-batch.entity';

/**
 * Lots of raw material that are close to their expiration date.
 */
@Component({
  selector: 'app-near-expiry-table',
  standalone: true,
  imports: [DecimalPipe, RouterLink, TranslatePipe],
  templateUrl: './near-expiry-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './near-expiry-table.css',
})
export class NearExpiryTable {
  /** Lots to show, one per row. */
  readonly batches = input.required<readonly RawMaterialBatch[]>();

  /** Names of the raw materials by identifier; a material without a name shows its identifier. */
  readonly materialNames = input.required<ReadonlyMap<number, string>>();

  /** Environment of the catalogue, for the links to the materials. */
  readonly environmentId = input.required<number | null>();
}
