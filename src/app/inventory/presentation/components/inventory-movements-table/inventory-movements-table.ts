
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { InventoryMovement } from '../../../domain/model/inventory-movement.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';

@Component({
  selector: 'app-inventory-movements-table',
  imports: [DecimalPipe, RouterLink, TranslatePipe, DateTimePipe],
  templateUrl: './inventory-movements-table.html',
  styleUrl: './inventory-movements-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryMovementsTable {
  readonly movements = input.required<readonly InventoryMovement[]>();
}

