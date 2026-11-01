import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardState } from '../dashboard-state/dashboard-state';

/**
 * Subscription section of the dashboard.
 * Displays the current plan, billing cycle, and limits.
 */
@Component({
  selector: 'app-dashboard-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, MatIconModule, MatButtonModule, DashboardState],
  templateUrl: './dashboard-subscription.html',
  styleUrl: './dashboard-subscription.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSubscription {
  readonly status = input.required<string>();
  readonly subscription = input.required<any>();
  readonly currentPlan = input.required<any>();
  readonly plansStatus = input.required<string>();
  readonly formatDate = input.required<(value: string | number, short?: boolean) => string>();

  readonly retry = output<void>();
}
