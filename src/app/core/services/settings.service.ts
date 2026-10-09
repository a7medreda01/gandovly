import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { StorefrontSettings } from '../models/models';
import { tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly api = inject(ApiService);

  private readonly defaultSettings: StorefrontSettings = {
    restaurantName: 'أسماك جندوفلي',
    tagline: 'أشهى المأكولات البحرية والأسماك الطازجة يومياً',
    description: 'مطعم أسماك جندوفلي يقدم أشهى الأسماك الطازجة وطواجن السي فود والجمبري والصواني بأعلى جودة وطرق طهي متنوعة.',
    logoUrl: '/assets/branding/logo.png',
    heroBannerDesktopUrl: '/assets/branding/hero-desktop.jpg',
    heroBannerMobileUrl: '/assets/branding/hero-mobile.jpg',
    faviconUrl: '/favicon.ico',
    primaryColor: '#0d2b45',
    secondaryColor: '#203c56',
    accentColor: '#f4a261',
    surfaceColor: '#fafafa',
    phone: '+201012345678',
    whatsapp: '+201012345678',
    address: 'شارع الجمهورية - كورنيش البحر',
    city: 'القاهرة',
    currencyCode: 'EGP',
    currencySymbol: 'ج.م',
    timeZone: 'Africa/Cairo',
    locale: 'ar-EG',
    isOrdersOpen: true,
    minimumOrderAmount: 60,
    defaultDeliveryFee: 25,
    isFreeDeliveryEnabled: false,
    freeDeliveryMinOrderAmount: 300,
    isTieredDiscountEnabled: false,
    tieredDiscountThresholdAmount: 500,
    tieredDiscountPercentage: 10,
    isFlatDiscountEnabled: false,
    flatDiscountPercentage: 5,
    activePromotionBanner: '',
    estimatedWeightDisclaimer: 'الوزن والسعر تقديريان، ويتم تحديدهما نهائياً بعد الوزن الفعلي في المطبخ وقد يختلفان قليلاً.',
    branches: []
  };

  settings = signal<StorefrontSettings>(this.defaultSettings);
  isLoading = signal<boolean>(false);

  loadSettings() {
    this.isLoading.set(true);
    return this.api.get<StorefrontSettings>('storefront/settings').pipe(
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

  applyCssThemeVariables(settings: StorefrontSettings) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (settings.primaryColor) root.style.setProperty('--primary-color', settings.primaryColor);
    if (settings.secondaryColor) root.style.setProperty('--secondary-color', settings.secondaryColor);
    if (settings.accentColor) root.style.setProperty('--accent-color', settings.accentColor);
    if (settings.surfaceColor) root.style.setProperty('--surface-color', settings.surfaceColor);
  }

  applyTheme(settings: StorefrontSettings) {
    this.applyCssThemeVariables(settings);
  }
}
