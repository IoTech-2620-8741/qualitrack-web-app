import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StatFilterCard } from '../../../../shared/presentation/components/stat-filter-card/stat-filter-card';
import { Batch, BatchStatus } from '../../../domain/model/batch.entity';
import { BATCH_STATUS_CHIPS, BATCH_STATUSES } from '../../batch-chips';
import { countBatches, decisionRate } from '../../batch-filter';

/**
 * One indicator of the batch list.
 */
interface BatchKpi {
  status: BatchStatus;
  icon: string;
  labelKey: string;
  value: number;
  hintKey: string | null;
  hintParams: Record<string, unknown>;
}

/**
 * Indicators of the batch list: every batch and the batches of each status, with the share of released and
 * rejected batches among the closed ones.
 *
 * @remarks
 * Each indicator also filters the list by its status; choosing the active one again shows every status.
 *
 * @example
 * ```html
 * <app-batch-kpi-cards [batches]="batches()" [selected]="status()" (statusSelected)="status.set($event)" />
 * ```
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-kpi-cards',
  standalone: true,
  imports: [StatFilterCard, TranslatePipe],
  templateUrl: './batch-kpi-cards.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './batch-kpi-cards.css',
})
export class BatchKpiCards {
  /** Batches counted by the indicators. */
  readonly batches = input.required<readonly Batch[]>();

  /** Status that filters the list; empty when every status is shown. */
  readonly selected = input<BatchStatus | ''>('');

  /** Emits the status chosen through an indicator; empty to show every status. */
  readonly statusSelected = output<BatchStatus | ''>();

  /** Figures of the indicators. */
  protected readonly counts = computed(() => countBatches(this.batches()));

  /** One indicator per status, in the order of the life cycle. */
  protected readonly kpis = computed<BatchKpi[]>(() => {
    const counts = this.counts();
    const hints: Record<BatchStatus, [string | null, Record<string, unknown>]> = {
      PENDING: ['batches.kpi.pending-hint', {}],
      IN_PROGRESS: ['batches.kpi.in-progress-hint', {}],
      RELEASED: this.rateHint('batches.kpi.release-rate', decisionRate(counts, 'RELEASED')),
      REJECTED: this.rateHint('batches.kpi.rejection-rate', decisionRate(counts, 'REJECTED')),
    };
    return BATCH_STATUSES.map((status) => ({
      status,
      icon: BATCH_STATUS_CHIPS[status].icon,
      labelKey: `batches.kpi.status.${status}`,
      value: counts[status],
      hintKey: hints[status][0],
      hintParams: hints[status][1],
    }));
  });

  /**
   * Shows every status, or only the chosen one; choosing the active status again shows every status.
   *
   * @param status - The status of the indicator, or empty for every batch
   */
  protected choose(status: BatchStatus | ''): void {
    this.statusSelected.emit(status !== '' && this.selected() === status ? '' : status);
  }

  private rateHint(key: string, rate: number | null): [string | null, Record<string, unknown>] {
    return rate === null ? [null, {}] : [key, { rate }];
  }
}
