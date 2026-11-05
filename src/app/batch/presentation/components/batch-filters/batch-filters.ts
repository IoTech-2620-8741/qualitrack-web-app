import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import {
  EnvironmentOption,
  EnvironmentSelector,
} from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { BATCH_STATUS_CHIPS, BATCH_STATUSES } from '../../batch-chips';
import { BatchFilter, isBatchFilterApplied } from '../../batch-filter';

/**
 * Product offered by the product filter.
 */
export interface BatchProductOption {
  id: number;
  name: string;
}

/**
 * Criteria of the batch list: text, status, environment, product and start days.
 *
 * @remarks
 * It keeps no state: every change is emitted as the whole new criteria, and the view decides what to show.
 * Choosing another environment clears the product, because products belong to an environment.
 *
 * @example
 * ```html
 * <app-batch-filters
 *   [filter]="filter()"
 *   [environments]="environments()"
 *   [products]="products()"
 *   (filterChange)="filter.set($event)"
 *   (cleared)="clearFilters()"
 * />
 * ```
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-filters',
  standalone: true,
  imports: [
    EnvironmentSelector,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './batch-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './batch-filters.css',
})
export class BatchFilters {
  /** Current criteria. */
  readonly filter = input.required<BatchFilter>();

  /** Environments offered by the environment filter. */
  readonly environments = input<readonly EnvironmentOption[]>([]);

  /** Products offered by the product filter. */
  readonly products = input<readonly BatchProductOption[]>([]);

  /** Emits the new criteria after any change. */
  readonly filterChange = output<BatchFilter>();

  /** Asks to show every batch again. */
  readonly cleared = output<void>();

  /** Statuses offered by the status filter. */
  protected readonly statuses = BATCH_STATUSES;

  /** Label of each status. */
  protected readonly chips = BATCH_STATUS_CHIPS;

  /** Whether any criterion hides batches. */
  protected readonly applied = computed(() => isBatchFilterApplied(this.filter()));

  /**
   * Emits the criteria with some values changed.
   *
   * @param changes - The criteria that change
   */
  protected patch(changes: Partial<BatchFilter>): void {
    this.filterChange.emit({ ...this.filter(), ...changes });
  }

  /**
   * Emits a new first or last start day.
   *
   * @param bound - `from` for the first day, `to` for the last one
   * @param value - The `yyyy-MM-dd` value of the date input; empty to remove the bound
   */
  protected chooseDay(bound: 'from' | 'to', value: string): void {
    this.patch({ [bound]: value || null });
  }
}
