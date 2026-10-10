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
      const storedCustomer = localStorage.getItem('gendofly_customer_session');
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

      const storedAdmin = localStorage.getItem('gendofly_admin_session');
      if (storedAdmin) {
        const adminUser: AuthResponse = JSON.parse(storedAdmin);
        this.currentAdmin.set(adminUser);
        this.isAdminLoggedIn.set(adminUser.role === 'SuperAdmin' || adminUser.role === 'Manager' || adminUser.role === 'KitchenStaff');
      }
    } catch (e) {
      console.warn('Session parsing failed', e);
    }
  }

  requestOtp(phoneNumber: string, isRetry: boolean = false) {
    return this.api.post<{ success: boolean; sentViaWhatsApp: boolean; message: string; fallbackCode?: string }>('auth/otp/request', { phoneNumber, isRetry });
  }

  verifyOtp(phoneNumber: string, code: string, fullName?: string) {
    return this.api.post<AuthResponse>('auth/otp/verify', { phoneNumber, code, fullName }).pipe(
      tap(res => {
        if (res && res.success) {
          this.currentCustomer.set(res);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('gendofly_customer_session', JSON.stringify(res));
            localStorage.setItem('gendofly_customer_token', res.token);
            if (res.refreshToken) {
              localStorage.setItem('gendofly_customer_refresh_token', res.refreshToken);
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
            localStorage.setItem('gendofly_customer_session', JSON.stringify(updated));
            localStorage.setItem('gendofly_customer_token', res.token);
            if (res.refreshToken) {
              localStorage.setItem('gendofly_customer_refresh_token', res.refreshToken);
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
          this.currentAdmin.set(res);
          this.isAdminLoggedIn.set(true);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('gendofly_admin_session', JSON.stringify(res));
          }
        }
      })
    );
  }

  logoutCustomer() {
    this.currentCustomer.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('gendofly_customer_session');
      localStorage.removeItem('gendofly_customer_token');
      localStorage.removeItem('gendofly_customer_refresh_token');
    }
  }

  logoutAdmin() {
    this.currentAdmin.set(null);
    this.isAdminLoggedIn.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('gendofly_admin_session');
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
}
