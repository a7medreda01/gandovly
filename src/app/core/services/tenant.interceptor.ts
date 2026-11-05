import { adminSessionKey, customerSessionKey } from './tenant-session';
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const tenantInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiUrl) || typeof window === 'undefined') return next(request);
  const headers: Record<string, string> = {};
  const query = new URLSearchParams(window.location.search).get('tenant');
  const host = window.location.hostname;
  const slug = host.endsWith('.mecart.app') && host !== 'www.mecart.app'
    ? host.slice(0, -'.mecart.app'.length) : query;
  if (slug) headers['X-Tenant-Slug'] = slug;
  try {
    const adminRequest = request.url.includes('/admin/');
    const stored = adminRequest ? sessionStorage.getItem(adminSessionKey()) || localStorage.getItem(adminSessionKey()) : localStorage.getItem(customerSessionKey('gendofly_customer_session'));
    const session = JSON.parse(stored || 'null');
    if (session?.token) headers['Authorization'] = `Bearer ${session.token}`;
  } catch { /* Invalid stored session is handled by the login flow. */ }
  return next(request.clone({ setHeaders: headers }));
};
