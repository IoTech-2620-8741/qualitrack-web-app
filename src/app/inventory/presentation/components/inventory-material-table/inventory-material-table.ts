import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { RawMaterial } from '../../../domain/model/raw-material.entity';

@Component({
  selector: 'app-inventory-material-table',
  imports: [DecimalPipe, RouterLink, TranslatePipe],
  templateUrl: './inventory-material-table.html',
  styleUrl: './inventory-material-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryMaterialTable {
  // Materias primas recibidas desde InventoryCatalogue
  readonly materials = input.required<readonly RawMaterial[]>();

  // Ambiente al que pertenece el catálogo
  readonly environmentId = input.required<number | null>();
}
