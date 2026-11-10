import { isPlatformContext } from '../services/store-context';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
export const adminGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService), router = inject(Router);
  const login = () => router.createUrlTree(['/admin/login'], { queryParams: { ...router.parseUrl(state.url).queryParams, returnUrl: state.url }, queryParamsHandling: 'replace' });
  if (!auth.currentAdmin()?.token) return login();
  return auth.validateAdminSession().pipe(map(() => true), catchError(error => { if (error.status === 401 || error.status === 403) auth.logoutAdmin(); return of(login()); }));
};
export const platformGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService), router = inject(Router);
  if (isPlatformContext()) {
    if (auth.currentAdmin()?.isPlatformAdmin === true) {
      return true;
    }
    const admin = auth.currentAdmin();
    if (admin?.tenantSlug) {
      const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
      if (host === 'mecart.app' || host === 'www.mecart.app') {
        const sessionData = encodeURIComponent(JSON.stringify(admin));
        window.location.href = `https://${admin.tenantSlug}.mecart.app/admin/orders#session=${sessionData}`;
        return false;
      }
      return router.createUrlTree(['/admin/orders'], { queryParams: { tenant: admin.tenantSlug } });
    }
    auth.logoutAdmin();
    return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
  }
  // On a store subdomain (e.g. super.mecart.app), redirect to store orders
  return router.createUrlTree(['/admin/orders'], { queryParamsHandling: 'preserve' });
};

export const storeGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  if (auth.currentAdmin()?.role === 'KitchenStaff') {
    return router.createUrlTree(['/'], { queryParamsHandling: 'preserve' });
  }
  // On apex platform domain (mecart.app) without a tenant parameter
  if (isPlatformContext()) {
    const admin = auth.currentAdmin();
    if (admin && !admin.isPlatformAdmin && admin.tenantSlug) {
      const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
      if (host === 'mecart.app' || host === 'www.mecart.app') {
        const sessionData = encodeURIComponent(JSON.stringify(admin));
        window.location.href = `https://${admin.tenantSlug}.mecart.app/admin/orders#session=${sessionData}`;
        return false;
      }
      return router.createUrlTree(['/admin/orders'], { queryParams: { tenant: admin.tenantSlug } });
    }
    return router.createUrlTree(['/admin/stores']);
  }
  return true;
};
export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  const admin = auth.currentAdmin();
  const can = admin?.canManageUsers === true || admin?.role === 'SuperAdmin' || admin?.role === 'Manager' || admin?.role === 'Admin' || !admin?.role;
  return can || router.createUrlTree(['/admin/orders'], { queryParamsHandling: 'preserve' });
};
