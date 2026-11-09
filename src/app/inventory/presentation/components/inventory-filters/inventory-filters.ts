import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Filters of the raw material catalogue: a text search and the materials with low usable stock.
 */
@Component({
  selector: 'app-inventory-filters',
  standalone: true,
  imports: [
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './inventory-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './inventory-filters.css',
})
export class InventoryFilters {
  /** Text being searched. */
  readonly search = input.required<string>();

  /** Whether only the materials with low usable stock are shown. */
  readonly lowOnly = input.required<boolean>();

  /** The user changed the text to search. */
  readonly searchChange = output<string>();

  /** The user turned the low stock filter on or off. */
  readonly lowOnlyChange = output<boolean>();
}
