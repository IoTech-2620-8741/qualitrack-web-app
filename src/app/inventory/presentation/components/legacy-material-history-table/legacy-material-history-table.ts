
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MaterialConsumption } from '../../../domain/model/material-consumption.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';

@Component({
  selector: 'app-legacy-material-history-table',
  imports: [DecimalPipe, RouterLink, TranslatePipe, DateTimePipe],
  templateUrl: './legacy-material-history-table.html',
  styleUrl: './legacy-material-history-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyMaterialHistoryTable {
  readonly history = input.required<readonly MaterialConsumption[]>();
}

