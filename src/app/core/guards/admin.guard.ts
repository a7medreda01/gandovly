import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdminLoggedIn()) {
    return true;
  }

  // If in browser and session exists in localStorage, restoreSession in authService already ran.
  // Check if current user is admin/staff
  const currentAdmin = authService.currentAdmin();
  if (currentAdmin && (currentAdmin.role === 'SuperAdmin' || currentAdmin.role === 'Manager' || currentAdmin.role === 'KitchenStaff')) {
    authService.isAdminLoggedIn.set(true);
    return true;
  }

  // Not authenticated as admin -> redirect to admin login
  return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};
