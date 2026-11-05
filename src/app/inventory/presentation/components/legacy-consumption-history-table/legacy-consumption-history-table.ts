
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { MaterialConsumption } from '../../../domain/model/material-consumption.entity';
import { ConsumingBatch } from '../../../domain/model/consuming-batch.entity';

@Component({
  selector: 'app-legacy-consumption-history-table',
  imports: [DecimalPipe, RouterLink, TranslatePipe, DateTimePipe],
  templateUrl: './legacy-consumption-history-table.html',
  styleUrl: './legacy-consumption-history-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyConsumptionHistoryTable {
  readonly consumptions = input.required<readonly MaterialConsumption[]>();

  readonly batches = input.required<readonly ConsumingBatch[]>();

  readonly batchNames = computed(
    () => new Map(this.batches().map((batch) => [batch.id, batch.batchNumber])),
  );
}

