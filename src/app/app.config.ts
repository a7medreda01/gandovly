import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { tenantInterceptor } from './core/services/tenant.interceptor';
import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import localeArEg from '@angular/common/locales/ar-EG';

import { routes } from './app.routes';

registerLocaleData(localeArEg, 'ar-EG');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch(), withInterceptors([tenantInterceptor])),
    provideRouter(
      routes,
      withRouterConfig({ defaultQueryParamsHandling: 'preserve' }),
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    {
      provide: DATE_PIPE_DEFAULT_OPTIONS,
      useValue: { timezone: '+0300' } // Cairo, Egypt (UTC+3)
    },
    {
      provide: LOCALE_ID,
      useValue: 'ar-EG'
    }
  ]
};

