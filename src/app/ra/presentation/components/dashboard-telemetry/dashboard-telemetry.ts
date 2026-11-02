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

import { DashboardState } from '../../../../shared/presentation/components/dashboard-state/dashboard-state';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Telemetry section of the dashboard.
 *
 * @remarks
 * Displays selectors for device and parameter, the latest reading, and a Chart.js line graph.
 * It is a pure `OnPush` component that receives all data and chart configurations from its parent.
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
  styleUrl: './dashboard-telemetry.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTelemetry {
  /** Status of the equipment request ('loading', 'error', 'ready'). */
  readonly equipmentStatus = input.required<string>();

  /** List of available IoT devices. */
  readonly devices = input.required<any[]>();

  /** Currently selected device ID. */
  readonly selectedDeviceId = input.required<number | null>();

  /** List of available parameters (series) for the selected device. */
  readonly series = input.required<any[]>();

  /** The currently selected parameter (series). */
  readonly activeSeries = input.required<any>();

  /** Status of the measurements request. */
  readonly measurementsStatus = input.required<string>();

  /** The latest reading object. */
  readonly latestReading = input.required<any>();

  /** Array of readings for the chart. */
  readonly readings = input.required<any[]>();

  /** Min and max values for the summary text. */
  readonly readingRange = input.required<any>();

  /** Configuration data for Chart.js. */
  readonly chartData = input.required<ChartData<'line'>>();

  /** Configuration options for Chart.js. */
  readonly chartOptions = input.required<ChartOptions<'line'>>();

  /** Utility function passed from the parent to format dates. */
  readonly formatDate = input.required<(value: string | number, short?: boolean) => string>();

  /** Emits when the user selects a different device. */
  readonly deviceChange = output<number>();

  /** Emits when the user selects a different parameter. */
  readonly seriesChange = output<string>();

  /** Emits when the user clicks retry. */
  readonly retry = output<void>();
}
