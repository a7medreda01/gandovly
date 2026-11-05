import { Routes } from '@angular/router';
import { StorefrontLayoutComponent } from './layout/storefront-layout/storefront-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { adminGuard, platformGuard, storeGuard } from './core/guards/admin.guard';

/**
 * Checks if the current visitor is on a Tenant Subdomain
 * e.g. super.mecart.app, or testing via ?tenant=super
 */
export function isTenantSubdomain(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  const search = window.location.search.toLowerCase();

  // Test / preview parameter
  if (search.includes('tenant=') || search.includes('store=')) {
    return true;
  }

  // Subdomain: super.mecart.app or backend direct URL
  if (host.startsWith('super.') || host.includes('supermarket1.runasp.net')) {
    return true;
  }

  // Any tenant subdomain on mecart.app (e.g. albaraka.mecart.app, etc.) except www and apex
  if (host.endsWith('.mecart.app')) {
    const sub = host.replace('.mecart.app', '');
    if (sub !== 'www' && sub !== '' && sub !== 'mecart') {
      return true;
    }
  }

  return !['localhost', '127.0.0.1', 'mecart.app', 'www.mecart.app'].includes(host);
}

export const routes: Routes = [
  { path: 'admin/support', loadComponent: () => import('./features/admin/admin-support/admin-support.component').then(m => m.AdminSupportComponent) },
  { path: 'master', redirectTo: 'admin/stores', pathMatch: 'full' },
  // 1. If visitor is on a Tenant Subdomain (e.g. super.mecart.app), load the Storefront directly at root
  {
    path: '',
    canMatch: [() => isTenantSubdomain()],
    component: StorefrontLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/storefront/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'menu',
        loadComponent: () => import('./features/storefront/menu/menu.component').then(m => m.MenuComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/storefront/wishlist/wishlist.component').then(m => m.WishlistComponent)
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./features/storefront/product-page/product-page.component').then(m => m.ProductPageComponent)
      },
      {
        path: 'track',
        redirectTo: 'account',
        pathMatch: 'full'
      },
      {
        path: 'track/:token',
        loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent)
      },
      {
        path: 'account',
        loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent)
      }
    ]
  },

  // 2. Main Platform Root for mecart.app & www.mecart.app (Mecart SaaS Platform Portal)
  {
    path: '',
    pathMatch: 'full',
    canMatch: [() => !isTenantSubdomain()],
    loadComponent: () => import('./features/landing/mecart-landing/mecart-landing.component').then(m => m.MecartLandingComponent)
  },

  // 3. Dedicated Projects Showcase Page with Pagination (/projects)
  {
    path: 'projects',
    loadComponent: () => import('./features/landing/mecart-projects/mecart-projects.component').then(m => m.MecartProjectsComponent)
  },

  // 4. Customer Storefront Direct Routes
  {
    path: '',
    component: StorefrontLayoutComponent,
    children: [
      {
        path: 'menu',
        loadComponent: () => import('./features/storefront/menu/menu.component').then(m => m.MenuComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/storefront/wishlist/wishlist.component').then(m => m.WishlistComponent)
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./features/storefront/product-page/product-page.component').then(m => m.ProductPageComponent)
      },
      {
        path: 'track',
        redirectTo: 'account',
        pathMatch: 'full'
      },
      {
        path: 'track/:token',
        loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent)
      },
      {
        path: 'account',
        loadComponent: () => import('./features/account/account.component').then(m => m.AccountComponent)
      }
    ]
  },

  // Admin Login (Standalone)
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },

  // 5. MeCart Cloud Platform Admin (ONLY Stores, Packages, Cloud Dashboard)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      { path: 'orders', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'catalog', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-catalog/admin-catalog.component').then(m => m.AdminCatalogComponent) },
      { path: 'settings', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent) },
      { path: 'delivery-zones', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-delivery-zones/admin-delivery-zones.component').then(m => m.AdminDeliveryZonesComponent) },
      { path: 'reports', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-reports/admin-reports.component').then(m => m.AdminReportsComponent) },
      { path: 'analytics', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent) },
      { path: 'notifications', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent) },
      { path: 'whatsapp', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-whatsapp/admin-whatsapp.component').then(m => m.AdminWhatsAppComponent) },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'stores'
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
    ]
  },

  // Wildcard -> Homepage
  {
    path: '**',
    redirectTo: ''
  }
];
