import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { CaStore } from '../../../application/ca.store';
import { AlertSeverity, AlertStatus } from '../../../domain/model/deviation-alert.entity';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { AlertTable } from '../../components/alert-table/alert-table';
import { AlertsPageHeader } from '../../components/alerts-page-header/alerts-page-header';

/**
 * Every alert of an environment, including resolved ones, filtered by status and severity on the server (TS74).
 */
@Component({
  selector: 'app-alert-history',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    EnvironmentSelector,
    AlertTable,
    AlertsPageHeader,
  ],
  templateUrl: './alert-history.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-history.css',
})
export class AlertHistory implements OnInit {
  /** Store that holds the alerts shown by the table. */
  protected readonly store = inject(CaStore);
  /** Environment whose alerts are shown; `null` until one is known. */
  protected readonly environmentId = signal<number | null>(null);
  /** Environment the person asked for, in the address or with the selector; the tabs carry it to the active alerts. */
  protected readonly chosenEnvironmentId = signal<number | null>(null);
  private readonly route = inject(ActivatedRoute);
  /** Statuses the person can filter by. */
  protected readonly statuses: AlertStatus[] = ['UNRESOLVED', 'ACKNOWLEDGED', 'RESOLVED'];
  /** Severities the person can filter by. */
  protected readonly severities: AlertSeverity[] = ['LOW', 'WARNING', 'CRITICAL'];
  /** Status chosen in the filter; an empty string means any status. */
  protected status: AlertStatus | '' = '';
  /** Severity chosen in the filter; an empty string means any severity. */
  protected severity: AlertSeverity | '' = '';

  /**
   * Clears the previous alerts and errors, loads the devices, and shows the alerts of the environment in the address or
   * of the preferred one.
   *
   * @remarks
   * Waits for the environments to load, which can have changed. If the laboratory has none, nothing is loaded.
   */
  async ngOnInit(): Promise<void> {
    this.store.clearError();
    this.store.clearAlerts();
    this.store.loadDevices();
    await this.store.loadEnvironments();
    const requested = Number(this.route.snapshot.queryParamMap.get('environmentId'));
    if (this.store.environments().some((environment) => environment.id === requested)) {
      this.changeEnvironment(requested);
      return;
    }
    const preferred = this.store.preferredEnvironmentId();
    if (preferred !== null) this.show(preferred);
  }

  /**
   * Searches the alerts of another environment and remembers it as the one the person prefers.
   *
   * @param environmentId - The environment chosen
   */
  protected changeEnvironment(environmentId: number): void {
    this.chosenEnvironmentId.set(environmentId);
    this.show(environmentId);
  }

  /**
   * Shows the alerts of an environment and remembers it for the next visit.
   *
   * @param environmentId - The environment
   */
  private show(environmentId: number): void {
    this.store.rememberEnvironment(environmentId);
    this.environmentId.set(environmentId);
    this.search();
  }

  /**
   * Loads the alerts of the chosen environment with the status and severity of the filter.
   *
   * @remarks
   * The filtering is done by the server. Does nothing if no environment is chosen.
   */
  protected search(): void {
    const environmentId = this.environmentId();
    if (environmentId === null) return;
    this.store.loadEnvironmentAlerts(environmentId, {
      status: this.status || undefined,
      severity: this.severity || undefined,
    });
  }

  /** Removes the status and severity filters and searches again. */
  protected clearFilters(): void {
    this.status = '';
    this.severity = '';
    this.search();
  }
}
