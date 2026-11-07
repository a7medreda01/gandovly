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
    effect(() => {
      const lang = this.currentLang();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        if (lang === 'en') {
          document.body.classList.add('lang-en');
          document.body.classList.remove('lang-ar');
        } else {
          document.body.classList.add('lang-ar');
          document.body.classList.remove('lang-en');
        }
      }
      if (this.canSwitchLanguage() && typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, lang);
      }
    });
  }

  toggleLanguage(): void {
    const nextLang: SupportedLanguage = this.currentLang() === 'ar' ? 'en' : 'ar';
    this.preferredLanguage.set(nextLang);
  }

  setLanguage(lang: SupportedLanguage): void {
    this.preferredLanguage.set(lang);
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

  private getInitialLanguage(): SupportedLanguage {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY) as SupportedLanguage | null;
      if (saved === 'ar' || saved === 'en') return saved;
    }
    return 'ar';
  }
}

