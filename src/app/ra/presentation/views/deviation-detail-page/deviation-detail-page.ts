import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslatePipe } from '@ngx-translate/core';

import { RaStore } from '../../../application/ra.store';
import { lastDays } from '../../../domain/model/indicator-period';
import { DeviationEvents } from '../../components/deviation-events/deviation-events';

type AlertFilter = 'all' | 'WARNING' | 'CRITICAL';

@Component({
  selector: 'app-deviation-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    TranslatePipe,
    DeviationEvents,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './deviation-detail-page.html',
  styleUrl: './deviation-detail-page.css',
})
export class DeviationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(RaStore);

  protected readonly equipmentId = signal<number | null>(null);
  protected readonly parameter = signal<string | null>(null);

  protected readonly fromDate = signal<Date | null>(null);
  protected readonly toDate = signal<Date | null>(null);
  protected readonly alertFilter = signal<AlertFilter>('all');

  // Método corregido que recibe el valor directo del picker
  protected onDateRangeChange(range: { start: Date | null, end: Date | null } | null) {
    if (range && range.start && range.end) {
      const start = new Date(range.start);
      const end = new Date(range.end);

      // Forzamos inicio del día
      start.setHours(0, 0, 0, 0);
      // Forzamos fin del día para incluir todos los eventos de la fecha elegida
      end.setHours(23, 59, 59, 999);

      this.fromDate.set(start);
      this.toDate.set(end);
    } else {
      this.fromDate.set(null);
      this.toDate.set(null);
    }
  }

  protected deviceLabel(id: number): string {
    return this.store.deviceName(id) ?? `#${id}`;
  }

  protected readonly trend = computed(() => {
    const eq = this.equipmentId();
    const param = this.parameter();
    if (eq === null || param === null) return null;

    const trends = this.store.deviationTrends();
    const decodedParam = decodeURIComponent(param).toLowerCase();

    return (
      trends.find(
        (t) =>
          t.equipmentId === eq &&
          (t.parameterName === param ||
            t.parameterName?.toLowerCase() === decodedParam),
      ) ?? null
    );
  });

  // Lógica de filtrado simplificada para mayor seguridad
  protected readonly filteredPoints = computed(() => {
    const trend = this.trend();
    if (!trend) return [];

    const points = (trend.dataPoints || []) as any[];
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    const filter = this.alertFilter();

    let fromMs = null;
    if (fromDate) {
      const fromD = new Date(fromDate);
      fromD.setHours(0, 0, 0, 0);
      fromMs = fromD.getTime();
    }

    let toMs = null;
    if (toDate) {
      const toD = new Date(toDate);
      toD.setHours(23, 59, 59, 999);
      toMs = toD.getTime();
    }

    return points
      .filter((p) => p.state === 'WARNING' || p.state === 'CRITICAL')
      .filter((p) => (filter === 'all' ? true : p.state === filter))
      .filter((p) => {
        const ts = Date.parse(p.timestamp);
        if (fromMs !== null && ts < fromMs) return false;
        if (toMs !== null && ts > toMs) return false;
        return true;
      })
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  });

  protected readonly counts = computed(() => {
    const devs = ((this.trend()?.dataPoints || []) as any[]).filter(
      (p) => p.state === 'WARNING' || p.state === 'CRITICAL',
    );
    return {
      total: devs.length,
      warning: devs.filter((p) => p.state === 'WARNING').length,
      critical: devs.filter((p) => p.state === 'CRITICAL').length,
    };
  });

  async ngOnInit() {
    this.store.loadDevices();

    if (!this.store.environmentsLoaded()) {
      await this.store.loadEnvironments();
    }

    this.route.paramMap.subscribe((params) => {
      const eq = Number(params.get('equipmentId'));
      this.equipmentId.set(Number.isFinite(eq) ? eq : null);
      this.parameter.set(params.get('parameter'));

      const envId = this.store.preferredEnvironmentId();
      if (envId !== null && !this.store.deviationTrends().length) {
        this.store.loadDeviationTrends(envId, lastDays(7));
      }
    });
  }

  protected clearFilters() {
    this.fromDate.set(null);
    this.toDate.set(null);
    this.alertFilter.set('all');
  }

  protected goBack() {
    this.router.navigate(['/reports/deviation-trends']);
  }
}
