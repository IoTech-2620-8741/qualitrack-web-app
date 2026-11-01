import { Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { DashboardState } from '../dashboard-state/dashboard-state';

@Component({
  imports: [
    MatIcon,
    MatIconButton,
    RouterLink,
    MatTooltip,
    TranslatePipe,
    DashboardState
  ],
  selector: 'app-dashboard-alerts',
  styleUrl: './dashboard-alerts.css',
  templateUrl: './dashboard-alerts.html',
})
export class DashboardAlerts {
  readonly alertsStatus = input.required<string>();
  readonly openAlerts = input.required<any[]>();

  // Para resolver el nombre del equipo basado en el ID
  readonly equipmentName = input.required<(id: number) => string>();
  readonly formatDate = input.required<(value: string | number, short?: boolean) => string>();

  readonly retry = output<void>();
}
