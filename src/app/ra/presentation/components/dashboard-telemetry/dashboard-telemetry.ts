import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

import { DashboardState } from '../dashboard-state/dashboard-state';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Telemetry section of the dashboard.
 * Displays device and series selectors, the latest reading, and the Chart.js line graph.
 */
@Component({
  selector: 'app-dashboard-telemetry',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    BaseChartDirective,
    DashboardState,
    MatTooltip
  ],
  templateUrl: './dashboard-telemetry.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTelemetry {
  // --- Inputs de Estado ---
  readonly equipmentStatus = input.required<string>();
  readonly devices = input.required<any[]>();
  readonly selectedDeviceId = input.required<number | null>();
  readonly series = input.required<any[]>();
  readonly activeSeries = input.required<any>();
  readonly measurementsStatus = input.required<string>();
  readonly latestReading = input.required<any>();
  readonly readings = input.required<any[]>();
  readonly readingRange = input.required<any>();

  // --- Inputs de Datos del Gráfico ---
  readonly chartData = input.required<ChartData<'line'>>();
  readonly chartOptions = input.required<ChartOptions<'line'>>();

  // --- Inputs de Utilidades ---
  readonly formatDate = input.required<(value: string | number, short?: boolean) => string>();

  // --- Outputs de Eventos ---
  readonly deviceChange = output<number>();
  readonly seriesChange = output<string>();
  readonly retry = output<void>();
}
