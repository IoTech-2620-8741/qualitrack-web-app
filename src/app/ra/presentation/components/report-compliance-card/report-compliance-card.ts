import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { MIN_DATE } from '../../../../shared/presentation/validators/date.validators';
import { calendarDate, MAX_REPORT_DAYS, PERIOD_ERROR_KEYS, PeriodError, periodError } from '../../utils/report-period';

@Component({
  selector: 'app-report-compliance-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, MatCardModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './report-compliance-card.html',
  styleUrl: 'report-compliance-card.css'
})
export class ReportComplianceCard {
  readonly environments = input.required<any[]>();
  readonly allEnvironments = input.required<number>();
  readonly isLoading = input.required<boolean>();

  readonly generate = output<any>();
  readonly clearMessages = output<void>();

  protected form = { environmentId: 0, startDate: null as Date | null, endDate: null as Date | null, format: 'PDF' as 'PDF' | 'CSV' };
  protected readonly minDate = calendarDate(MIN_DATE);
  protected get maxDate() { return calendarDate(todayInLima()); }

  protected get error() { return periodError(this.form.startDate, this.form.endDate, MAX_REPORT_DAYS); }

  protected periodMessage(error: PeriodError): string { return PERIOD_ERROR_KEYS[error]; }

  ngOnInit() { this.form.environmentId = this.allEnvironments(); }

  protected onSubmit() {
    if (!this.form.startDate || !this.form.endDate || this.error) return;
    this.generate.emit({ ...this.form });
  }
}
