import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Shared presentational component for empty states.
 *
 * @remarks
 * Reusable across the application to display a generic icon and a translated
 * message when a list or table has no data.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [TranslatePipe, MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <p>{{ messageKey() | translate }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './empty-state.css',
})
export class EmptyState {
  /** Name of the Material icon to display. */
  readonly icon = input('manage_search');

  /** Translation key for the message. */
  readonly messageKey = input.required<string>();
}
