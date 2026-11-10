import { inject } from '@angular/core';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { StoreDomainResolver } from './store-domain-resolver.service';
import { adminSessionKey, customerSessionKey } from './tenant-session';
import { environment } from '../../../environments/environment';
import { SettingsService } from './settings.service';
import { isPlatformContext } from './store-context';

export const tenantInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiUrl) || typeof window === 'undefined') return next(request);
  const settingsService = inject(SettingsService);
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
  const customHost = !['localhost','127.0.0.1','mecart.app','www.mecart.app','supermarket1.runasp.net'].includes(host) && !host.endsWith('.mecart.app') && !host.endsWith('.vercel.app') && !host.includes('vercel.app');

  const handleResponse = (req: typeof request) => next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && (err.status === 403 || err.status === 404)) {
        if (!isPlatformContext() && !request.url.includes('/admin/')) {
          const isSusp = err.status === 403 || err.error?.isSuspended;
          settingsService.setStoreUnavailable(
            isSusp ? 'suspended' : 'not_found',
            err.error?.message,
            err.error?.storeName
          );
        }
      }
      return throwError(() => err);
    })
  );

  if (!environment.standalone && !slug && customHost) {
    return inject(StoreDomainResolver).slug.pipe(
      switchMap(resolved => handleResponse(request.clone({ setHeaders: { ...headers, 'X-Tenant-Slug': resolved } })))
    );
  }
  return handleResponse(request.clone({ setHeaders: headers }));
};
