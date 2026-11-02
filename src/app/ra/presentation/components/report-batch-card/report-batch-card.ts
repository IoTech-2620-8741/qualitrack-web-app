import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-report-batch-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, MatCardModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatButtonModule, MatCheckboxModule, MatTooltipModule],
  templateUrl: './report-batch-card.html',
  styleUrl: 'report-batch-card.css'
})
export class ReportBatchCard {
  readonly batches = input.required<any[]>();
  readonly loading = input.required<boolean>();
  readonly failed = input.required<boolean>();
  readonly isLoading = input.required<boolean>();

  readonly generate = output<any>();
  readonly reload = output<void>();
  readonly clearMessages = output<void>();

  protected form = { batchId: null as number | null, includeDeviations: true, format: 'PDF' as 'PDF' | 'CSV' };

  protected reloadBatches() {
    this.form.batchId = null;
    this.reload.emit();
  }

  protected onSubmit() {
    if (!this.form.batchId) return;
    this.generate.emit({ ...this.form });
  }
}
