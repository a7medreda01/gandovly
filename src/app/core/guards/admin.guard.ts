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
export const platformGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  return isPlatformContext() && auth.currentAdmin()?.isPlatformAdmin === true || router.createUrlTree(['/admin/orders'], { queryParamsHandling: 'preserve' });
};
export const storeGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  if (auth.currentAdmin()?.role === 'KitchenStaff') {
    return router.createUrlTree(['/'], { queryParamsHandling: 'preserve' });
  }
  if (isPlatformContext()) {
    if (auth.currentAdmin()?.isPlatformAdmin === true) {
      return router.createUrlTree(['/admin/stores']);
    }
    const slug = auth.currentAdmin()?.tenantSlug || 'super';
    if (typeof window !== 'undefined' && (window.location.hostname === 'mecart.app' || window.location.hostname === 'www.mecart.app')) {
      window.location.href = `https://${slug}.mecart.app/admin/orders`;
      return false;
    }
  }
  return true;
};
export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  const admin = auth.currentAdmin();
  const can = admin?.canManageUsers === true || admin?.role === 'SuperAdmin' || admin?.role === 'Manager' || admin?.role === 'Admin' || !admin?.role;
  return can || router.createUrlTree(['/admin/orders'], { queryParamsHandling: 'preserve' });
};
