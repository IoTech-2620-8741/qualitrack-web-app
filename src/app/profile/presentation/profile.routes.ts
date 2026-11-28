import { Routes } from '@angular/router';

/** Lazy loader of the profile page. */
const profilePage = () =>
  import('./views/profile-page/profile-page').then((m) => m.ProfilePage);

/**
 * Route tree of the Profile bounded context: the profile of the signed-in user.
 *
 * @remarks
 * The page loads lazily at the empty path (`/profile`). A fragment such
 * as `/profile#notifications` opens the corresponding preferences page in CA.
 */
const profileRoutes: Routes = [
  // The profile of a staff member is part of their detail in Laboratory.
  { path: 'staff/:staffId', redirectTo: '/laboratories/staff/:staffId' },
  { path: '', loadComponent: profilePage, title: 'page-titles.profile' },
];

export { profileRoutes };
