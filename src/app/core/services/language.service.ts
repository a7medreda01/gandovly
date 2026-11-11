import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { SettingsService } from './settings.service';

export type SupportedLanguage = 'ar' | 'en';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly STORAGE_KEY = 'mecart_language';
  private settingsService = inject(SettingsService);

  private readonly preferredLanguage = signal<SupportedLanguage>(this.getInitialLanguage());
  readonly currentLang = computed<SupportedLanguage>(() => {
    const mode = this.settingsService.settings().languageMode;
    if (mode === 'en_only') return 'en';
    if (mode === 'ar_only') return 'ar';
    return this.preferredLanguage();
  });

  isRtl = computed(() => this.currentLang() === 'ar');

  canSwitchLanguage = computed(() => {
    const s = this.settingsService.settings();
    const mode = s.languageMode || 'both';
    return mode === 'both';
  });

  constructor() {
    this.applyDomLanguage(this.currentLang());
    effect(() => {
      const lang = this.currentLang();
      this.applyDomLanguage(lang);
      if (this.canSwitchLanguage() && typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, lang);
      }
    });
  }

  applyDomLanguage(lang: SupportedLanguage): void {
    if (typeof document === 'undefined') return;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.setAttribute('dir', dir);
    if (document.body) {
      document.body.dir = dir;
      document.body.setAttribute('dir', dir);
      if (lang === 'en') {
        document.documentElement.classList.add('lang-en');
        document.documentElement.classList.remove('lang-ar');
        document.body.classList.add('lang-en');
        document.body.classList.remove('lang-ar');
      } else {
        document.documentElement.classList.add('lang-ar');
        document.documentElement.classList.remove('lang-en');
        document.body.classList.add('lang-ar');
        document.body.classList.remove('lang-en');
      }
    }
  }

  toggleLanguage(): void {
    const nextLang: SupportedLanguage = this.currentLang() === 'ar' ? 'en' : 'ar';
    this.preferredLanguage.set(nextLang);
    this.applyDomLanguage(nextLang);
  }

  setLanguage(lang: SupportedLanguage): void {
    this.preferredLanguage.set(lang);
    this.applyDomLanguage(lang);
  }

  text(ar: string | null | undefined, en?: string | null): string {
    return (this.currentLang() === 'en' ? en?.trim() : '') || ar || '';
  }

  getLocalizedName(item: { nameAr: string; nameEn?: string | null }): string {
    if (this.currentLang() === 'en' && item.nameEn && item.nameEn.trim()) {
      return item.nameEn.trim();
    }
    return item.nameAr || '';
  }

  getLocalizedDesc(item: { description?: string | null; descriptionEn?: string | null }): string {
    if (this.currentLang() === 'en' && item.descriptionEn && item.descriptionEn.trim()) {
      return item.descriptionEn.trim();
    }
    return item.description || '';
  }

  get currencySymbol(): string {
    return this.getCurrencySymbol();
  }

  getCurrencySymbol(): string {
    const s = this.settingsService.settings();
    if (this.currentLang() === 'en') {
      const en = s.currencySymbolEn || s.storeLayout?.currencySymbolEn;
      if (en && en.trim()) return en.trim();
      if (s.currencyCode && s.currencyCode.trim()) return s.currencyCode.trim();
      const sym = s.currencySymbol || 'ج.م';
      if (sym === 'ج.م' || sym === 'جنيه') return 'EGP';
      if (sym === 'ر.س' || sym === 'ريال') return 'SAR';
      if (sym === 'د.إ' || sym === 'درهم') return 'AED';
      if (sym === 'د.ك' || sym === 'دينار') return 'KWD';
      return sym;
    }
    return s.currencySymbol || 'ج.م';
  }

  getStoreName(): string {
    const s = this.settingsService.settings();
    const en = s.restaurantNameEn || s.storeLayout?.restaurantNameEn;
    return this.text(s.restaurantName, en);
  }

  getStoreTagline(): string {
    const s = this.settingsService.settings();
    const en = s.taglineEn || s.storeLayout?.taglineEn;
    return this.text(s.tagline, en);
  }

  getStoreDesc(): string {
    const s = this.settingsService.settings();
    const en = s.descriptionEn || s.storeLayout?.descriptionEn;
    return this.text(s.description, en);
  }

  getStoreAddress(): string {
    const s = this.settingsService.settings();
    const en = s.addressEn || s.storeLayout?.addressEn;
    return this.text(s.address, en);
  }

  getStoreCity(): string {
    const s = this.settingsService.settings();
    const en = s.cityEn || s.storeLayout?.cityEn;
    return this.text(s.city, en);
  }

  getQualityDisclaimer(): string {
    const s = this.settingsService.settings();
    const en = s.estimatedWeightDisclaimerEn || s.storeLayout?.estimatedWeightDisclaimerEn;
    return this.text(s.estimatedWeightDisclaimer, en);
  }

  getPromotionBanner(): string {
    const s = this.settingsService.settings();
    const en = s.activePromotionBannerEn || s.storeLayout?.activePromotionBannerEn;
    return this.text(s.activePromotionBanner, en);
  }

  getWeightUnit(grams?: number): string {
    if (this.currentLang() === 'en') {
      return (grams && grams < 1000) ? 'g' : 'kg';
    }
    return (grams && grams < 1000) ? 'جم' : 'كجم';
  }

  formatWeight(grams: number): string {
    if (this.currentLang() === 'en') {
      return grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`;
    }
    return grams >= 1000 ? `${grams / 1000} كجم` : `${grams} جم`;
  }

  private getInitialLanguage(): SupportedLanguage {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY) as SupportedLanguage | null;
      if (saved === 'ar' || saved === 'en') return saved;
    }
    return 'ar';
  }
}

