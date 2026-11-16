import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RawMaterial } from '../../../domain/model/raw-material.entity';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Raw materials of the catalogue, with a link to the detail of each one and a mark on low usable stock.
 */
@Component({
  selector: 'app-inventory-material-table',
  standalone: true,
  imports: [TablePaginator, DecimalPipe, RouterLink, TranslatePipe, MatIconModule, MatTooltipModule],
  templateUrl: './inventory-material-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './inventory-material-table.css',
})
export class InventoryMaterialTable {
  /** Headers of the two stock columns and what each one counts. */
  protected readonly stockColumns = [
    { label: 'inventory.usableStock', help: 'inventory.usableStockHelp' },
    { label: 'inventory.physicalStock', help: 'inventory.physicalStockHelp' },
  ];

  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly materialPage = paginate(() => this.materials());

  /** Raw materials to show, one per row. */
  readonly materials = input.required<readonly RawMaterial[]>();

  /** Environment of the catalogue, for the links to the materials. */
  readonly environmentId = input.required<number | null>();
}
