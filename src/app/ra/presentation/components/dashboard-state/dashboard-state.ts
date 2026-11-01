import { Component, input, output } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  imports: [
    MatProgressSpinner,
    MatIcon,
    MatIconButton,
    MatTooltip,
    TranslatePipe
  ],
  selector: 'app-dashboard-state',
  styleUrl: './dashboard-state.css',
  templateUrl: './dashboard-state.html',
})
export class DashboardState {
  readonly state = input.required<string>();
  readonly retry = output<void>();
}
