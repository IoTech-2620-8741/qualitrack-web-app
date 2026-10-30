import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

/** Lazy loader of the view of the active alerts. */
const alertDashboard = () =>
  import('./views/alert-dashboard/alert-dashboard').then((m) => m.AlertDashboard);

/** Lazy loader of the view of the alert history. */
const alertHistory = () =>
  import('./views/alert-history/alert-history').then((m) => m.AlertHistory);

/** Lazy loader of the detail of a deviation alert. */
const deviationDetail = () =>
  import('./views/deviation-detail/deviation-detail').then((m) => m.DeviationDetail);

const notificationSettings = () =>
  import('./views/notification-settings/notification-settings').then((m) => m.NotificationSettings);

/**
 * Route tree of Compliance & Alerting (CA).
 *
 * @remarks
 * All the views are children of the shared {@link Layout}, load lazily and are addressed by resource:
 * - empty path: active alerts of an environment (US85).
 * - `history`: every alert of an environment, filtered by status and severity (TS74).
 * - `notification-settings`: notification preferences of the signed-in user.
 * - `:alertId`: detail of the deviation alert with that numeric id (US86).
 *
 * The view-named paths used before semantic routes redirect to their new address; e-mails sent by the
 * platform still link to `deviation-detail/:id`.
 */
const caRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', loadComponent: alertDashboard, pathMatch: 'full' },
      { path: 'history', loadComponent: alertHistory },
      { path: 'notification-settings', loadComponent: notificationSettings, title: 'Notification preferences - QualiTrack' },
      // View-named paths used before semantic routes, declared before the identifier so they are not read as one.
      { path: 'alert-dashboard', redirectTo: '/alerts', pathMatch: 'full' },
      { path: 'alert-history', redirectTo: '/alerts/history', pathMatch: 'full' },
      { path: 'deviation-detail/:id', redirectTo: '/alerts/:id' },
      { path: ':alertId', loadComponent: deviationDetail },
    ],
  },
];

export { caRoutes };
