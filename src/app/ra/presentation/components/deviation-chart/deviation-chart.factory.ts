import { ChartData, ChartOptions } from 'chart.js';
import { TranslateService } from '@ngx-translate/core';
import { ChartThresholds } from './deviation-chart';

export class DeviationChartFactory {
  static createChartData(trend: any): ChartData<'line'> {
    if (!trend) return { datasets: [] };

    const points = trend.dataPoints.map((p: any) => ({
      x: Date.parse(p.timestamp),
      y: p.recordedValue,
      state: p.state,
    }));

    return {
      datasets: [
        {
          label: trend.parameterName,
          data: points,
          borderColor: '#0f766e',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: (ctx) => {
            const point = trend.dataPoints[ctx.dataIndex];
            return point?.state === 'CRITICAL' || point?.state === 'WARNING' ? 6 : 0;
          },
          pointBackgroundColor: (ctx) => {
            const point = trend.dataPoints[ctx.dataIndex];
            return point?.state === 'CRITICAL' ? '#ef4444' : '#f59e0b';
          },
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          fill: false,
        },
      ],
    };
  }

  static createChartOptions(
    trend: any,
    thresholds: ChartThresholds,
    translate: TranslateService,
  ): ChartOptions<'line'> {
    const { normalMin, warningMax, criticalMax, unit } = thresholds;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'normal' },
          titleColor: '#cbd5e1',
          bodyFont: { size: 20, weight: 'bold' },
          bodyColor: '#ffffff',
          padding: 12,
          displayColors: false,
          cornerRadius: 8,
          callbacks: {
            title: (items) => {
              const value = items[0].parsed.x ?? 0;
              const locale = translate.currentLang()?.startsWith('es') ? 'es-PE' : 'en-US';
              return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
            },
            label: (item) => {
              const point = trend?.dataPoints[item.dataIndex];
              let stateLabel = '';

              if (point?.state === 'CRITICAL') {
                stateLabel = translate.instant('reporting.deviations.tooltip-critical', { limit: criticalMax, unit });
              } else if (point?.state === 'WARNING') {
                stateLabel = translate.instant('reporting.deviations.tooltip-warning', { limit: warningMax, unit });
              }

              return `${item.parsed.y} ${unit}${stateLabel ? `\n${stateLabel}` : ''}`;
            },
            labelTextColor: (context) => {
              return context.dataIndex === 1 ? '#cbd5e1' : '#ffffff';
            },
          },
        },
        annotation: {
          annotations: {
            criticalZone: {
              type: 'box', yMin: criticalMax, yMax: criticalMax + 5,
              backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 0,
            },
            warningZone: {
              type: 'box', yMin: warningMax, yMax: criticalMax,
              backgroundColor: 'rgba(245, 158, 11, 0.08)', borderWidth: 0,
            },
            normalZone: {
              type: 'box', yMin: normalMin, yMax: warningMax,
              backgroundColor: 'rgba(16, 185, 129, 0.08)', borderWidth: 0,
            },
            critLine: {
              type: 'line', yMin: criticalMax, yMax: criticalMax,
              borderColor: '#ef4444', borderWidth: 1.5, borderDash: [5, 5],
              label: {
                display: true, content: translate.instant('reporting.deviations.chart-critical-line', { limit: criticalMax, unit }),
                position: 'start', backgroundColor: 'transparent', color: '#ef4444',
                font: { size: 11, weight: 'bold' }, yAdjust: -10, xAdjust: 10,
              },
            },
            warnLine: {
              type: 'line', yMin: warningMax, yMax: warningMax,
              borderColor: '#f59e0b', borderWidth: 1.5, borderDash: [5, 5],
              label: {
                display: true, content: translate.instant('reporting.deviations.chart-warning-line', { min: warningMax, max: criticalMax, unit }),
                position: 'start', backgroundColor: 'transparent', color: '#b45309',
                font: { size: 11, weight: 'bold' }, yAdjust: -10, xAdjust: 10,
              },
            },
            normLine: {
              type: 'line', yMin: normalMin, yMax: normalMin,
              borderColor: '#10b981', borderWidth: 1.5, borderDash: [5, 5],
              label: {
                display: true, content: translate.instant('reporting.deviations.chart-normal-line', { min: normalMin, max: warningMax, unit }),
                position: 'start', backgroundColor: 'transparent', color: '#047857',
                font: { size: 11, weight: 'bold' }, yAdjust: -10, xAdjust: 10,
              },
            },
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          grid: { display: false },
          border: { display: true, color: '#e2e8f0' },
          ticks: {
            maxTicksLimit: 6, maxRotation: 0,
            callback: (value) => {
              const locale = translate.currentLang()?.startsWith('es') ? 'es-PE' : 'en-US';
              return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(Number(value)));
            },
            font: { size: 12 }, color: '#64748b', padding: 10,
          },
        },
        y: {
          min: 0,
          title: { display: true, text: unit, color: '#64748b', font: { size: 12 }, padding: { bottom: 10 } },
          grid: { display: false },
          border: { display: true, color: '#e2e8f0' },
          ticks: { color: '#64748b', font: { size: 12 }, stepSize: 2, padding: 10 },
        },
      },
    };
  }
}
