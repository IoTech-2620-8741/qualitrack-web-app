import { Component, input, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, Chart } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

export interface ChartThresholds {
  normalMin: number;
  warningMax: number;
  criticalMax: number;
  unit: string;
}

@Component({
  selector: 'app-deviation-chart',
  standalone: true,
  imports: [CommonModule, TranslatePipe, MatButtonModule, MatIconModule, BaseChartDirective],
  templateUrl: './deviation-chart.html',
  styleUrl: './deviation-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviationChart {
  readonly trend = input.required<any>();
  readonly chartData = input.required<ChartData<'line'>>();
  readonly chartOptions = input.required<ChartOptions<'line'>>();
  readonly deviceLabel = input.required<(id: number) => string>();
  readonly thresholds = input.required<ChartThresholds>();

  readonly openDetail = output<void>();
}
