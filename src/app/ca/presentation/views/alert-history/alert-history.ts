import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { CaStore } from '../../../application/ca.store';
import { AlertSeverity, AlertStatus } from '../../../domain/model/deviation-alert.entity';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { EnvironmentSelector } from '../../../../laboratory/presentation/components/environment-selector/environment-selector';
import { AlertTable } from '../../components/alert-table/alert-table';

/**
 * Every alert of an environment, including resolved ones, filtered by status and severity on the server (TS74).
 */
@Component({
  selector: 'app-alert-history',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslateModule, MatButtonModule, MatFormFieldModule, MatIconModule,
    MatSelectModule, EnvironmentSelector, AlertTable],
  templateUrl: './alert-history.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class AlertHistory implements OnInit {
  protected readonly store = inject(CaStore);
  protected readonly environments = inject(EnvironmentStore);
  protected readonly environmentId = signal<number | null>(null);
  protected readonly statuses: AlertStatus[] = ['UNRESOLVED', 'ACKNOWLEDGED', 'RESOLVED'];
  protected readonly severities: AlertSeverity[] = ['LOW', 'WARNING', 'CRITICAL'];
  protected status: AlertStatus | '' = '';
  protected severity: AlertSeverity | '' = '';

  async ngOnInit(): Promise<void> {
    this.store.clearError();
    this.store.clearAlerts();
    this.store.loadDevices();
    if (!this.environments.loaded()) await this.environments.loadEnvironments();
    const preferred = this.environments.preferredEnvironment(undefined, 'tracking');
    if (preferred) this.changeEnvironment(preferred.id);
  }

  protected changeEnvironment(environmentId: number): void {
    this.environments.rememberEnvironment(environmentId, 'tracking');
    this.environmentId.set(environmentId);
    this.search();
  }

  protected search(): void {
    const environmentId = this.environmentId();
    if (environmentId === null) return;
    this.store.loadEnvironmentAlerts(environmentId, {
      status: this.status || undefined,
      severity: this.severity || undefined,
    });
  }

  protected clearFilters(): void {
    this.status = '';
    this.severity = '';
    this.search();
  }
}
