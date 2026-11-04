import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AlertStatus } from '../../../domain/model/deviation-alert.entity';

/** Steps of the life cycle of an alert, in order. */
const LIFECYCLE_STEPS: readonly AlertStatus[] = ['UNRESOLVED', 'ACKNOWLEDGED', 'RESOLVED'];

/**
 * Shows where an alert is in its life cycle: open, being attended and resolved.
 */
@Component({
  selector: 'app-alert-lifecycle',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <ol class="alert-lifecycle" [attr.aria-label]="'ca-alerts.active.card.lifecycle' | translate">
      @for (step of steps(); track step.status) {
        <li
          [class.reached]="step.reached"
          [class.current]="step.current"
          [attr.aria-current]="step.current ? 'step' : null"
        >
          <span class="dot" aria-hidden="true"></span>
          {{ 'ca-alerts.status.' + step.status.toLowerCase() | translate }}
        </li>
      }
    </ol>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './alert-lifecycle.css',
})
export class AlertLifecycle {
  /** Current step of the alert. */
  readonly status = input.required<AlertStatus>();

  /** Each step, telling whether the alert already got there. */
  protected readonly steps = computed(() => {
    const currentIndex = LIFECYCLE_STEPS.indexOf(this.status());
    return LIFECYCLE_STEPS.map((status, index) => ({
      status,
      reached: index <= currentIndex,
      current: index === currentIndex,
    }));
  });
}
