import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Summary figure that also works as a filter: pressing it narrows what the view shows.
 *
 * @remarks
 * A visual component without domain logic: the hosting view decides what is pressed and what pressing it means. The
 * state reaches assistive technology through `aria-pressed`.
 */
@Component({
  selector: 'app-stat-filter-card',
  standalone: true,
  imports: [MatIconModule, TranslatePipe],
  template: `
    <button
      type="button"
      class="stat-filter-card"
      [class.pressed]="pressed()"
      [attr.aria-pressed]="pressed()"
      (click)="toggled.emit()"
    >
      <span class="label"
        ><mat-icon aria-hidden="true">{{ icon() }}</mat-icon
        >{{ labelKey() | translate }}</span
      >
      <strong class="value">{{ value() }}</strong>
      @if (hintKey(); as hintKey) {
        <span class="hint">{{ hintKey | translate: hintParams() }}</span>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './stat-filter-card.css',
})
export class StatFilterCard {
  /** Name of the Material icon next to the label. */
  readonly icon = input.required<string>();

  /** Translation key of what the figure counts. */
  readonly labelKey = input.required<string>();

  /** The figure. */
  readonly value = input.required<number>();

  /** Translation key of a detail under the figure, if any. */
  readonly hintKey = input<string | null>(null);

  /** Parameters of the detail. */
  readonly hintParams = input<Record<string, unknown>>({});

  /** Whether the filter is applied. */
  readonly pressed = input(false);

  /** Emits when the person presses the card. */
  readonly toggled = output<void>();
}
