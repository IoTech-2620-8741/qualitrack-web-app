import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';

/**
 * Consolidated traceability of the selected batch (US80): what it consumed, which equipment and staff
 * took part and how it was closed.
 */
@Component({
  selector: 'app-batch-traceability',
  standalone: true,
  imports: [DatePipe, DecimalPipe, MatIconModule, TranslateModule],
  templateUrl: './batch-traceability.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchTraceabilityView {
  protected readonly store = inject(BatchStore);
}
