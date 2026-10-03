import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BatchApi } from '../../../infrastructure/batch-api';
import { batchError } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Opens a batch from links that only know its identifier (dashboard, inventory traceability, reports).
 *
 * @remarks
 * Looks the batch up in the laboratory list and navigates to its environment and product path.
 */
@Component({
  selector: 'app-batch-redirect',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslateModule],
  template: `
    <main class="operations-page">
      @if (message(); as key) {
        <p class="notice" role="status">{{ key | translate }}</p>
        <a routerLink="/batches/batch-list">{{ 'batches.title' | translate }}</a>
      } @else {
        <p role="status">{{ 'common.status-loading' | translate }}</p>
      }
    </main>
  `,
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchRedirect implements OnInit {
  private readonly api = inject(BatchApi);
  private readonly iam = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly message = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const batchId = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const batch = (await firstValueFrom(this.api.getBatches(this.iam.requireLaboratoryId()))).find((item) => item.id === batchId);
      if (!batch) this.message.set('batches.errors.not-found');
      else if (!batch.detailLink) this.message.set('batches.no-environment');
      else await this.router.navigate(batch.detailLink, { replaceUrl: true });
    } catch (error) {
      this.message.set(batchError(error));
    }
  }
}
