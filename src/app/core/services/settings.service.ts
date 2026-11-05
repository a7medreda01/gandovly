import { isPlatformContext } from './store-context';
import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { StorefrontSettings } from '../models/models';
import { tap, catchError, of, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly api = inject(ApiService);

  private readonly defaultSettings: StorefrontSettings = {
    defaultDomain: 'Supermarket',
    isMultiDomain: true,
    businessDomainLabel: 'المتجر',
    restaurantName: 'المتجر',
    tagline: 'تسوق منتجات المتجر بسهولة',
    description: 'تسوق منتجات المتجر وتابع طلباتك بسهولة.',
    logoUrl: '',
    heroBannerDesktopUrl: '',
    heroBannerMobileUrl: '',
    faviconUrl: '/assets/images/branding/store-mark.svg',
    primaryColor: '#0a3d62',
    secondaryColor: '#00a8cc',
    accentColor: '#e76f51',
    surfaceColor: '#f8fafd',
    fontFamily: 'Cairo',
    countryCode: 'EG',
    phoneCountryCode: '+20',
    cashierWhatsAppNumber: '',
    phone: '',
    whatsapp: '',
    address: 'القاهرة - جمهورية مصر العربية',
    city: 'القاهرة',
    currencyCode: 'EGP',
    currencySymbol: 'ج.م',
    timeZone: 'Africa/Cairo',
    locale: 'ar-EG',
    isOrdersOpen: true,
    minimumOrderAmount: 100,
    defaultDeliveryFee: 25,
    isFreeDeliveryEnabled: true,
    freeDeliveryMinOrderAmount: 500,
    isTieredDiscountEnabled: false,
    tieredDiscountThresholdAmount: 1000,
    tieredDiscountPercentage: 5,
    isFlatDiscountEnabled: false,
    flatDiscountPercentage: 0,
    activePromotionBanner: '',
    estimatedWeightDisclaimer: 'الأسعار شاملة ضريبة القيمة المضافة، والمنتجات بالوزن تخضع للوزن الفعلي عند التعبئة.',
    branches: []
  };

  settings = signal<StorefrontSettings>(this.defaultSettings);
  isLoading = signal<boolean>(false);

  loadSettings() {
    this.isLoading.set(true);
    return this.api.get<StorefrontSettings>('storefront/settings').pipe(
      map(data => {
        if (!data || isPlatformContext()) return data;
        const clean = { ...data };
        for (const key of ['logoUrl', 'heroBannerDesktopUrl', 'heroBannerMobileUrl', 'faviconUrl'] as const) {
          if (/mecart|mecard|runx/i.test(clean[key] || '')) clean[key] = '';
        }
        return clean;
      }),
      tap(data => {
        if (data) {
          this.settings.set(data);
          this.applyCssThemeVariables(data);
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.warn('Could not load remote storefront settings, using default branding.', err);
        this.isLoading.set(false);
        this.applyCssThemeVariables(this.defaultSettings);
        return of(this.defaultSettings);
      })
    );
  }

  private hexToRgb(hex: string): string {
    const clean = hex.replace('#', '');
    if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return `${r}, ${g}, ${b}`;
    }
    if (clean.length >= 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }
    return '18, 38, 63';
  }

  applyCssThemeVariables(settings: StorefrontSettings) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (settings.primaryColor) {
      root.style.setProperty('--primary-color', settings.primaryColor);
      root.style.setProperty('--color-primary', settings.primaryColor);
      root.style.setProperty('--bs-primary', settings.primaryColor);
      root.style.setProperty('--primary-rgb', this.hexToRgb(settings.primaryColor));
    }
    // Main text color should remain a clean neutral dark unless explicitly customized
    const textColor = settings.textColor || '#0f172a';
    root.style.setProperty('--ink', textColor);
    root.style.setProperty('--text-main', textColor);
    if (settings.secondaryColor) {
      root.style.setProperty('--secondary-color', settings.secondaryColor);
      root.style.setProperty('--text-2', settings.secondaryColor);
    }
    if (settings.accentColor) {
      root.style.setProperty('--accent-color', settings.accentColor);
      root.style.setProperty('--color-accent', settings.accentColor);
      root.style.setProperty('--brand-orange', settings.accentColor);
      root.style.setProperty('--brand-orange-hover', settings.accentColor);
      root.style.setProperty('--accent-rgb', this.hexToRgb(settings.accentColor));
    }
    if (settings.surfaceColor) {
      root.style.setProperty('--surface-color', settings.surfaceColor);
      root.style.setProperty('--surface', settings.surfaceColor);
      root.style.setProperty('--page-bg', settings.surfaceColor);
    }

    // Extended UI Colors
    if (settings.navbarBgColor) root.style.setProperty('--navbar-bg', settings.navbarBgColor);
    if (settings.navbarTextColor) root.style.setProperty('--navbar-text', settings.navbarTextColor);
    if (settings.footerBgColor) root.style.setProperty('--footer-bg', settings.footerBgColor);
    if (settings.footerTextColor) root.style.setProperty('--footer-text', settings.footerTextColor);
    if (settings.cardBgColor) {
      root.style.setProperty('--card-bg', settings.cardBgColor);
      root.style.setProperty('--surface-white', settings.cardBgColor);
    }
    if (settings.borderColor) {
      root.style.setProperty('--border-color', settings.borderColor);
      root.style.setProperty('--line', settings.borderColor);
    }
    if (settings.btnPrimaryBg) root.style.setProperty('--btn-primary-bg', settings.btnPrimaryBg);
    if (settings.btnPrimaryText) root.style.setProperty('--btn-primary-text', settings.btnPrimaryText);
    if (settings.btnAccentBg) root.style.setProperty('--btn-accent-bg', settings.btnAccentBg);
    if (settings.btnAccentText) root.style.setProperty('--btn-accent-text', settings.btnAccentText);
    if (settings.successColor) root.style.setProperty('--success-color', settings.successColor);
    if (settings.errorColor) root.style.setProperty('--error-color', settings.errorColor);
    if (settings.warningColor) root.style.setProperty('--warning-color', settings.warningColor);

    // Shapes & Border Radius
    if (settings.borderRadius) {
      root.style.setProperty('--radius-card', settings.borderRadius);
      root.style.setProperty('--radius-box', settings.borderRadius);
    }
    if (settings.buttonBorderRadius) {
      root.style.setProperty('--radius-control', settings.buttonBorderRadius);
    }
    if (settings.fontSizeBase) {
      root.style.setProperty('--font-size-base', `${settings.fontSizeBase}px`);
    }

    if (settings.fontFamily) {
      const font = settings.fontFamily.trim();
      const fontVal = `"${font}", "Cairo", "Tajawal", "Almarai", system-ui, -apple-system, sans-serif`;
      root.style.setProperty('--font-family-base', fontVal);
      document.body.style.fontFamily = fontVal;
    }
  }

  applyTheme(settings: StorefrontSettings) {
    this.applyCssThemeVariables(settings);
    if (typeof document === 'undefined') return;
    const platform = isPlatformContext();
    const name = platform ? 'Mecart' : (settings.restaurantName || 'المتجر');
    const title = platform ? 'Mecart — إدارة المتاجر' : (window.location.pathname.startsWith('/admin') ? 'إدارة ' + name : name);
    const description = platform ? 'إدارة المتاجر والعملاء والبيانات من مساحة عمل واحدة.' : (settings.description || 'تسوق منتجات ' + name);
    document.title = title;
    for (const [key, content] of Object.entries({ title, description, author: name, keywords: name, 'twitter:title': title, 'twitter:description': description })) {
      document.querySelector('meta[name="' + key + '"]')?.setAttribute('content', content);
    }
    for (const [key, content] of Object.entries({ 'og:title': title, 'og:site_name': name, 'og:description': description })) {
      document.querySelector('meta[property="' + key + '"]')?.setAttribute('content', content);
    }
    const icon = document.querySelector('link[rel="icon"]');
    icon?.setAttribute('href', platform ? '/favicon.png' : (settings.faviconUrl || '/assets/images/branding/store-mark.svg'));
    icon?.removeAttribute('type');
  }
}
