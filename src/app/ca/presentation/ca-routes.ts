import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

const alertDashboard = () =>
  import('./views/alert-dashboard/alert-dashboard').then((m) => m.AlertDashboard);

const alertHistory = () =>
  import('./views/alert-history/alert-history').then((m) => m.AlertHistory);

const deviationDetail = () =>
  import('./views/deviation-detail/deviation-detail').then((m) => m.DeviationDetail);

/**
 * Route tree for learning presentation views.
 */
const caRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'alert-dashboard', loadComponent: alertDashboard },
      { path: 'alert-history', loadComponent: alertHistory },
      { path: 'deviation-detail/:id', loadComponent: deviationDetail },
      // Notification preferences are edited in the profile.
      { path: 'notification-settings', redirectTo: '/profile', pathMatch: 'full' },
      { path: '', redirectTo: 'alert-dashboard', pathMatch: 'full' },
    ],
  },
];

export { caRoutes };
