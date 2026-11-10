import { Routes } from '@angular/router';
import { StorefrontLayoutComponent } from './layout/storefront-layout/storefront-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { adminGuard, storeGuard } from './core/guards/admin.guard';
import { isTenantSubdomain, isPlatformContext } from './core/services/store-context';
import { platformAdminRoutes, platformRoutes } from './platform.routes';

export const routes: Routes = [
  ...platformRoutes,
  {
    path: '',
    component: StorefrontLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        canMatch: [isTenantSubdomain],
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
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin/reset-password',
    loadComponent: () => import('./features/admin/admin-reset-password/admin-reset-password.component').then(m => m.AdminResetPasswordComponent)
  },
  {
    path: 'admin/setup-account',
    loadComponent: () => import('./features/admin/admin-reset-password/admin-reset-password.component').then(m => m.AdminResetPasswordComponent)
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    children: [
      { path: 'commerce', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-commerce/admin-commerce.component').then(m => m.AdminCommerceComponent) },
      { path: 'orders', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'catalog', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-catalog/admin-catalog.component').then(m => m.AdminCatalogComponent) },
      { path: 'settings', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent) },
      { path: 'delivery-zones', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-delivery-zones/admin-delivery-zones.component').then(m => m.AdminDeliveryZonesComponent) },
      { path: 'reports', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-reports/admin-reports.component').then(m => m.AdminReportsComponent) },
      { path: 'analytics', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-analytics/admin-analytics.component').then(m => m.AdminAnalyticsComponent) },
      { path: 'notifications', canActivate: [storeGuard], loadComponent: () => import('./features/admin/admin-whatsapp/admin-whatsapp.component').then(m => m.AdminWhatsAppComponent) },
      { path: 'whatsapp', redirectTo: 'notifications', pathMatch: 'full' },
      { path: 'users', loadComponent: () => import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: '', pathMatch: 'full', redirectTo: isPlatformContext() ? 'stores' : 'orders' },
      ...platformAdminRoutes
    ]
  },
  { path: '**', redirectTo: '' }
];
