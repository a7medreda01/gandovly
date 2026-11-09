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
  return auth.currentAdmin()?.role !== 'KitchenStaff' || router.createUrlTree(['/'], { queryParamsHandling: 'preserve' });
};
export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService), router = inject(Router);
  return auth.currentAdmin()?.canManageUsers === true || router.createUrlTree(['/admin/orders'], { queryParamsHandling: 'preserve' });
};
