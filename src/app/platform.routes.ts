import { Routes } from '@angular/router';
import { platformGuard } from './core/guards/admin.guard';
import { isTenantSubdomain } from './core/services/store-context';

export const platformRoutes: Routes = [
  { path: 'admin/support', loadComponent: () => import('./features/admin/admin-support/admin-support.component').then(m => m.AdminSupportComponent) },
  { path: 'master', redirectTo: 'admin/stores', pathMatch: 'full' },
  {
    path: '',
    pathMatch: 'full',
    canMatch: [() => !isTenantSubdomain()],
    loadComponent: () => import('./features/landing/mecart-landing/mecart-landing.component').then(m => m.MecartLandingComponent)
  },

  {
    path: 'projects',
    loadComponent: () => import('./features/landing/mecart-projects/mecart-projects.component').then(m => m.MecartProjectsComponent)
  },
];

export const platformAdminRoutes: Routes = [
      {
        path: 'stores/:id',
        canActivate: [platformGuard],
        loadComponent: () => import('./features/admin/admin-stores/admin-store-detail.component').then(m => m.AdminStoreDetailComponent)
      },
      {
        path: 'stores',
        canActivate: [platformGuard],
        loadComponent: () => import('./features/admin/admin-stores/admin-stores.component').then(m => m.AdminStoresComponent)
      },
      {
        path: 'packages',
        canActivate: [platformGuard],
        loadComponent: () => import('./features/admin/admin-packages/admin-packages.component').then(m => m.AdminPackagesComponent)
      },
      {
        path: 'dashboard',
        canActivate: [platformGuard],
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      }
];
