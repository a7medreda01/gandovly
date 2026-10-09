import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { DATE_PIPE_DEFAULT_OPTIONS, registerLocaleData } from '@angular/common';
import localeArEg from '@angular/common/locales/ar-EG';

import { routes } from './app.routes';

registerLocaleData(localeArEg, 'ar-EG');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    provideRouter(
      routes,
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

