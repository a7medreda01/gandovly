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
  isStoreUnavailable = signal<boolean>(false);
  storeUnavailableReason = signal<'suspended' | 'not_found' | null>(null);
  storeUnavailableMessage = signal<string>('');
  storeUnavailableName = signal<string>('');

  setStoreUnavailable(reason: 'suspended' | 'not_found', message?: string, storeName?: string) {
    this.isStoreUnavailable.set(true);
    this.storeUnavailableReason.set(reason);
    if (message) this.storeUnavailableMessage.set(message);
    if (storeName) this.storeUnavailableName.set(storeName);
  }

  loadSettings() {
    this.isLoading.set(true);
    return this.api.get<StorefrontSettings>('storefront/settings').pipe(
      map(data => {
        if (!data || isPlatformContext()) return data;
        const clean = { ...data };
        for (const key of ['logoUrl', 'heroBannerDesktopUrl', 'heroBannerMobileUrl', 'faviconUrl'] as const) {
          if (/mecart|mecard|runx/i.test(clean[key] || '')) clean[key] = '';
        }
          for (const key of ['facebookUrl', 'instagramUrl'] as const) {
            if (/^https?:\/\/(www\.)?facebook\.com\/runxtech\/?$/i.test(clean[key] || '')) clean[key] = '';
          }
        const colorKeys = [
          'primaryColor', 'secondaryColor', 'accentColor', 'surfaceColor',
          'navbarBgColor', 'navbarTextColor', 'footerBgColor', 'footerTextColor',
          'cardBgColor', 'borderColor', 'btnPrimaryBg', 'btnPrimaryText',
          'btnAccentBg', 'btnAccentText', 'successColor', 'errorColor', 'warningColor'
        ] as const;
        for (const k of colorKeys) {
          if ((clean as any)[k]) {
            (clean as any)[k] = this.sanitizeHexColor((clean as any)[k], (clean as any)[k]);
          }
        }
        return clean;
      }),
      tap(data => {
        if (data) {
          this.isStoreUnavailable.set(false);
          this.storeUnavailableReason.set(null);
          this.settings.set(data);
          this.applyCssThemeVariables(data);
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        const isPlatform = isPlatformContext();
        if (!isPlatform && (err?.status === 403 || err?.status === 404)) {
          const isSusp = err.status === 403 || err.error?.isSuspended;
          this.setStoreUnavailable(
            isSusp ? 'suspended' : 'not_found',
            err.error?.message || (isSusp ? 'هذا المتجر موقوف حالياً من قِبل إدارة المنصة.' : 'عذراً، هذا المتجر غير متاح أو تم حذفه.'),
            err.error?.storeName || ''
          );
        } else {
          console.warn('Could not load remote storefront settings, using default branding.', err);
          this.applyCssThemeVariables(this.defaultSettings);
        }
        return of(this.defaultSettings);
      })
    );
  }

  /**
   * Sanitizes any hex color string to valid #rrggbb format.
   * Gracefully fixes duplicated inputs like "#684C3A#684C3A", missing "#", etc.
   */
  sanitizeHexColor(color?: string | null, fallback = ''): string {
    if (!color) return fallback;
    const str = String(color).trim();
    if (!str) return fallback;
    const match = str.match(/#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
    if (match) {
      const hex = match[1];
      if (hex.length === 3) {
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
      }
      return `#${hex}`.toLowerCase();
    }
    if (/^(rgb|hsl)/i.test(str)) return str;
    return fallback;
  }

  private hexToRgb(hex: string): string {
    const clean = this.sanitizeHexColor(hex, '#12263F').replace('#', '');
    if (clean.length === 6) {
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

    // Clear optional overrides before applying a complete identity, including live previews.
    // Empty settings must restore defaults rather than retain an earlier store or preset.
    for (const key of ['--navbar-bg','--navbar-text','--footer-bg','--footer-text','--card-bg','--surface-white','--border-color','--line','--btn-primary-bg','--btn-primary-text','--btn-accent-bg','--btn-accent-text','--success-color','--error-color','--warning-color','--radius-card','--radius-box','--radius-modal','--radius-control','--font-size-base','--font-family-base']) root.style.removeProperty(key);
    document.body.style.removeProperty('font-family');
    root.style.removeProperty('font-size');

    const layout=settings.storeLayout;
    root.style.setProperty('--mobile-product-columns',String(layout?.mobileColumns||2));
    root.style.setProperty('--product-image-fit',layout?.cardImageFit||'cover');
    root.style.setProperty('--product-image-padding',String(layout?.cardImagePadding||0)+'px');
    root.style.setProperty('--product-image-radius',(layout?.cardImageRadius??-1)<0?'var(--radius-product-card)':layout!.cardImageRadius+'px');
    root.style.setProperty('--product-image-aspect',layout?.cardImageAspect==='portrait'?'3 / 4':layout?.cardImageAspect==='landscape'?'4 / 3':'1 / 1');
    if (layout?.navbarLogoWidth) root.style.setProperty('--navbar-logo-width', layout.navbarLogoWidth + 'px');
    else root.style.removeProperty('--navbar-logo-width');
    if (layout?.navbarLogoHeight) root.style.setProperty('--navbar-logo-height', layout.navbarLogoHeight + 'px');
    else root.style.removeProperty('--navbar-logo-height');
    if (layout?.footerLogoWidth) root.style.setProperty('--footer-logo-width', layout.footerLogoWidth + 'px');
    else root.style.removeProperty('--footer-logo-width');
    if (layout?.footerLogoHeight) root.style.setProperty('--footer-logo-height', layout.footerLogoHeight + 'px');
    else root.style.removeProperty('--footer-logo-height');
    const modalImgH = Number(layout?.modalImageHeight);
    if (modalImgH > 0) {
      root.style.setProperty('--modal-image-height', modalImgH + 'px');
      root.style.setProperty('--modal-image-aspect', 'auto');
    } else {
      root.style.removeProperty('--modal-image-height');
      root.style.removeProperty('--modal-image-aspect');
    }
    root.style.setProperty('--detail-image-fit',layout?.detailImageFit||'contain');
    if (settings.primaryColor) {
      const primary = this.sanitizeHexColor(settings.primaryColor, '#0a3d62');
      root.style.setProperty('--primary-color', primary);
      root.style.setProperty('--color-primary', primary);
      root.style.setProperty('--bs-primary', primary);
      root.style.setProperty('--primary-rgb', this.hexToRgb(primary));
    }
    // Main text color should remain a clean neutral dark unless explicitly customized
    const textColor = settings.textColor || '#0f172a';
    root.style.setProperty('--ink', textColor);
    root.style.setProperty('--text-main', textColor);
    if (settings.secondaryColor) {
      const secondary = this.sanitizeHexColor(settings.secondaryColor, '#A26F47');
      root.style.setProperty('--secondary-color', secondary);
      root.style.setProperty('--text-2', secondary);
    }
    if (settings.accentColor) {
      const accent = this.sanitizeHexColor(settings.accentColor, '#e67e22');
      root.style.setProperty('--accent-color', accent);
      root.style.setProperty('--color-accent', accent);
      root.style.setProperty('--brand-orange', accent);
      root.style.setProperty('--brand-orange-hover', accent);
      root.style.setProperty('--accent-rgb', this.hexToRgb(accent));
    }
    if (settings.surfaceColor) {
      const surface = this.sanitizeHexColor(settings.surfaceColor, '#f8fafd');
      root.style.setProperty('--surface-color', surface);
      root.style.setProperty('--surface', surface);
      root.style.setProperty('--page-bg', surface);
    }

    // Extended UI Colors
    if (settings.navbarBgColor) root.style.setProperty('--navbar-bg', this.sanitizeHexColor(settings.navbarBgColor, '#ffffff'));
    if (settings.navbarTextColor) root.style.setProperty('--navbar-text', this.sanitizeHexColor(settings.navbarTextColor, '#12263F'));
    if (settings.footerBgColor) root.style.setProperty('--footer-bg', this.sanitizeHexColor(settings.footerBgColor, '#fbf4e9'));
    if (settings.footerTextColor) root.style.setProperty('--footer-text', this.sanitizeHexColor(settings.footerTextColor, '#63412c'));
    if (settings.cardBgColor) {
      const card = this.sanitizeHexColor(settings.cardBgColor, '#ffffff');
      root.style.setProperty('--card-bg', card);
      root.style.setProperty('--surface-white', card);
    }
    if (settings.borderColor) {
      const border = this.sanitizeHexColor(settings.borderColor, '#E1E6EE');
      root.style.setProperty('--border-color', border);
      root.style.setProperty('--line', border);
    }
    if (settings.btnPrimaryBg) root.style.setProperty('--btn-primary-bg', this.sanitizeHexColor(settings.btnPrimaryBg, '#12263F'));
    if (settings.btnPrimaryText) root.style.setProperty('--btn-primary-text', this.sanitizeHexColor(settings.btnPrimaryText, '#ffffff'));
    if (settings.btnAccentBg) root.style.setProperty('--btn-accent-bg', this.sanitizeHexColor(settings.btnAccentBg, '#F4A261'));
    if (settings.btnAccentText) root.style.setProperty('--btn-accent-text', this.sanitizeHexColor(settings.btnAccentText, '#ffffff'));
    if (settings.successColor) root.style.setProperty('--success-color', this.sanitizeHexColor(settings.successColor, '#00875A'));
    if (settings.errorColor) root.style.setProperty('--error-color', this.sanitizeHexColor(settings.errorColor, '#DC2626'));
    if (settings.warningColor) root.style.setProperty('--warning-color', this.sanitizeHexColor(settings.warningColor, '#D97706'));

    // Shapes & Border Radius
    root.style.setProperty('--radius-navbar', settings.navbarBorderRadius || '0px');
    root.style.setProperty('--radius-bottom-nav', settings.bottomNavBorderRadius || '28px');
    root.style.setProperty('--radius-product-card', settings.productCardBorderRadius || '18px');
    root.style.setProperty('--radius-search', settings.searchBorderRadius || '999px');
    if (settings.borderRadius) {
      root.style.setProperty('--radius-card', settings.borderRadius);
      root.style.setProperty('--radius-box', settings.borderRadius);
      root.style.setProperty('--radius-modal', settings.borderRadius);
    }
    if (settings.buttonBorderRadius) {
      root.style.setProperty('--radius-control', settings.buttonBorderRadius);
    }
    if (settings.fontSizeBase) {
      root.style.setProperty('--font-size-base', `${settings.fontSizeBase}px`);
      root.style.fontSize = `${settings.fontSizeBase}px`;
    }
    const shadows: Record<string,string> = { none: 'none', soft: '0 4px 16px #142d450a', medium: '0 6px 22px #142d4517', strong: '0 10px 30px #142d4526' };
    root.style.setProperty('--shadow-card', shadows[settings.cardShadowStyle || 'soft'] || shadows['soft']);

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
