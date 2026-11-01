import { Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { DashboardState } from '../dashboard-state/dashboard-state';

@Component({
  imports: [
    MatIcon,
    TranslatePipe,
    MatIconButton,
    RouterLink,
    MatTooltip,
    DashboardState
  ],
  selector: 'app-dashboard-batches',
  styleUrl: './dashboard-batches.css',
  templateUrl: './dashboard-batches.html',
})
export class DashboardBatches {
  readonly batchesStatus = input.required<string>();
  readonly totalBatches = input.required<number>();
  readonly distribution = input.required<any[]>();
  readonly recentBatches = input.required<any[]>();

  readonly retry = output<void>();
}
