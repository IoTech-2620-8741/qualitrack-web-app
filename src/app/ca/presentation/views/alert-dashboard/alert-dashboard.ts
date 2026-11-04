import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { interval, map } from 'rxjs';

import { ActionBanner } from '../../../../shared/presentation/components/action-banner/action-banner';
import { EmptyState } from '../../../../shared/presentation/components/empty-state/empty-state';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { ErrorBanner } from '../../../../shared/presentation/components/error-banner/error-banner';
import { StatFilterCard } from '../../../../shared/presentation/components/stat-filter-card/stat-filter-card';
import { RelativeTimePipe } from '../../../../shared/presentation/pipes/relative-time.pipe';
import { CaStore } from '../../../application/ca.store';
import {
  compareAlertsByNewest,
  compareAlertsByPriority,
} from '../../../domain/model/alert-priority';
import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { alertVariableName } from '../../alert-variable';
import { AlertCard } from '../../components/alert-card/alert-card';
import { AlertsPageHeader } from '../../components/alerts-page-header/alerts-page-header';

/** How often the texts that tell how long ago something happened are brought up to date. */
const CLOCK_INTERVAL_MS = 1000;

/** Orders the inbox offers. */
type AlertSortOrder = 'priority' | 'newest' | 'environment';

/** Which alerts the attention filter leaves. */
type AttentionFilter = 'unattended' | 'attending';

/** Removes accents and capitals, so nobody has to type a name exactly as it is stored. */
function searchable(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Prioritized inbox of the open alerts of the laboratory (US85): the most urgent first, across every environment
 * unless the person narrows it to one, so that a critical alert is never hidden behind a selector.
 *
 * @remarks
 * The chosen environment lives in the `environmentId` query parameter; without it, every environment is shown.
 */
@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    TranslatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ActionBanner,
    AlertCard,
    AlertsPageHeader,
    EmptyState,
    EnvironmentSelector,
    ErrorBanner,
    RelativeTimePipe,
    StatFilterCard,
  ],
  templateUrl: './alert-dashboard.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-dashboard.css',
})
export class AlertDashboard implements OnInit {
  /** Store that holds the alerts shown by the inbox. */
  protected readonly store = inject(CaStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  private readonly queryParams = toSignal(this.route.queryParamMap);

  /** Environment chosen, or null for every environment; an unknown one in the address counts as none. */
  protected readonly environmentId = computed(() => {
    const environmentId = Number(this.queryParams()?.get('environmentId'));
    return this.store.environments().some((environment) => environment.id === environmentId)
      ? environmentId
      : null;
  });

  /** Current time, to tell how long ago things happened. */
  protected readonly now = toSignal(interval(CLOCK_INTERVAL_MS).pipe(map(() => new Date())), {
    initialValue: new Date(),
  });

  /** Orders offered by the inbox, with the key of their name. */
  protected readonly sortOrders: readonly {
    order: AlertSortOrder;
    icon: string | null;
    labelKey: string;
  }[] = [
    { order: 'priority', icon: 'priority_high', labelKey: 'ca-alerts.active.sort.priority' },
    { order: 'newest', icon: null, labelKey: 'ca-alerts.active.sort.newest' },
    { order: 'environment', icon: null, labelKey: 'ca-alerts.active.sort.environment' },
  ];

  protected readonly sortOrder = signal<AlertSortOrder>('priority');
  protected readonly criticalOnly = signal(false);
  protected readonly attentionFilter = signal<AttentionFilter | null>(null);
  protected readonly searchTerm = signal('');

  /** Open alerts of the scope: an alert resolved from here is still in the list until the next refresh. */
  private readonly openAlerts = computed(() => this.store.alerts().filter((alert) => alert.isOpen));

  private readonly unattendedAlerts = computed(() =>
    this.openAlerts()
      .filter((alert) => alert.status === 'UNRESOLVED')
      .sort(compareAlertsByPriority),
  );

  private readonly attendingAlerts = computed(() =>
    this.openAlerts().filter((alert) => alert.status === 'ACKNOWLEDGED'),
  );

  /** Whether any filter narrows the list. */
  protected readonly isFiltered = computed(
    () => this.criticalOnly() || this.attentionFilter() !== null || this.searchTerm().trim() !== '',
  );

  /** Alerts of the list, once filtered and ordered. */
  protected readonly visibleAlerts = computed(() => {
    const attentionFilter = this.attentionFilter();
    const term = searchable(this.searchTerm().trim());
    const alerts = this.openAlerts().filter(
      (alert) =>
        (!this.criticalOnly() || alert.severity === 'CRITICAL') &&
        (!attentionFilter ||
          (attentionFilter === 'unattended') === (alert.status === 'UNRESOLVED')) &&
        (!term || this.matchesSearch(alert, term)),
    );
    return alerts.sort(this.comparator());
  });

  /** Oldest of the critical alerts nobody attends, which the banner tells about. */
  protected readonly oldestUnattendedCritical = computed(
    () => this.unattendedAlerts().find((alert) => alert.severity === 'CRITICAL') ?? null,
  );

  protected readonly unattendedCriticalCount = computed(
    () => this.unattendedAlerts().filter((alert) => alert.severity === 'CRITICAL').length,
  );

  /** What the summary cards show. */
  protected readonly stats = computed(() => {
    const open = this.openAlerts();
    const environmentCount = new Set(open.map((alert) => alert.environmentId)).size;
    const warningCount = open.filter((alert) => alert.severity === 'WARNING').length;
    const normalizedCount = this.attendingAlerts().filter((alert) => alert.isNormalized).length;
    return {
      open: open.length,
      environmentCount,
      critical: open.filter((alert) => alert.severity === 'CRITICAL').length,
      warningCount,
      unattended: this.unattendedAlerts().length,
      oldestUnattendedAt:
        [...this.unattendedAlerts()].sort(compareAlertsByNewest).at(-1)?.timestamp ?? null,
      attending: this.attendingAlerts().length,
      normalizedCount,
    };
  });

  /** Names of the environments that could not be read, for the warning that says so. */
  protected readonly unavailableEnvironments = computed(() => {
    const unavailableIds = this.store.unavailableEnvironmentIds();
    return this.store
      .environments()
      .filter((environment) => unavailableIds.includes(environment.id))
      .map((environment) => environment.code)
      .join(', ');
  });

  /** Whether the list can be trusted to be empty because there are no alerts. */
  protected readonly isAllClear = computed(
    () =>
      !this.store.loading() &&
      this.store.environmentsLoaded() &&
      !this.store.unavailableEnvironmentIds().length &&
      !this.openAlerts().length,
  );

  /** How many environments the empty state speaks of. */
  protected readonly scopeEnvironmentCount = computed(() =>
    this.environmentId() === null ? this.store.environments().length : 1,
  );

  constructor() {
    effect(() => {
      const environmentId = this.environmentId();
      if (this.store.environmentsLoaded())
        untracked(() => this.store.loadOpenAlerts(environmentId));
    });
  }

  /**
   * Clears what a previous view left and loads the devices and the environments when needed.
   *
   * @remarks
   * The alerts follow the environment chosen as soon as the environments are known.
   */
  async ngOnInit(): Promise<void> {
    this.store.clearError();
    this.store.clearAlerts();
    this.store.loadDevices();
    if (!this.store.environmentsLoaded()) await this.store.loadEnvironments();
  }

  /**
   * Narrows the inbox to an environment and remembers it as the one the person prefers.
   *
   * @param environmentId - The environment chosen
   */
  protected chooseEnvironment(environmentId: number): void {
    this.store.rememberEnvironment(environmentId);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { environmentId } });
  }

  /** Goes back to every environment; that choice is not remembered, it is what the inbox opens with. */
  protected chooseAllEnvironments(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  /** Reads the alerts again, or the environments if they could not be read. */
  protected refresh(): void {
    if (this.store.environmentsLoaded()) this.store.loadOpenAlerts(this.environmentId());
    else void this.store.loadEnvironments();
  }

  /** Shows every open alert, removing the filters. */
  protected clearFilters(): void {
    this.criticalOnly.set(false);
    this.attentionFilter.set(null);
    this.searchTerm.set('');
  }

  /**
   * Applies a filter of attention, or removes it when it was applied.
   *
   * @param attentionFilter - The filter the person pressed
   */
  protected toggleAttentionFilter(attentionFilter: AttentionFilter): void {
    this.attentionFilter.update((current) =>
      current === attentionFilter ? null : attentionFilter,
    );
  }

  /** Leaves only the critical alerts nobody attends, which is what the banner warns about. */
  protected showUnattendedCritical(): void {
    this.criticalOnly.set(true);
    this.attentionFilter.set('unattended');
  }

  /**
   * Code and name of the environment of an alert.
   *
   * @param alert - The alert
   * @returns The label, or null when the environment is unknown
   */
  protected environmentLabelOf(alert: DeviationAlert): string | null {
    const environment = this.store.environments().find((item) => item.id === alert.environmentId);
    return environment ? `${environment.code} · ${environment.name}` : null;
  }

  /**
   * Name of the device that detected the deviation of an alert.
   *
   * @param alert - The alert
   * @returns The name, or the identifier while it is unknown
   */
  protected deviceLabelOf(alert: DeviationAlert): string {
    return this.store.deviceName(alert.equipmentId) ?? `#${alert.equipmentId}`;
  }

  /**
   * Name of the variable that deviated in an alert.
   *
   * @param alert - The alert
   * @returns The translated name
   */
  protected variableOf(alert: DeviationAlert): string {
    return alertVariableName(this.translate, alert.parameterName);
  }

  private titleOf(alert: DeviationAlert): string {
    return `${this.variableOf(alert)} · ${this.deviceLabelOf(alert)}`;
  }

  private matchesSearch(alert: DeviationAlert, term: string): boolean {
    return searchable(this.titleOf(alert)).includes(term);
  }

  /** How the chosen order compares two alerts. */
  private comparator(): (first: DeviationAlert, second: DeviationAlert) => number {
    switch (this.sortOrder()) {
      case 'newest':
        return compareAlertsByNewest;
      case 'environment':
        return (first, second) =>
          (this.environmentLabelOf(first) ?? '').localeCompare(
            this.environmentLabelOf(second) ?? '',
          ) || compareAlertsByPriority(first, second);
      default:
        return compareAlertsByPriority;
    }
  }
}
