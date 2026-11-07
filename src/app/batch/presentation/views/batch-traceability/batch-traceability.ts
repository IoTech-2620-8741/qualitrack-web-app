import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { personLabel } from '../../batch-people';
import { BatchTimeline } from '../../components/batch-timeline/batch-timeline';

/**
 * Consolidated traceability of the selected batch: how it was closed, its timeline, what it consumed and which
 * equipment and staff took part.
 *
 * @remarks
 * It is a read-only view of the traceability kept by {@link BatchStore}; the detail view loads it, together with the
 * staff that names who signed or registered each record.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-traceability',
  standalone: true,
  imports: [BatchTimeline, DateOnlyPipe, DateTimePipe, DecimalPipe, MatIconModule, TranslatePipe],
  templateUrl: './batch-traceability.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './batch-traceability.css',
})
export class BatchTraceabilityView {
  protected readonly store = inject(BatchStore);
  private readonly translate = inject(TranslateService);

  /**
   * Name of the person behind a user account.
   *
   * @param userId - The user account; null when the record has none
   * @returns The full name, "you", the user id or a dash
   */
  protected person(userId: number | null): string {
    return personLabel(this.store, this.translate, userId);
  }
}
