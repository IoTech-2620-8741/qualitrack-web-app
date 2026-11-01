import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export interface SummaryCard {
  key: string;
  value: number | undefined;
  state: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  imports: [
    MatIcon,
    RouterLink,
    TranslatePipe
  ],
  selector: 'app-dashboard-summary',
  styleUrl: './dashboard-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-summary.html',
})
export class DashboardSummary {
  readonly cards = input.required<SummaryCard[]>();

}
