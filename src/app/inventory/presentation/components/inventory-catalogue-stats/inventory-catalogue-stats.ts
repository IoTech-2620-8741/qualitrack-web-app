import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Displays summary statistics for the raw material catalogue.
 *
 * This component only presents data provided by its parent.
 * Inventory calculations remain in InventoryStore.
 */
@Component({
  selector: 'app-inventory-catalogue-stats',
  imports: [TranslatePipe],
  templateUrl: './inventory-catalogue-stats.html',
  styleUrl: './inventory-catalogue-stats.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryCatalogueStats {
  /** Number of registered raw materials. */
  readonly materialsCount = input.required<number>();

  /** Number of raw materials classified as low stock. */
  readonly lowStockCount = input.required<number>();
}
