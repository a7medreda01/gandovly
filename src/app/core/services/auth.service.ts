import { adminSessionKey, customerSessionKey } from './tenant-session';
import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { AuthResponse, CustomerAddress, CustomerProfile } from '../models/models';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);

  currentCustomer = signal<AuthResponse | null>(null);
  currentAdmin = signal<AuthResponse | null>(null);
  
  isAdminLoggedIn = signal<boolean>(false);
  isCustomerLoggedIn = computed(() => !!this.currentCustomer()?.token);

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const storedCustomer = localStorage.getItem(customerSessionKey('gendofly_customer_session'));
      if (storedCustomer) {
        const parsed: AuthResponse = JSON.parse(storedCustomer);
        this.currentCustomer.set(parsed);

        // Auto background refresh if token exists
        if (parsed.token) {
          this.refreshToken(parsed.token, parsed.refreshToken).subscribe({
            error: () => {
              // keep local session even if offline
            }
          });
        }
      }

      const storedAdmin = sessionStorage.getItem(adminSessionKey()) || localStorage.getItem(adminSessionKey());
      if (storedAdmin) {
        const adminUser: AuthResponse = JSON.parse(storedAdmin);
        this.currentAdmin.set(adminUser);
        this.isAdminLoggedIn.set(adminUser.role === 'SuperAdmin' || adminUser.role === 'Manager' || adminUser.role === 'Staff' || adminUser.role === 'KitchenStaff');
      }
    } catch (e) {
      console.warn('Session parsing failed', e);
    }
  }

  requestOtp(phoneNumber: string, isRetry: boolean = false) {
    return this.api.post<{ success: boolean; sentViaWhatsApp: boolean; message: string; fallbackCode?: string; existingCustomerName?: string }>('auth/otp/request', { phoneNumber, isRetry });
  }

  verifyOtp(phoneNumber: string, code: string, fullName?: string) {
    return this.api.post<AuthResponse>('auth/otp/verify', { phoneNumber, code, fullName }).pipe(
      tap(res => {
        if (res && res.success) {
          this.currentCustomer.set(res);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(customerSessionKey('gendofly_customer_session'), JSON.stringify(res));
            localStorage.setItem(customerSessionKey('gendofly_customer_token'), res.token);
            if (res.refreshToken) {
              localStorage.setItem(customerSessionKey('gendofly_customer_refresh_token'), res.refreshToken);
            }
          }
        }
      })
    );
  }

  refreshToken(token: string, refreshToken?: string) {
    return this.api.post<AuthResponse>('auth/refresh-token', { token, refreshToken }).pipe(
      tap(res => {
        if (res && res.success) {
          const current = this.currentCustomer();
          const updated = { ...current, ...res };
          this.currentCustomer.set(updated);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(customerSessionKey('gendofly_customer_session'), JSON.stringify(updated));
            localStorage.setItem(customerSessionKey('gendofly_customer_token'), res.token);
            if (res.refreshToken) {
              localStorage.setItem(customerSessionKey('gendofly_customer_refresh_token'), res.refreshToken);
            }
          }
        }
      })
    );
  }

  adminLogin(username: string, password: string) {
    return this.api.post<AuthResponse>('auth/admin/login', { username, password }).pipe(
      tap(res => {
        if (res && res.success) {
          sessionStorage.removeItem(adminSessionKey());
          this.currentAdmin.set(res);
          this.isAdminLoggedIn.set(true);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(adminSessionKey(), JSON.stringify(res));
          }
        }
      })
    );
  }

  logoutCustomer() {
    this.currentCustomer.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(customerSessionKey('gendofly_customer_session'));
      localStorage.removeItem(customerSessionKey('gendofly_customer_token'));
      localStorage.removeItem(customerSessionKey('gendofly_customer_refresh_token'));
    }
  }

  validateAdminSession() {
    return this.api.get<Partial<AuthResponse>>('admin/session', { check: Date.now() }).pipe(tap(session => {
      this.currentAdmin.update(current => current ? { ...current, ...session } : null);
    }));
  }

  startSupportSession(code: string) {
    return this.api.post<AuthResponse>('auth/admin/support-exchange', { code }).pipe(tap(session => {
      this.currentAdmin.set(session);
      this.isAdminLoggedIn.set(true);
      sessionStorage.setItem(adminSessionKey(), JSON.stringify(session));
    }));
  }

  revokeAdminSession() { return this.api.post<boolean>('admin/session/logout', {}); }

  logoutAdmin() {
    const support = this.currentAdmin()?.isSupportSession;
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(adminSessionKey());
    this.currentAdmin.set(null);
    this.isAdminLoggedIn.set(false);
    if (typeof localStorage !== 'undefined') {
      if (!support) localStorage.removeItem(adminSessionKey());
    }
  }

  getCustomerProfile(customerId: number) {
    return this.api.get<CustomerProfile>(`auth/customer/${customerId}/profile`);
  }

  getCustomerAddresses(customerIdOrPhone: number | string) {
    if (typeof customerIdOrPhone === 'string' && isNaN(Number(customerIdOrPhone))) {
      return this.api.get<CustomerAddress[]>(`auth/customer/by-phone/${encodeURIComponent(customerIdOrPhone)}/addresses`);
    }
    return this.api.get<CustomerAddress[]>(`auth/customer/${customerIdOrPhone}/addresses`);
  }

  addCustomerAddress(customerIdOrPhone: number | string, address: any) {
    if (typeof customerIdOrPhone === 'string' && isNaN(Number(customerIdOrPhone))) {
      return this.api.post<CustomerAddress>(`auth/customer/by-phone/${encodeURIComponent(customerIdOrPhone)}/addresses`, address);
    }
    return this.api.post<CustomerAddress>(`auth/customer/${customerIdOrPhone}/addresses`, address);
  }

  deleteCustomerAddress(customerIdOrPhone: number | string, addressId: number) {
    if (typeof customerIdOrPhone === 'string' && isNaN(Number(customerIdOrPhone))) {
      return this.api.delete<boolean>(`auth/customer/by-phone/${encodeURIComponent(customerIdOrPhone)}/addresses/${addressId}`);
    }
    return this.api.delete<boolean>(`auth/customer/${customerIdOrPhone}/addresses/${addressId}`);
  }

  // Password Recovery & Reset
  forgotPassword(emailOrUsername: string) {
    return this.api.post<{ sent: boolean; resetToken?: string; resetLink?: string; username?: string; email?: string }>(
      'auth/admin/forgot-password',
      { emailOrUsername }
    );
  }

  verifyResetToken(token: string) {
    return this.api.post<{ valid: boolean; username: string; fullName: string; email?: string; isInvite: boolean }>(
      'auth/admin/verify-reset-token',
      { token }
    );
  }

  resetPassword(token: string, newPassword: string) {
    return this.api.post<{ success: boolean }>(
      'auth/admin/reset-password',
      { token, newPassword }
    );
  }

  // Admin Users & Roles Management
  getAdminUsers() {
    return this.api.get<import('../models/models').AdminUserItem[]>('admin/users');
  }

  createAdminUser(data: { fullName: string; email: string; username?: string; role: string; password?: string }) {
    return this.api.post<{
      id: number;
      username: string;
      fullName: string;
      email: string;
      role: string;
      roleName: string;
      isActive: boolean;
      inviteToken: string;
      inviteLink: string;
      generatedPassword?: string;
    }>('admin/users', data);
  }

  updateAdminUser(id: number, data: { fullName: string; email?: string; role: string; isActive: boolean }) {
    return this.api.put<any>(`admin/users/${id}`, data);
  }

  deleteAdminUser(id: number) {
    return this.api.delete<boolean>(`admin/users/${id}`);
  }

  resendUserInvite(id: number) {
    return this.api.post<{ inviteToken: string; inviteLink: string }>(`admin/users/${id}/resend-invite`, {});
  }
}
