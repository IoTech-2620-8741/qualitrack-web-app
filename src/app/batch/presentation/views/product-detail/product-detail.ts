import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ProductStore } from '../../../application/product.store';
import { BatchStore } from '../../../application/batch.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * A pharmaceutical product and its manufacturing batches (US72, US74).
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  providers: [ProductStore],
  imports: [DatePipe, DecimalPipe, RouterLink, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './product-detail.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class ProductDetail implements OnInit {
  protected readonly products = inject(ProductStore);
  protected readonly batches = inject(BatchStore);
  private readonly iam = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  protected environmentId = 0;
  protected productId = 0;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.environmentId = Number(params.get('environmentId'));
      this.productId = Number(params.get('productId'));
      void this.products.loadProduct(this.environmentId, this.productId);
      void this.batches.loadProductBatches({
        laboratoryId: this.iam.requireLaboratoryId(),
        environmentId: this.environmentId,
        productId: this.productId,
      });
    });
  }

  protected batchLink(batch: number | 'new'): (string | number)[] {
    return ['/batches/environments', this.environmentId, 'products', this.productId, 'batches', batch];
  }

  protected statusKey(status: string): string {
    return status.toLowerCase().replace(/_/g, '-');
  }
}
