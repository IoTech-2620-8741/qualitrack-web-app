import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { localIsoDate } from '../../../../shared/presentation/local-date';
import { BatchStore } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';

/**
 * Rejects a batch and keeps the reason (US82).
 */
@Component({
  selector: 'app-batch-reject-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatIconModule, MatInputModule, TranslateModule],
  templateUrl: './batch-reject-form.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchRejectForm implements OnInit {
  protected readonly store = inject(BatchStore);
  private readonly iam = inject(IamStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected path!: BatchPath;
  protected batchId = 0;
  protected readonly form = this.fb.nonNullable.group({
    rejectionDate: [localIsoDate(), Validators.required],
    reason: ['', [Validators.required, Validators.minLength(15), Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    this.path = {
      laboratoryId: this.iam.requireLaboratoryId(),
      environmentId: Number(params.get('environmentId')),
      productId: Number(params.get('productId')),
    };
    this.batchId = Number(params.get('batchId'));
    this.store.clearMessages();
  }

  protected get batchLink(): (string | number)[] {
    return ['/batches/environments', this.path.environmentId, 'products', this.path.productId, 'batches', this.batchId];
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (await this.store.rejectBatch(this.path, this.batchId, { rejectionDate: value.rejectionDate, reason: value.reason.trim() })) {
      await this.router.navigate(this.batchLink);
    }
  }
}
