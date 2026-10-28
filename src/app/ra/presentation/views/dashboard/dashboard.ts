import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { RaStore } from '../../../application/ra.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
  ],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly store = inject(RaStore);
  private readonly translate = inject(TranslateService);
  private readonly language = toSignal(this.translate.onLangChange);
  protected readonly summaryCards = computed(() => [
    {
      key: 'equipment',
      value: this.store.overviewEquipment().data?.length,
      state: this.store.overviewEquipment().status,
      icon: 'precision_manufacturing',
      route: '/equipments/equipment-list',
      color: 'blue',
    },
    {
      key: 'in-progress',
      value: this.store.overviewBatches().data?.filter((item) => item.status === 'IN_PROGRESS').length,
      state: this.store.overviewBatches().status,
      icon: 'inventory_2',
      route: '/batches/batch-list',
      color: 'teal',
    },
    {
      key: 'open-alerts',
      value: this.store.overviewOpenAlerts().length,
      state: this.store.overviewAlerts().status,
      icon: 'warning_amber',
      route: '/alerts/alert-dashboard',
      color: 'red',
    },
    {
      key: 'low-stock',
      value: this.store.overviewLowStock().length,
      state: this.store.overviewMaterials().status,
      icon: 'inventory_2',
      route: '/inventory',
      color: 'amber',
    },
  ]);
  protected readonly batchStatuses = ['PENDING', 'IN_PROGRESS', 'RELEASED', 'REJECTED'] as const;
  protected readonly batchDistribution = computed(() =>
    this.batchStatuses.map((status) => ({
      status,
      count: this.store.overviewBatches().data?.filter((batch) => batch.status === status).length ?? 0,
    })),
  );
  protected readonly recentBatches = computed(() =>
    [...(this.store.overviewBatches().data ?? [])].sort((a, b) => b.id - a.id).slice(0, 4),
  );
  protected readonly chartData = computed<ChartData<'line'>>(() => {
    this.language();
    return {
      datasets: [
        {
          label: this.store.overviewActiveSeries()?.parameter,
          data: this.store
            .overviewReadings()
            .map((point) => ({ x: Date.parse(point.measuredAt), y: point.value ?? 0 })),
          borderColor: '#158378',
          backgroundColor: '#15837818',
          pointRadius: 3,
          borderWidth: 2,
          fill: true,
          tension: 0,
        },
      ],
    };
  });
  protected readonly chartOptions = computed<ChartOptions<'line'>>(() => {
    this.language();
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => this.formatDate(items[0].parsed.x ?? 0),
            label: (item) => `${item.parsed.y} ${this.store.overviewActiveSeries()?.unit ?? ''}`,
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          grid: { display: false },
          ticks: {
            maxTicksLimit: 4,
            maxRotation: 0,
            callback: (value) => this.formatDate(Number(value), true),
          },
        },
        y: { title: { display: true, text: this.store.overviewActiveSeries()?.unit ?? '' } },
      },
    };
  });
  protected readonly reloadAll = () => this.store.reloadOverview();
  protected readonly retryTelemetry = () =>
    this.store.selectOverviewDevice(this.store.overviewDeviceId());
  protected readonly retrySubscription = () => this.store.loadOverviewSubscription();
  protected readonly retryAlerts = () => this.store.loadOverviewAlerts();
  constructor() {
    this.store.reloadOverview();
  }
  protected formatDate(value: string | number, short = false): string {
    this.language();
    const locale = this.translate.getCurrentLang()?.startsWith('es') ? 'es-PE' : 'en-US';
    return new Intl.DateTimeFormat(
      locale,
      short
        ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
        : { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    ).format(new Date(value));
  }
}
