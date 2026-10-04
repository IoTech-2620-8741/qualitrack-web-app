import { Component, inject, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CaStore } from '../../../application/ca.store';
import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';

/**
 * Table of deviation alerts with their origin, variable, severity and lifecycle (US85).
 */
@Component({
  selector: 'app-alert-table',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, MatIconModule, TranslateModule],
  templateUrl: './alert-table.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class AlertTable {
  readonly alerts = input.required<DeviationAlert[]>();
  /** Translation key shown when there are no alerts. */
  readonly emptyKey = input('ca-alerts.empty');
  protected readonly store = inject(CaStore);
  private readonly translate = inject(TranslateService);

  /** Translated name of a monitored variable, or the stored name when it is not a known metric. */
  protected variable(parameterName: string): string {
    const key = 'tracking.metrics.' + parameterName;
    const label = this.translate.instant(key);
    return label === key ? parameterName : label;
  }
}
