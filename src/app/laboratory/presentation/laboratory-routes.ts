import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';
import { laboratorySetupGuard, onboardingGuard } from '../../iam/infrastructure/onboarding-guard';

const labProfile = () => import('./views/lab-profile/lab-profile').then((m) => m.LabProfile);
const labForm = () => import('./views/lab-form/lab-form').then((m) => m.LabForm);

const environmentList = () =>
  import('./views/environment-list/environment-list').then((m) => m.EnvironmentList);
const environmentForm = () =>
  import('./views/environment-form/environment-form').then((m) => m.EnvironmentForm);

const staffList = () => import('./views/staff-list/staff-list').then((m) => m.StaffList);
const staffForm = () => import('./views/staff-form/staff-form').then((m) => m.StaffForm);

export const laboratoryRoutes: Routes = [
  { path: 'create', loadComponent: labForm, canActivate: [laboratorySetupGuard] },
  { path: 'lab-form', redirectTo: 'create', pathMatch: 'full' },
  {
    path: '',
    component: Layout,
    canActivate: [onboardingGuard],
    canActivateChild: [onboardingGuard],
    children: [
      { path: 'lab-profile', loadComponent: labProfile },
      { path: 'environments', loadComponent: environmentList },
      { path: 'environments/new', loadComponent: environmentForm },
      { path: 'environments/:environmentId/edit', loadComponent: environmentForm },
      { path: 'staff-list', loadComponent: staffList },
      { path: 'staff-form', loadComponent: staffForm },
      // Products belong to Product Batch Management and are registered per environment.
      { path: 'product-catalog', redirectTo: '/batches', pathMatch: 'full' },
      { path: 'product-form', redirectTo: '/batches', pathMatch: 'full' },
      { path: 'raw-material-list', redirectTo: '/inventory', pathMatch: 'full' },
      { path: 'raw-material-form', redirectTo: '/inventory', pathMatch: 'full' },
      { path: 'raw-materials/:id', loadComponent: () => import('./views/raw-material-detail/raw-material-detail').then(m => m.RawMaterialDetail) },
      { path: '', redirectTo: 'lab-profile', pathMatch: 'full' },
    ],
  },
];
