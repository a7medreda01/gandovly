import { Routes } from '@angular/router';
import { StorefrontLayoutComponent } from './layout/storefront-layout/storefront-layout.component';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Storefront Layout (Customer Only)
  {
    path: '',
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

  // Redirect /kitchen to /admin/kitchen inside Admin layout
  {
    path: 'kitchen',
    redirectTo: 'admin/kitchen',
    pathMatch: 'full'
  },

  // Admin Login (Standalone)
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },

  // Admin Panel Layout (Protected by adminGuard)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      },
      {
        path: 'kitchen',
        loadComponent: () => import('./features/kitchen/kitchen.component').then(m => m.KitchenComponent)
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/admin/admin-catalog/admin-catalog.component').then(m => m.AdminCatalogComponent)
      },
      {
        path: 'delivery-zones',
        loadComponent: () => import('./features/admin/admin-delivery-zones/admin-delivery-zones.component').then(m => m.AdminDeliveryZonesComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/admin/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/admin-reports/admin-reports.component').then(m => m.AdminReportsComponent)
      },
      {
        path: 'whatsapp',
        loadComponent: () => import('./features/admin/admin-whatsapp/admin-whatsapp.component').then(m => m.AdminWhatsAppComponent)
      }
    ]
  },

  // Wildcard
  {
    path: '**',
    redirectTo: ''
  }
];
