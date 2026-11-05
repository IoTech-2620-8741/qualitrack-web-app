import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { RawMaterial } from '../../../domain/model/raw-material.entity';

@Component({
  selector: 'app-inventory-summary',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './inventory-summary.html',
  styleUrl: './inventory-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventorySummary {
  readonly material = input.required<RawMaterial>();
}
