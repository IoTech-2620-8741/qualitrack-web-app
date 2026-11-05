import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { MaterialConsumption } from '../../../domain/model/material-consumption.entity';
import { ConsumingBatch } from '../../../domain/model/consuming-batch.entity';

/**
 * Usages of a raw material from before Inventory in production batches, with its balance when it was recorded.
 */
@Component({
  selector: 'app-legacy-consumption-history-table',
  standalone: true,
  imports: [DecimalPipe, RouterLink, TranslatePipe, DateTimePipe],
  templateUrl: './legacy-consumption-history-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './legacy-consumption-history-table.css',
})
export class LegacyConsumptionHistoryTable {
  /** Usages to show, one per row. */
  readonly consumptions = input.required<readonly MaterialConsumption[]>();

  /** Production batches that consumed the material, to show their number; an unknown batch shows its identifier. */
  readonly batches = input.required<readonly ConsumingBatch[]>();

  /** Number of each production batch by identifier. */
  protected readonly batchNames = computed(
    () => new Map(this.batches().map((batch) => [batch.id, batch.batchNumber])),
  );
}
