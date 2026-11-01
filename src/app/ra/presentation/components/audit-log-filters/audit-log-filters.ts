import { Component, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  AuditLogQuery,
  buildAuditLogQuery,
  emptyAuditLogFilters,
  isInvalidId,
} from '../../utils/audit-log-viewer.utils';
import {
  calendarDate,
  PERIOD_ERROR_KEYS,
  periodError,
  PeriodError,
} from '../../utils/report-period';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { MIN_DATE } from '../../../../shared/presentation/validators/date.validators';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  imports: [
    MatIcon,
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButton,
    MatIconButton,
    MatInput,
    TranslatePipe,
  ],
  selector: 'app-audit-log-filters',
  styleUrl: './audit-log-filters.css',
  templateUrl: './audit-log-filters.html',
})
export class AuditLogFilters {
  private readonly translate = inject(TranslateService);

  readonly loading = input(false);
  readonly search = output<AuditLogQuery | undefined>();
  readonly clear = output<void>();

  /** Estado interno del formulario. */
  protected filters = emptyAuditLogFilters();

  /** Día mínimo aceptado por el date picker. */
  protected readonly minDate = calendarDate(MIN_DATE);

  /** Día máximo aceptado: hoy en Lima. */
  protected get maxDate(): Date {
    return calendarDate(todayInLima());
  }

  protected get periodProblem(): PeriodError | null {
    return periodError(this.filters.dateFrom, this.filters.dateTo);
  }

  protected periodMessage(error: PeriodError): string {
    return PERIOD_ERROR_KEYS[error];
  }

  protected isInvalidId(value: number | null): boolean {
    return isInvalidId(value);
  }

  protected get filtersValid(): boolean {
    return (
      !this.periodProblem &&
      !isInvalidId(this.filters.equipmentId) &&
      !isInvalidId(this.filters.batchId)
    );
  }

  protected onSearch(): void {
    if (!this.filtersValid) return;
    this.search.emit(buildAuditLogQuery(this.filters));
  }

  protected onClear(): void {
    this.filters = emptyAuditLogFilters();
    this.clear.emit();
  }
}
