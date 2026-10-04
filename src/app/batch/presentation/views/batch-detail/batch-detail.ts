import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';
import { RawMaterialUsageComponent } from '../raw-material-usage/raw-material-usage';
import { BatchParticipants } from '../batch-participants/batch-participants';
import { BatchTraceabilityView } from '../batch-traceability/batch-traceability';
import { BatchStorage } from '../batch-storage/batch-storage';

/**
 * Detail of a product batch (US74): its data, the raw materials it consumed (US75), the equipment and
 * staff that took part (US76, US77), the container where it is stored (US78, US79), its traceability (US80) and
 * the release or rejection (US81, US82).
 */
@Component({
  selector: 'app-batch-detail',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    RawMaterialUsageComponent,
    BatchParticipants,
    BatchTraceabilityView,
    BatchStorage,
  ],
  templateUrl: './batch-detail.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchDetail implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly iam = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  protected path: BatchPath | null = null;
  protected batchId = 0;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.path = {
        laboratoryId: this.iam.requireLaboratoryId(),
        environmentId: Number(params.get('environmentId')),
        productId: Number(params.get('productId')),
      };
      this.batchId = Number(params.get('batchId'));
      this.store.clearMessages();
      void this.store.loadBatch(this.path, this.batchId);
    });
  }

  protected get productLink(): (string | number)[] {
    return ['/batches/environments', this.path?.environmentId ?? 0, 'products', this.path?.productId ?? 0];
  }

  protected decisionLink(batchId: number, decision: 'release' | 'reject'): (string | number)[] {
    return [...this.productLink, 'batches', batchId, decision];
  }

  protected statusKey(status?: string): string {
    return status ? status.toLowerCase().replace(/_/g, '-') : 'unknown';
  }
}
