import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { BatchStatus } from '../../../domain/model/batch.entity';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Batches of every product of the laboratory, newest first.
 *
 * @remarks
 * Batches are created from their product; this list only helps to find them. Batches registered before
 * environments existed are listed without a link until they are assigned to an environment.
 */
@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatInputModule, MatSelectModule, TranslateModule],
  templateUrl: './batch-list.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchList implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly iam = inject(IamStore);
  protected readonly statuses: BatchStatus[] = ['PENDING', 'IN_PROGRESS', 'RELEASED', 'REJECTED'];
  protected readonly search = signal('');
  protected readonly status = signal<BatchStatus | ''>('');
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    return this.store.batches().filter((batch) =>
      (!this.status() || batch.status === this.status())
      && `${batch.batchNumber} ${batch.productName}`.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.refresh();
  }

  protected refresh(): void {
    this.store.loadBatches(this.iam.requireLaboratoryId());
  }

  protected statusKey(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }
}
