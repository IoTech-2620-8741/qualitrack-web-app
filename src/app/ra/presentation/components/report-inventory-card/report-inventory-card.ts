import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-report-inventory-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, MatCardModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatButtonModule],
  templateUrl: './report-inventory-card.html',
  styleUrl: 'report-inventory-card.css'
})
export class ReportInventoryCard {
  readonly environments = input.required<any[]>();
  readonly allEnvironments = input.required<number>();
  readonly isLoading = input.required<boolean>();

  readonly generate = output<{ environmentId: number; format: 'PDF' | 'CSV' }>();
  readonly clearMessages = output<void>();

  protected form = { environmentId: 0, format: 'PDF' as 'PDF' | 'CSV' };

  ngOnInit() {
    this.form.environmentId = this.allEnvironments();
  }

  protected onSubmit() {
    this.generate.emit({ ...this.form });
  }
}
