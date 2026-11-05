import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { BatchStatus } from '../../../domain/model/batch.entity';
import { IamStore } from '../../../../iam/application/iam.store';
import { EmptyState } from '../../../../shared/presentation/components/empty-state/empty-state';
import {
  BatchFilter,
  EMPTY_BATCH_FILTER,
  filterBatches,
  isBatchFilterApplied,
} from '../../batch-filter';
import { BatchFilters, BatchProductOption } from '../../components/batch-filters/batch-filters';
import { BatchKpiCards } from '../../components/batch-kpi-cards/batch-kpi-cards';
import { BatchTable } from '../../components/batch-table/batch-table';

/**
 * Batches of every product of the laboratory, newest first.
 *
 * @remarks
 * Batches are created from their product; this list only helps to find them. The indicators count the batches of
 * each status among those that meet the other criteria, and also filter the list by status. Batches registered
 * before environments existed are listed without a link until they are assigned to an environment.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [
    BatchFilters,
    BatchKpiCards,
    BatchTable,
    EmptyState,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltip,
    TranslatePipe,
  ],
  templateUrl: './batch-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './batch-list.css',
})
export class BatchList implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly iam = inject(IamStore);

  /**
   * Criteria of the list.
   */
  protected readonly filter = signal<BatchFilter>({ ...EMPTY_BATCH_FILTER });

  /**
   * Batches that meet every criterion but the status; the indicators count them.
   */
  protected readonly inContext = computed(() =>
    filterBatches(this.store.batches(), { ...this.filter(), status: '' }),
  );

  /**
   * Batches that meet every criterion.
   */
  protected readonly filtered = computed(() => filterBatches(this.store.batches(), this.filter()));

  /**
   * Whether any criterion hides batches.
   */
  protected readonly filterApplied = computed(() => isBatchFilterApplied(this.filter()));

  /**
   * Environments that have batches, offered by the environment filter.
   */
  protected readonly environments = computed(() => {
    const ids = new Set(this.store.batches().map((batch) => batch.environmentId));
    return this.store.environments().filter((environment) => ids.has(environment.id));
  });

  /**
   * Products that have batches in the chosen environment, offered by the product filter.
   */
  protected readonly products = computed<BatchProductOption[]>(() => {
    const environmentId = this.filter().environmentId;
    const names = new Map<number, string>();
    for (const batch of this.store.batches()) {
      if (environmentId === null || batch.environmentId === environmentId)
        names.set(batch.productId, batch.productName);
    }
    return [...names]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /**
   * Lifecycle hook that loads the batches and the environments of the laboratory.
   */
  ngOnInit(): void {
    this.refresh();
    void this.store.loadEnvironments();
  }

  /**
   * Reloads the batches of the laboratory.
   */
  protected refresh(): void {
    this.store.loadBatches(this.iam.requireLaboratoryId());
  }

  /**
   * Shows only the batches of a status, as chosen through an indicator.
   *
   * @param status - The status, or empty for every status
   */
  protected chooseStatus(status: BatchStatus | ''): void {
    this.filter.update((filter) => ({ ...filter, status }));
  }

  /**
   * Shows every batch again.
   */
  protected clearFilters(): void {
    this.filter.set({ ...EMPTY_BATCH_FILTER });
  }
}
