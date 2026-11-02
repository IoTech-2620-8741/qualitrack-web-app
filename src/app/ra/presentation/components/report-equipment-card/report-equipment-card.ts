import { Component, input, output } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { calendarDate, MAX_REPORT_DAYS, PERIOD_ERROR_KEYS, PeriodError, periodError } from '../../utils/report-period';
import {MIN_DATE} from '../../../../shared/presentation/validators/date.validators';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';

@Component({
  selector: 'app-report-equipment-card',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, MatCardModule, MatFormFieldModule, MatSelectModule, MatIconModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatTooltipModule],
  templateUrl: './report-equipment-card.html',
  styleUrl: 'report-equipment-card.css'
})
export class ReportEquipmentCard {
  readonly equipmentList = input.required<any[]>();
  readonly loading = input.required<boolean>();
  readonly failed = input.required<boolean>();
  readonly isLoading = input.required<boolean>();

  readonly generate = output<any>();
  readonly reload = output<void>();
  readonly clearMessages = output<void>();

  protected form = { equipmentId: null as number | null, startDate: null as Date | null, endDate: null as Date | null, format: 'PDF' as 'PDF' | 'CSV' };
  protected readonly minDate = calendarDate(MIN_DATE);
  protected get maxDate() { return calendarDate(todayInLima()); }

  protected get error() { return periodError(this.form.startDate, this.form.endDate, MAX_REPORT_DAYS); }

  protected periodMessage(error: PeriodError): string { return PERIOD_ERROR_KEYS[error]; }

  protected reloadEquipment() {
    this.form.equipmentId = null;
    this.reload.emit();
  }

  protected onSubmit() {
    if (!this.form.equipmentId || !this.form.startDate || !this.form.endDate || this.error) return;
    this.generate.emit({ ...this.form });
  }
}
