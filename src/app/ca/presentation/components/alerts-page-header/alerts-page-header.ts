import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';

/** Section of the alerts module a page belongs to. */
export type AlertsSection = 'active' | 'history' | 'preferences';

/**
 * Standard heading of the alerts pages: the title with the actions of the page, and the tabs of its sections.
 *
 * @remarks
 * The page projects its actions next to the title and its content with the `alertsSection` attribute. The
 * notification preferences are a section of their own. The environment chosen in a section travels in the links
 * of the tabs as the `environmentId` query parameter.
 */
@Component({
  selector: 'app-alerts-page-header',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatTabsModule, TranslatePipe],
  templateUrl: './alerts-page-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alerts-page-header.css',
})
export class AlertsPageHeader {
  /** Section shown by the page. */
  readonly section = input.required<AlertsSection>();

  /** Open alerts to show on the tab of the active alerts; nothing is shown while it is unknown or zero. */
  readonly activeCount = input<number | null>(null);

  /** Environment chosen in the section, kept when moving to the other one; `null` means every environment. */
  readonly environmentId = input<number | null>(null);

  /** Query parameters that keep the environment when moving between the sections. */
  protected readonly tabQueryParams = computed(() => {
    const environmentId = this.environmentId();
    return environmentId === null ? {} : { environmentId };
  });
}
