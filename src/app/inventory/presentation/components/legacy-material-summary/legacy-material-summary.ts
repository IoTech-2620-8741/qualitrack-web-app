
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';
import { LegacyMaterialSnapshot } from '../../../domain/model/legacy-material-snapshot.entity';

@Component({
  selector: 'app-legacy-material-summary',
  imports: [DecimalPipe, TranslatePipe, DateOnlyPipe],
  templateUrl: './legacy-material-summary.html',
  styleUrl: './legacy-material-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyMaterialSummary {
  readonly material = input.required<LegacyMaterialSnapshot>();
}

