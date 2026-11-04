import { Component, input, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register the annotation plugin globally for this module.
Chart.register(annotationPlugin);

/**
 * Defines the limits and unit for the three status zones (normal, warning, critical).
 */
export interface ChartThresholds {
  normalMin: number;
  warningMax: number;
  criticalMax: number;
  unit: string;
}

/**
 * Presentational component that renders the deviation line chart and its custom legend.
 *
 * @remarks
 * This component is purely "dumb" (OnPush). It receives all chart data and options
 * from its parent and only emits user interactions (openDetail) back up.
 */
@Component({
  selector: 'app-deviation-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe, MatButtonModule, MatIconModule, BaseChartDirective],
  templateUrl: './deviation-chart.html',
  styleUrl: './deviation-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviationChart {
  /** The raw deviation trend data, used for display labels. */
  readonly trend = input.required<any>();

  /** The pre-configured data object for Chart.js. */
  readonly chartData = input.required<ChartData<'line'>>();

  /** The pre-configured options object for Chart.js. */
  readonly chartOptions = input.required<ChartOptions<'line'>>();

  /** Function to resolve a device ID to its human-readable label. */
  readonly deviceLabel = input.required<(id: number) => string>();

  /** The thresholds used to render the custom legend at the bottom. */
  readonly thresholds = input.required<ChartThresholds>();

  /** Emitted when the user clicks the "View more details" button. */
  readonly openDetail = output<void>();
}
