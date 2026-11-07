import { inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { StoreDomainResolver } from './store-domain-resolver.service';
import { adminSessionKey, customerSessionKey } from './tenant-session';
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const tenantInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiUrl) || typeof window === 'undefined') return next(request);
  const headers: Record<string, string> = {};
  const query = new URLSearchParams(window.location.search).get('tenant');
  const host = window.location.hostname;
  const slug = environment.standalone ? null : host.endsWith('.mecart.app') && host !== 'www.mecart.app'
    ? host.slice(0, -'.mecart.app'.length) : query;
  if (slug) headers['X-Tenant-Slug'] = slug;
  try {
    const adminRequest = request.url.includes('/admin/');
    const stored = adminRequest ? sessionStorage.getItem(adminSessionKey()) || localStorage.getItem(adminSessionKey()) : localStorage.getItem(customerSessionKey('gendofly_customer_session'));
    const session = JSON.parse(stored || 'null');
    if (session?.token) headers['Authorization'] = `Bearer ${session.token}`;
  } catch { /* Invalid stored session is handled by the login flow. */ }
  const customHost = !['localhost','127.0.0.1','mecart.app','www.mecart.app','supermarket1.runasp.net'].includes(host) && !host.endsWith('.mecart.app');
  if (!environment.standalone && !slug && customHost) return inject(StoreDomainResolver).slug.pipe(switchMap(resolved => next(request.clone({setHeaders:{...headers,'X-Tenant-Slug':resolved}}))));
  return next(request.clone({ setHeaders: headers }));
};
