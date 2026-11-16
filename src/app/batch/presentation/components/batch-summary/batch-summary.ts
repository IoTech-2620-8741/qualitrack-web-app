import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';
import { BatchStore } from '../../../application/batch.store';
import { Batch } from '../../../domain/model/batch.entity';

/**
 * Product, environment, quantity and dates of a batch, so the person sees which batch they are working on.
 *
 * @remarks
 * Shown in the detail of the batch and in its release and reject forms. The environment is named once the
 * environments of the laboratory are loaded.
 *
 * @example
 * ```html
 * <app-batch-summary [batch]="batch" [environmentId]="path.environmentId" />
 * ```
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-summary',
  standalone: true,
  imports: [DateOnlyPipe, DecimalPipe, MatIconModule, TranslatePipe],
  template: `
    @let current = batch();
    <!-- On a phone the product and environment names take the whole width -->
    <section class="summary-chips" [attr.aria-label]="'batch-detail.summary' | translate">
      <div class="summary-chip wide">
        <mat-icon aria-hidden="true">medication</mat-icon>
        <span class="label">{{ 'batches.fields.product' | translate }}</span>
        <strong>{{ productName() }}</strong>
      </div>
      @if (environmentName(); as environment) {
        <div class="summary-chip wide">
          <mat-icon aria-hidden="true">meeting_room</mat-icon>
          <span class="label">{{ 'batch-storage.environment' | translate }}</span>
          <strong>{{ environment }}</strong>
        </div>
      }
      <div class="summary-chip">
        <mat-icon aria-hidden="true">scale</mat-icon>
        <span class="label">{{ 'batches.fields.quantity' | translate }}</span>
        <strong>{{ current.quantity | number: '1.0-3' }} {{ current.unit }}</strong>
      </div>
      <div class="summary-chip">
        <mat-icon aria-hidden="true">event</mat-icon>
        <span class="label">{{ 'batches.fields.date' | translate }}</span>
        <strong>{{ current.startDate | dateOnly }}</strong>
      </div>
      @if (current.endDate) {
        <div class="summary-chip">
          <mat-icon aria-hidden="true">event_available</mat-icon>
          <span class="label">{{ 'batch-detail.closed-on' | translate }}</span>
          <strong>{{ current.endDate | dateOnly }}</strong>
        </div>
      }
    </section>
  `,
  styleUrl: './batch-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BatchSummary implements OnInit {
  private readonly store = inject(BatchStore);

  /** The batch to summarise. */
  readonly batch = input.required<Batch>();

  /** Environment of the batch, as the route gives it. */
  readonly environmentId = input.required<number>();

  /** Name of the product, from the traceability when it is loaded. */
  protected readonly productName = computed(
    () => this.store.traceability()?.product?.name ?? this.batch().productName,
  );

  /** Code and name of the environment; null while the environments are not loaded. */
  protected readonly environmentName = computed(() => {
    const environment = this.store.environments().find((item) => item.id === this.environmentId());
    return environment ? `${environment.code} · ${environment.name}` : null;
  });

  /** Loads the environments of the laboratory when no view has loaded them yet. */
  ngOnInit(): void {
    if (!this.store.environmentsLoaded()) void this.store.loadEnvironments();
  }
}
