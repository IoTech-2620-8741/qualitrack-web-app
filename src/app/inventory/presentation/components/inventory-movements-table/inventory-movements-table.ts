import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryMovement } from '../../../domain/model/inventory-movement.entity';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';

/**
 * Movements of a raw material: what changed its balance, who did it and which production batch it went to.
 */
@Component({
  selector: 'app-inventory-movements-table',
  standalone: true,
  imports: [DecimalPipe, RouterLink, TranslatePipe, DateTimePipe],
  templateUrl: './inventory-movements-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './inventory-movements-table.css',
})
export class InventoryMovementsTable {
  /** Movements to show, one per row. */
  readonly movements = input.required<readonly InventoryMovement[]>();
}
