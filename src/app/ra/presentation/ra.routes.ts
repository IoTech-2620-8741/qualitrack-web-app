import { Routes } from '@angular/router';

const kpiDashboard = () =>
  import('./views/kpi-dashboard/kpi-dashboard').then((m) => m.KpiDashboardComponent);

const deviationTrendChart = () =>
  import('./views/deviation-trend-chart/deviation-trend-chart').then(
    (m) => m.DeviationTrendChartComponent,
  );

const reportGenerator = () =>
  import('./views/report-generator/report-generator').then((m) => m.ReportGeneratorComponent);

const auditLogViewer = () =>
  import('./views/audit-log-viewer/audit-log-viewer').then((m) => m.AuditLogViewerComponent);

const deviationDetailPage = () =>
  import('./views/deviation-detail-page/deviation-detail-page').then(
    (m) => m.DeviationDetailPage,
  );
/**
 * Route tree of Reporting & Audit (RA), addressed by resource:
 * - `kpis`: KPI dashboard of the laboratory.
 * - `deviation-trends`: deviation trend chart.
 * - `new`: generation of a new report.
 * - `audit-log`: audit log viewer.
 * - empty path: redirects to `kpis`.
 *
 * The view-named paths used before semantic routes redirect to their new address.
 */
const raRoutes: Routes = [
  // The activity of a staff member is part of their detail in Laboratory.
  { path: 'staff/:staffId/activity', redirectTo: '/laboratories/staff/:staffId' },
  { path: 'kpis', loadComponent: kpiDashboard, title: 'page-titles.kpis' },
  { path: 'deviation-trends/:equipmentId/:parameter', loadComponent: deviationDetailPage, title: 'page-titles.deviation-detail' },
  { path: 'deviation-trends', loadComponent: deviationTrendChart, title: 'page-titles.deviation-trends' },
  { path: 'new', loadComponent: reportGenerator, title: 'page-titles.report-generator' },
  { path: 'audit-log', loadComponent: auditLogViewer, title: 'page-titles.audit-log' },
  { path: '', redirectTo: 'kpis', pathMatch: 'full' },
  // View-named paths used before semantic routes.
  { path: 'kpi-dashboard', redirectTo: '/reports/kpis', pathMatch: 'full' },
  { path: 'report-generator', redirectTo: '/reports/new', pathMatch: 'full' },
  { path: 'staff-activity/:staffId', redirectTo: '/laboratories/staff/:staffId' },
];

export { raRoutes };
