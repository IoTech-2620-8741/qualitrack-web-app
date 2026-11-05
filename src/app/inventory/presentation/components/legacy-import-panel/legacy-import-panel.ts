
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { LegacyMaterial } from '../../../domain/model/legacy-material.entity';

@Component({
  selector: 'app-legacy-import-panel',
  imports: [DecimalPipe, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './legacy-import-panel.html',
  styleUrl: './legacy-import-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyImportPanel {
  // Materias primas pendientes de importar
  readonly materials = input.required<readonly LegacyMaterial[]>();

  // Estado de la operación
  readonly saving = input(false);

  // Solicitud de importación hacia InventoryCatalogue
  readonly importRequested = output<number>();
}

