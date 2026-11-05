
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-inventory-filters',
  imports: [
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './inventory-filters.html',
  styleUrl: './inventory-filters.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryFilters {

  readonly search = input.required<string>();
  readonly lowOnly = input.required<boolean>();

  readonly searchChange = output<string>();
  readonly lowOnlyChange = output<boolean>();
}

