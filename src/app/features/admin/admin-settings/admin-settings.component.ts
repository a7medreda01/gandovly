import { defaultStoreLayout, newHomeSection } from '../../../core/models/store-layout';
import { StoreLayoutEditorComponent } from './store-layout-editor.component';
import { ChangeDetectorRef } from '@angular/core';
import { CommerceService } from '../../../core/services/commerce.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SettingsService } from '../../../core/services/settings.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StorefrontSettings } from '../../../core/models/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { compressImage } from '../../../core/utils/image-compressor.util';
import { PhoneInputComponent } from '../../../shared/components/phone-input/phone-input.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [RouterLink, StoreLayoutEditorComponent,CommonModule, FormsModule, ImageUrlPipe, LoadingStateComponent, PhoneInputComponent],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss'
})
export class AdminSettingsComponent implements OnInit {
  readonly homeThemeOptions = [
    { id: 'classic' as const, name: 'الشكل العادي', description: 'واجهة المتجر الحالية بتوازنها البسيط.', icon: 'bi bi-layout-text-window-reverse' },
    { id: 'cards' as const, name: 'شكل الكروت', description: 'أقسام ومنتجات داخل بطاقات بارزة.', icon: 'bi bi-grid-1x2' },
    { id: 'editorial' as const, name: 'مجلة تحريرية', description: 'للعلامات والمجموعات: قصة مصورة ومساحات عرض واسعة.', icon: 'bi bi-journal-richtext' },
    { id: 'discovery' as const, name: 'لوحة اكتشاف', description: 'للمتاجر المتنوعة: بحث سريع وأقسام وعروض واكتشاف منتجات.', icon: 'bi bi-compass' }
  ];

  readonly themeBannerPresets: Record<string, {
    id: string;
    name: string;
    desktopUrl: string;
    mobileUrl: string;
    title: string;
    titleEn: string;
    subtitle: string;
    subtitleEn: string;
    buttonText: string;
    buttonTextEn: string;
    buttonLink: string;
  }[]> = {
    classic: [
      {
        id: 'supermarket',
        name: 'سوبرماركت وتجزئة يومية',
        desktopUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=768&q=80',
        title: 'تسوق كافة احتياجاتك اليومية بأفضل الأسعار',
        titleEn: 'Shop your daily essentials at the best prices',
        subtitle: 'أفضل جودة، منتجات طازجة، وتوصيل سريع حتى باب بيتك',
        subtitleEn: 'Fresh products, top quality, fast delivery to your door',
        buttonText: 'تسوق العروض',
        buttonTextEn: 'Shop Deals',
        buttonLink: '/menu'
      },
      {
        id: 'weekly_deals',
        name: 'تخفيضات أسبوعية وتوفير',
        desktopUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=768&q=80',
        title: 'خصومات أسبوعية متجددة على كافة الأقسام',
        titleEn: 'Weekly fresh discounts across all departments',
        subtitle: 'وفر أكثر مع سلة مشترياتك المفضلة وعروض التوفير الحصرية',
        subtitleEn: 'Save more on your favorite shopping basket with exclusive offers',
        buttonText: 'اكتشف الخصومات',
        buttonTextEn: 'Discover Discounts',
        buttonLink: '/menu?sort=offers'
      }
    ],
    cards: [
      {
        id: 'cards_custom',
        name: 'البانر الحالي للمتجر (بانرك المخصص)',
        desktopUrl: '',
        mobileUrl: '',
        title: '',
        titleEn: '',
        subtitle: '',
        subtitleEn: '',
        buttonText: 'تسوق الآن',
        buttonTextEn: 'Shop now',
        buttonLink: '/menu'
      },
      {
        id: 'cards_modern',
        name: 'بطاقات عروض بارزة (Modern Cards)',
        desktopUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=768&q=80',
        title: 'أحدث المنتجات والعروض بتصميم الكروت الحديث',
        titleEn: 'Latest products & offers in modern card layout',
        subtitle: 'تصفح مريح وبطاقات بارزة تسهل عليك اختيار المنتج المناسب',
        subtitleEn: 'Comfortable browsing with standout cards for easy shopping',
        buttonText: 'استعرض المنتجات',
        buttonTextEn: 'View Products',
        buttonLink: '/menu'
      }
    ],
    editorial: [
      {
        id: 'luxury_furniture',
        name: 'أثاث وديكور عصري فاخر (Living & Interior)',
        desktopUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=768&q=80',
        title: 'الأناقة تبدأ من التفاصيل: نصنع أثاثاً يجمع الجودة العالية',
        titleEn: 'Elegance starts in details: Modern furniture crafted with passion',
        subtitle: 'تصاميم استثنائية تناسب ذوقك وتمنح منزلك لمسة من الفخامة والراحة الدائمة',
        subtitleEn: 'Exceptional designs bringing comfort and timeless luxury to your space',
        buttonText: 'استكشف التشكيلة',
        buttonTextEn: 'Explore Collection',
        buttonLink: '/menu'
      },
      {
        id: 'luxury_lifestyle',
        name: 'أزياء وبراندات راقية (Haute Couture & Brand Story)',
        desktopUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=768&q=80',
        title: 'قصة إبداع خلف كل قطعة وتصميم يعكس تميزك وتفردك',
        titleEn: 'A story of craft behind every curated piece',
        subtitle: 'مجموعات حصرية مختارة بعناية تجمع بين الأصالة واللمسة العصرية',
        subtitleEn: 'Curated seasonal collections that define modern elegance',
        buttonText: 'تصفح المجلة',
        buttonTextEn: 'Explore Magazine',
        buttonLink: '/menu'
      }
    ],
    discovery: [
      {
        id: 'tech_gadgets',
        name: 'تكنولوجيا وإلكترونيات ذكية (Smart Tech & Gadgets)',
        desktopUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=768&q=80',
        title: 'اكتشف أحدث التقنيات وأفضل الأجهزة الذكية الأصلية',
        titleEn: 'Discover cutting-edge tech and smart innovations',
        subtitle: 'أجهزة أصلية بأسعار تنافسية مع ضمان معتمد وشحن سريع إلى بابك',
        subtitleEn: 'Authentic gadgets with official warranty and fast delivery',
        buttonText: 'تصفح الأجهزة',
        buttonTextEn: 'Browse Tech',
        buttonLink: '/menu'
      },
      {
        id: 'marketplace_all',
        name: 'سوق متكامل ومنوعات (All-in-One Marketplace)',
        desktopUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=768&q=80',
        title: 'آلاف المنتجات بين يديك مع عروض يومية متجددة',
        titleEn: 'Thousands of products with daily exclusive deals',
        subtitle: 'بحث فوري، تصفح سريع، وتجربة تسوق لا تضاهى لكل العائلة',
        subtitleEn: 'Smart search, multi-departments, and daily unmissable deals',
        buttonText: 'ابدأ الاكتشاف',
        buttonTextEn: 'Start Discovery',
        buttonLink: '/menu'
      }
    ]
  };

  get activeThemePresets() {
    const theme = this.layoutOptions.homeTheme || 'classic';
    return this.themeBannerPresets[theme] || this.themeBannerPresets['classic'];
  }

  getActiveThemeBanner() {
    const layout = this.layoutOptions;
    layout.themeBanners ??= {};
    const currentTheme = layout.homeTheme || 'classic';
    if (!layout.themeBanners[currentTheme]) {
      if (currentTheme === 'cards') {
        layout.themeBanners[currentTheme] = {
          desktopUrl: this.settings()?.heroBannerDesktopUrl || '',
          mobileUrl: this.settings()?.heroBannerMobileUrl || '',
          title: this.settings()?.restaurantName || '',
          titleEn: layout.homeTitleEn || '',
          subtitle: this.settings()?.description || '',
          subtitleEn: layout.homeSubtitleEn || '',
          buttonText: 'تسوق الآن',
          buttonTextEn: layout.homeButtonTextEn || 'Shop now',
          buttonLink: '/menu'
        };
      } else {
        const preset = this.themeBannerPresets[currentTheme]?.[0];
        layout.themeBanners[currentTheme] = {
          desktopUrl: preset?.desktopUrl || this.settings()?.heroBannerDesktopUrl || '',
          mobileUrl: preset?.mobileUrl || this.settings()?.heroBannerMobileUrl || '',
          title: preset?.title || this.settings()?.restaurantName || '',
          titleEn: preset?.titleEn || layout.homeTitleEn || '',
          subtitle: preset?.subtitle || this.settings()?.description || '',
          subtitleEn: preset?.subtitleEn || layout.homeSubtitleEn || '',
          buttonText: preset?.buttonText || 'تسوق الآن',
          buttonTextEn: preset?.buttonTextEn || 'Shop now',
          buttonLink: preset?.buttonLink || '/menu'
        };
      }
    }
    return layout.themeBanners[currentTheme];
  }

  applyThemeBannerPreset(preset: any) {
    const b = this.getActiveThemeBanner();
    if (preset.id === 'cards_custom') {
      b.desktopUrl = this.settings()?.heroBannerDesktopUrl || '';
      b.mobileUrl = this.settings()?.heroBannerMobileUrl || '';
      b.title = this.settings()?.restaurantName || '';
      b.titleEn = this.layoutOptions.homeTitleEn || '';
      b.subtitle = this.settings()?.description || '';
      b.subtitleEn = this.layoutOptions.homeSubtitleEn || '';
    } else {
      b.desktopUrl = preset.desktopUrl;
      b.mobileUrl = preset.mobileUrl;
      b.title = preset.title;
      b.titleEn = preset.titleEn;
      b.subtitle = preset.subtitle;
      b.subtitleEn = preset.subtitleEn;
      b.buttonText = preset.buttonText;
      b.buttonTextEn = preset.buttonTextEn;
      b.buttonLink = preset.buttonLink || '/menu';
    }
    if (this.layoutOptions.homeTheme === 'cards' || !this.layoutOptions.homeTheme) {
      this.settings.update(s => s ? { ...s, heroBannerDesktopUrl: b.desktopUrl || '', heroBannerMobileUrl: b.mobileUrl || '' } : s);
    }
    this.toast.success('تم اختيار بانر (' + preset.name + ') لقالب (' + this.selectedHomeThemeName + ') بنجاح');
  }
  private readonly adminService = inject(AdminService);
  readonly settingsService = inject(SettingsService);
  private readonly toast = inject(NotificationService);

  private readonly domainHttp = inject(HttpClient);
  customDomain = signal('');
  storeUrl = signal('');
  domainInput = '';
  domainBusy = signal(false);
  dnsConfigured = signal(false);
  vercelStatus = signal('');
  readonly vercelMessages: Record<string, string> = {
    registered: 'مسجّل على مشروع Vercel المحدد',
    not_registered: 'الدومين غير مسجّل على مشروع Vercel المحدد. أعد حفظه لمحاولة التسجيل.',
    configuration_missing: 'إعدادات التسجيل التلقائي على الخادم غير مكتملة.',
    access_denied: 'Vercel رفض الصلاحية. راجع التوكن والفريق والمشروع.',
    conflict: 'Vercel رفض الإضافة بسبب تعارض في ربط الدومين.',
    verification_required: 'Vercel يطلب التحقق من ملكية الدومين.',
    rejected: 'Vercel رفض تسجيل الدومين. راجع إعدادات المشروع.',
    unavailable: 'تعذر الاتصال بـ Vercel. أعد الفحص.'
  };

  get effectiveDomain(): string {
    return (this.domainInput || this.customDomain() || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }

  get isSubdomain(): boolean {
    const d = this.effectiveDomain;
    if (!d) return false;
    const parts = d.split('.').filter(Boolean);
    return parts.length > 2 && parts[0] !== 'www';
  }

  get subdomainHost(): string {
    const d = this.effectiveDomain;
    if (!d) return 'shop';
    const parts = d.split('.').filter(Boolean);
    return parts.length > 2 ? parts[0] : '@';
  }

  get defaultStoreUrl(): string {
    if (this.storeUrl()) return this.storeUrl();
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.endsWith('.mecart.app') && host !== 'www.mecart.app') return 'https://' + host;
    }
    return '';
  }

  loadDomain() {
    this.domainHttp.get<any>(environment.apiUrl + '/admin/settings/custom-domain').subscribe({
      next: r => {
        this.customDomain.set(r.data.customDomain || '');
        this.domainInput = r.data.customDomain || '';
        this.dnsConfigured.set(!!r.data.dnsConfigured);
        this.vercelStatus.set(r.data.vercelStatus || '');
        if (r.data.storeUrl) this.storeUrl.set(r.data.storeUrl);
      }
    });
  }

  saveCustomDomain() {
    const clean = (this.domainInput || '').trim().toLowerCase();
    if (!clean) {
      this.toast.error('يرجى إدخال اسم الدومين أولاً.');
      return;
    }
    this.domainBusy.set(true);
    this.domainHttp.put<any>(environment.apiUrl + '/admin/settings/custom-domain', { domain: clean }).subscribe({
      next: r => {
        this.domainBusy.set(false);
        this.customDomain.set(r.data.customDomain || '');
        this.dnsConfigured.set(!!r.data.dnsConfigured);
        this.vercelStatus.set(r.data.vercelStatus || '');
        this.toast.info(r.message || 'تم حفظ الدومين. راجع حالة التسجيل.');
      },
      error: e => {
        this.domainBusy.set(false);
        this.toast.error(e.error?.message || 'تعذر حفظ الدومين.');
      }
    });
  }

  unlinkCustomDomain() {
    if (!confirm('هل تريد بالتأكيد إلغاء ربط هذا الدومين من المتجر؟')) return;
    this.domainBusy.set(true);
    this.domainHttp.put<any>(environment.apiUrl + '/admin/settings/custom-domain', { domain: '' }).subscribe({
      next: r => {
        this.domainBusy.set(false);
        this.customDomain.set('');
        this.domainInput = '';
        this.dnsConfigured.set(false);
        this.vercelStatus.set('');
        this.toast.success(r.message || 'تم إلغاء ربط الدومين.');
      },
      error: e => {
        this.domainBusy.set(false);
        this.toast.error(e.error?.message || 'تعذر إلغاء ربط الدومين.');
      }
    });
  }

  checkDnsStatus() {
    const d = this.customDomain() || this.domainInput;
    if (!d) return;
    this.domainBusy.set(true);
    this.domainHttp.get<any>(environment.apiUrl + '/admin/settings/custom-domain/check-dns?domain=' + encodeURIComponent(d)).subscribe({
      next: r => {
        this.domainBusy.set(false);
        this.dnsConfigured.set(!!r.data.dnsConfigured);
        this.vercelStatus.set(r.data.vercelStatus || '');
        if (r.data.dnsConfigured) {
          this.toast.success('سجلات DNS تشير إلى Vercel. راجع حالة تسجيل الدومين في المشروع.');
        } else {
          this.toast.info('لم يكتشف الفحص سجلات DNS المتوقعة. راجع القيم المطلوبة من Vercel.');
        }
      },
      error: () => {
        this.domainBusy.set(false);
        this.toast.error('تعذر فحص سجلات DNS حالياً.');
      }
    });
  }
  copyText(text: string, label: string = 'النص') {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast.success(`تم نسخ ${label} بنجاح إلى الحافظة.`);
      }).catch(() => {
        this.fallbackCopy(text, label);
      });
    } else {
      this.fallbackCopy(text, label);
    }
  }

  private fallbackCopy(text: string, label: string) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.toast.success(`تم نسخ ${label} بنجاح.`);
    } catch {
      this.toast.info(`انسخ النص يدوياً: ${text}`);
    }
  }

  activeTab = signal<'discounts' | 'branding' | 'policies' | 'info' | 'packages' | 'performance' | 'layout' | 'menu' | 'cart' | 'checkout' | 'account' | 'integrations' | 'domain'>('info');
  settings = signal<StorefrontSettings | null>(null);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isUploading = signal<boolean>(false);

  // Mecart Store Package & Seeding State
  packageStats = signal<any>(null);
  isExporting = signal<boolean>(false);
  isImporting = signal<boolean>(false);
  cleanBeforeImport = signal<boolean>(false);
  isReseeding = signal<boolean>(false);

  brandModes = [
    { id: 'both', label: 'لوجو + الاسم والشعار', icon: 'bi-window-dock', desc: 'يعرض اللوجو واسم المتجر والـ Tagline معاً' },
    { id: 'logo_only', label: 'اللوجو فقط', icon: 'bi-image', desc: 'يعرض صورة اللوجو بمفردها (مناسب للوجوهات العريضة)' },
    { id: 'name_only', label: 'اسم المتجر فقط', icon: 'bi-fonts', desc: 'يعرض اسم المتجر بدون أي لوجو' },
    { id: 'icon_name', label: 'أيقونة المتجر + الاسم', icon: 'bi-shop', desc: 'أيقونة متجر ذكية بجانب الاسم' }
  ];

  languageModes = [
    { id: 'both', label: 'اللغتان معاً (عربي + إنجليزي)', icon: 'bi-globe2', desc: 'تفعيل زر التبديل في الـ Toolbar وحقول إدخال إنجليزية اختيارية' },
    { id: 'ar_only', label: 'العربية فقط 🇸🇦', icon: 'bi-flag-fill', desc: 'المتجر عربي بالكامل - إخفاء زر التبديل وحقول الإنجليزية' },
    { id: 'en_only', label: 'الإنجليزية فقط 🇬🇧', icon: 'bi-translate', desc: 'المتجر باللغة الإنجليزية كاملة بـ اتجاه LTR' }
  ];

  cardShadowStyles = [
    { id: 'soft', label: 'ناعم وخفيف (Soft)' },
    { id: 'medium', label: 'متوسط وواضح (Medium)' },
    { id: 'strong', label: 'عميق وبارز (Strong)' },
    { id: 'none', label: 'بدون ظلال مسطح (Flat)' }
  ];

  fabPositions = [
    { id: 'bottom-right', label: 'أسفل اليمين' },
    { id: 'bottom-left', label: 'أسفل اليسار' }
  ];

  parsePx(val: string | undefined, defaultVal: number = 16): number {
    if (!val) return defaultVal;
    const parsed = parseInt(val.replace('px', ''), 10);
    return isNaN(parsed) ? defaultVal : parsed;
  }

  restoreStorefrontShapes(): void {
    this.settings.update(s => s ? { ...s, navbarBorderRadius: '0px', bottomNavBorderRadius: '28px', productCardBorderRadius: '18px', searchBorderRadius: '999px' } : s);
    this.onColorChange();
  }

  setRadius(prop: 'borderRadius' | 'buttonBorderRadius' | 'navbarBorderRadius' | 'bottomNavBorderRadius' | 'productCardBorderRadius' | 'searchBorderRadius', px: number): void {
    const current = this.settings();
    if (current) {
        this.settings.update(s => s ? { ...s, [prop]: `${Math.max(0, Math.min(999, Math.round(px || 0)))}px` } : s);
      this.onColorChange();
    }
  }

  setProductDetailViewMode(mode: 'modal' | 'page'): void {
    const current = this.settings();
    if (current) {
      this.settings.update(s => s ? { ...s, productDetailViewMode: mode } : s);
    }
  }

  businessDomains = [
    { id: 'Supermarket', label: 'سوبرماركت ومواد غذائية' },
    { id: 'Restaurant', label: 'مطاعم ومأكولات ومشروبات' },
    { id: 'Pharmacy', label: 'صيدلية وعناية طبية وتجميل' },
    { id: 'AutoParts', label: 'قطع غيار سيارات وورش صيانة' },
    { id: 'Electronics', label: 'إلكترونيات وأجهزة منزلية' },
    { id: 'GeneralRetail', label: 'تجارة عامة وتوريدات وخدمات' }
  ];

  availableFonts = [
    { id: 'Cairo', name: 'خط كايرو - Cairo (عصري وشامل - موصى به)' },
    { id: 'Tajawal', name: 'خط تجوال - Tajawal (أنيق وسلس)' },
    { id: 'Almarai', name: 'خط المراعي - Almarai (واضح ومتناسق)' },
    { id: 'Readex Pro', name: 'خط ريدكس برو - Readex Pro (حديث وجذاب)' },
    { id: 'Alexandria', name: 'خط الإسكندرية - Alexandria (هندسي تقني)' },
    { id: 'IBM Plex Sans Arabic', name: 'خط آي بي إم - IBM Plex (رسمي ودقيق)' }
  ];

  availableCountries = [
    { code: 'EG', name: 'مصر (Egypt)', flag: '🇪🇬', phoneCode: '+20', currencyCode: 'EGP', currencySymbol: 'ج.م', timezone: 'Africa/Cairo', locale: 'ar-EG' },
    { code: 'SA', name: 'المملكة العربية السعودية (KSA)', flag: '🇸🇦', phoneCode: '+966', currencyCode: 'SAR', currencySymbol: 'ر.س', timezone: 'Asia/Riyadh', locale: 'ar-SA' },
    { code: 'AE', name: 'الإمارات العربية المتحدة (UAE)', flag: '🇦🇪', phoneCode: '+971', currencyCode: 'AED', currencySymbol: 'د.إ', timezone: 'Asia/Dubai', locale: 'ar-AE' },
    { code: 'KW', name: 'الكويت (Kuwait)', flag: '🇰🇼', phoneCode: '+965', currencyCode: 'KWD', currencySymbol: 'د.ك', timezone: 'Asia/Kuwait', locale: 'ar-KW' },
    { code: 'QA', name: 'قطر (Qatar)', flag: '🇶🇦', phoneCode: '+974', currencyCode: 'QAR', currencySymbol: 'ر.ق', timezone: 'Asia/Qatar', locale: 'ar-QA' },
    { code: 'OM', name: 'سلطنة عمان (Oman)', flag: '🇴🇲', phoneCode: '+968', currencyCode: 'OMR', currencySymbol: 'ر.ع', timezone: 'Asia/Muscat', locale: 'ar-OM' },
    { code: 'BH', name: 'البحرين (Bahrain)', flag: '🇧🇭', phoneCode: '+973', currencyCode: 'BHD', currencySymbol: 'د.ب', timezone: 'Asia/Bahrain', locale: 'ar-BH' },
    { code: 'JO', name: 'الأردن (Jordan)', flag: '🇯🇴', phoneCode: '+962', currencyCode: 'JOD', currencySymbol: 'د.أ', timezone: 'Asia/Amman', locale: 'ar-JO' }
  ];

  onCountrySelect(countryCode: string) {
    const selected = this.availableCountries.find(c => c.code === countryCode);
    if (!selected) return;
    this.settings.update(s => {
      if (!s) return s;
      return {
        ...s,
        countryCode: selected.code,
        phoneCountryCode: selected.phoneCode,
        currencyCode: selected.currencyCode,
        currencySymbol: selected.currencySymbol,
        timeZone: selected.timezone,
        locale: selected.locale
      };
    });
  }

  onFontSelect(font: string) {
    this.settings.update(s => s ? { ...s, fontFamily: font } : s);
    const current = this.settings();
    if (current) {
      this.settingsService.applyCssThemeVariables(current);
    }
  }

  onColorChange() {
    const current = this.settings();
    if (current) {
      if (current.storeLayout?.useBrandColors) {
        current.storeLayout.useBrandColors = false;
      }
      this.settingsService.applyCssThemeVariables(current);
    }
  }

  setBrandColors(enabled: boolean) {
    const current = this.settings();
    if (!current) return;
    current.storeLayout ??= defaultStoreLayout();
    current.storeLayout.useBrandColors = enabled;
    if (enabled) {
      current.primaryColor = current.primaryColor || '#0a3d62';
      current.secondaryColor = current.secondaryColor || '#a26f47';
      current.accentColor = current.accentColor || '#e67e22';
      current.surfaceColor = current.surfaceColor || '#f8fafd';
      current.cardBgColor = current.cardBgColor || '#ffffff';
    }
    this.settingsService.applyCssThemeVariables(current);
  }

  sanitizeHexField(field: string): void {
    const s = this.settings();
    if (!s) return;
    const val = (s as any)[field];
    if (val) {
      (s as any)[field] = this.settingsService.sanitizeHexColor(val, val);
      this.onColorChange();
    }
  }

  activityPresets:any[]=[];
  private readonly commerce=inject(CommerceService);private readonly commerceCdr=inject(ChangeDetectorRef);
  private readonly route=inject(ActivatedRoute);
  ngOnInit() {
    this.commerce.presets.subscribe(rows=>{this.activityPresets=rows;this.commerceCdr.markForCheck();});
    const requestedTab=this.route.snapshot.queryParamMap.get('tab');if(['performance','layout','menu','cart','checkout','account','info','branding','discounts','policies','packages','integrations','domain'].includes(requestedTab||''))this.activeTab.set(requestedTab as any);
    this.loadSettings();
    this.loadPackageStats();
    this.loadDomain();
  }

  loadSettings() {
    this.isLoading.set(true);
    this.adminService.getSettings().subscribe({
      next: s => {
        const normalized = { ...s };
        if ((s as any).whatsApp && !normalized.whatsapp) {
          normalized.whatsapp = (s as any).whatsApp;
        }
        const colorFields = [
          'primaryColor', 'secondaryColor', 'accentColor', 'surfaceColor',
          'navbarBgColor', 'navbarTextColor', 'footerBgColor', 'footerTextColor',
          'cardBgColor', 'borderColor', 'btnPrimaryBg', 'btnPrimaryText',
          'btnAccentBg', 'btnAccentText', 'successColor', 'errorColor', 'warningColor'
        ] as const;
        for (const k of colorFields) {
          if ((normalized as any)[k]) {
            (normalized as any)[k] = this.settingsService.sanitizeHexColor((normalized as any)[k], (normalized as any)[k]);
          }
        }
        this.settings.set(normalized);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  applyStorePreset(preset: 'clothing' | 'supermarket') {
    const current = this.settings();
    if (!current) return;
    this.settings.set({
      ...current,
      defaultDomain: preset === 'clothing' ? 'GeneralRetail' : 'Supermarket',
      productDetailViewMode: preset === 'clothing' ? 'page' : 'modal',
      storeLayout: {
        ...(current.storeLayout ?? defaultStoreLayout()),
        cardImageAspect: preset === 'clothing' ? 'portrait' : 'square',
        detailImageFit: 'contain',
        mobileColumns: 2
      }
    });
    this.toast.info('تم تجهيز الإعدادات للمراجعة. اضغط حفظ لتطبيقها.');
  }

  get layoutOptions() {
    const settings = this.settings()!;
    return settings.storeLayout ??= defaultStoreLayout();
  }

  get compressionOptions() {
    const layout = this.layoutOptions;
    return {
      enabled: layout.enableImageCompression !== false,
      maxBytes: (layout.maxImageCompressionKb || 150) * 1024
    };
  }

  setImageCompressionKb(kb: number) {
    this.layoutOptions.maxImageCompressionKb = kb;
  }

  get selectedHomeThemeName() { return this.homeThemeOptions.find(t => t.id === (this.layoutOptions.homeTheme || 'classic'))?.name || ''; }

  selectHomeTheme(theme: 'classic' | 'cards' | 'editorial' | 'discovery') {
    const layout = this.layoutOptions;
    const previous = layout.homeTheme || 'classic';
    if (previous === theme && layout.sections.length) {
      if (theme === 'editorial' || theme === 'discovery') layout.useCustomHome = true;
      return;
    }
    layout.homeProfiles ??= {};
    if (previous !== theme) layout.homeProfiles[previous] = structuredClone({useCustomHome: layout.useCustomHome, sections: layout.sections});
    const saved = layout.homeProfiles[theme];
    if (saved) {
      layout.useCustomHome = saved.useCustomHome;
      layout.sections = structuredClone(saved.sections);
    } else if (theme === 'editorial' || theme === 'discovery') {
      const hero = newHomeSection('hero'); hero.title = this.settings()!.restaurantName; hero.subtitle = this.settings()!.description; hero.imageUrl = this.settings()!.heroBannerDesktopUrl; hero.mobileImageUrl = this.settings()!.heroBannerMobileUrl;
      const categories = newHomeSection('categories');
      const products = newHomeSection('products'); products.title = theme === 'editorial' ? 'اختياراتنا لك' : 'اكتشف الجديد'; products.source = 'latest';
      const banner = newHomeSection('banner'); banner.title = theme === 'editorial' ? 'قصة مجموعتنا' : 'اختيارات تستحق التجربة';
      layout.sections = theme === 'editorial' ? [hero, products, banner, categories] : [categories, hero, products, banner];
      layout.useCustomHome = true;
    } else { layout.sections = []; layout.useCustomHome = false; }
    delete layout.homeProfiles[theme];
    if (theme === 'editorial' || theme === 'discovery') layout.useCustomHome = true;
    layout.homeTheme = theme;
    this.onColorChange();
  }

  saveSettings(section?: string, silent = false) {
    const current = this.settings();
    if (!current) return;

    const layout = this.layoutOptions;
    delete (layout as any).enableBuyNowButton;
    const payload = {
      ...current,
      enableBuyNow: !!current.enableBuyNow,
      storeLayout: layout,
      restaurantNameEn: layout.restaurantNameEn || current.restaurantNameEn || '',
      taglineEn: layout.taglineEn || current.taglineEn || '',
      descriptionEn: layout.descriptionEn || current.descriptionEn || '',
      currencySymbolEn: layout.currencySymbolEn || current.currencySymbolEn || '',
      addressEn: layout.addressEn || current.addressEn || '',
      cityEn: layout.cityEn || current.cityEn || '',
      estimatedWeightDisclaimerEn: layout.estimatedWeightDisclaimerEn || current.estimatedWeightDisclaimerEn || '',
      timeZone: current.timeZone || 'Africa/Cairo',
      locale: current.locale || 'ar-EG',
      countryCode: current.countryCode || 'EG',
      phoneCountryCode: current.phoneCountryCode || '+20',
      fontFamily: current.fontFamily || 'Cairo',
      whatsApp: current.whatsapp || (current as any).whatsApp || '',
      WhatsApp: current.whatsapp || (current as any).whatsApp || '',
      whatsapp: current.whatsapp || (current as any).whatsApp || ''
    };

    const colorFields = [
      'primaryColor', 'secondaryColor', 'accentColor', 'surfaceColor',
      'navbarBgColor', 'navbarTextColor', 'footerBgColor', 'footerTextColor',
      'cardBgColor', 'borderColor', 'btnPrimaryBg', 'btnPrimaryText',
      'btnAccentBg', 'btnAccentText', 'successColor', 'errorColor', 'warningColor'
    ] as const;
    for (const k of colorFields) {
      if ((payload as any)[k]) {
        (payload as any)[k] = this.settingsService.sanitizeHexColor((payload as any)[k], (payload as any)[k]);
      }
    }

    this.isSaving.set(true);
    this.adminService.updateSettings(payload).subscribe({
      next: updated => {
        this.isSaving.set(false);
        const normalized = { ...updated };
        if ((updated as any).whatsApp && !normalized.whatsapp) {
          normalized.whatsapp = (updated as any).whatsApp;
        }
        this.settings.set(normalized);
        this.settingsService.settings.set(normalized);
        this.settingsService.applyCssThemeVariables(normalized);
        if (!silent) {
          this.toast.success('تم حفظ إعدادات وهوية المتجر وتحديث البيانات بنجاح! 🎨');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Save settings error:', err);
        this.toast.error(err.error?.message||'حدث خطأ أثناء حفظ الإعدادات في قاعدة البيانات.');
      }
    });
  }

  async onLogoUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 600, quality: 0.9, ...this.compressionOptions });
      this.adminService.uploadImage(compressed, 'branding').subscribe({
        next: url => {
          this.isUploading.set(false);
          if (this.settings()) {
            const previousUrl = this.settings()!.logoUrl;
            if (previousUrl && previousUrl !== url) this.adminService.deleteImageIfUnused(previousUrl).subscribe({ error: () => {} });
            this.settings.update(s => s ? { ...s, logoUrl: url } : s);
            this.saveSettings('branding', true);
            this.toast.success('تم تجهيز الشعار ورفعه بنجاح.');
          }
        },
        error: () => {
          this.isUploading.set(false);
          this.toast.error('فشل رفع الشعار.');
        }
      });
    } catch {
      this.isUploading.set(false);
      this.toast.error('حدث خطأ أثناء معالجة الشعار.');
    }
  }

  async onFaviconUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';
    this.isUploading.set(true);
    try {
      const icon = await compressImage(file, { maxWidth: 512, quality: 0.92, ...this.compressionOptions });
      this.adminService.uploadImage(icon, 'branding').subscribe({
        next: url => {
          this.isUploading.set(false);
          const previousUrl = this.settings()?.faviconUrl;
          if (previousUrl && previousUrl !== url) this.adminService.deleteImageIfUnused(previousUrl).subscribe({ error: () => {} });
          this.settings.update(s => s ? { ...s, faviconUrl: url } : s);
          this.saveSettings('branding', true);
          this.toast.success('تم تحديث أيقونة المتجر بنجاح.');
        },
        error: () => { this.isUploading.set(false); this.toast.error('تعذر رفع أيقونة المتجر.'); }
      });
    } catch {
      this.isUploading.set(false);
      this.toast.error('تعذر تجهيز أيقونة المتجر. جرّب صورة PNG أو WebP.');
    }
  }

  resetFavicon() {
    const previousUrl = this.settings()?.faviconUrl;
    if (previousUrl) this.adminService.deleteImageIfUnused(previousUrl).subscribe({ error: () => {} });
    this.settings.update(s => s ? { ...s, faviconUrl: '/assets/images/branding/store-mark.svg' } : s);
    this.saveSettings('branding', true);
    this.toast.success('تمت استعادة أيقونة المتجر الافتراضية.');
  }
  async onBannerDesktopUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.85, ...this.compressionOptions });
      this.adminService.uploadImage(compressed, 'banners').subscribe({
        next: url => {
          this.isUploading.set(false);
          if (this.settings()) {
            const previousUrl = this.settings()!.heroBannerDesktopUrl;
            if (previousUrl && previousUrl !== url) this.adminService.deleteImageIfUnused(previousUrl).subscribe({ error: () => {} });
            this.getActiveThemeBanner().desktopUrl = url;
              if (this.layoutOptions.homeTheme === 'cards' || !this.layoutOptions.homeTheme) {
                this.settings.update(s => s ? { ...s, heroBannerDesktopUrl: url } : s);
              }
            this.saveSettings('branding', true);
            this.toast.success('تم تجهيز البانر ورفعه بنجاح.');
          }
        },
        error: () => {
          this.isUploading.set(false);
          this.toast.error('فشل رفع البانر.');
        }
      });
    } catch {
      this.isUploading.set(false);
      this.toast.error('حدث خطأ أثناء معالجة البانر.');
    }
  }

  async onBannerMobileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1080, quality: 0.85, ...this.compressionOptions });
      this.adminService.uploadImage(compressed, 'banners').subscribe({
        next: url => {
          this.isUploading.set(false);
          if (this.settings()) {
            const previousUrl = this.settings()!.heroBannerMobileUrl;
            if (previousUrl && previousUrl !== url) this.adminService.deleteImageIfUnused(previousUrl).subscribe({ error: () => {} });
            this.getActiveThemeBanner().mobileUrl = url;
              if (this.layoutOptions.homeTheme === 'cards' || !this.layoutOptions.homeTheme) {
                this.settings.update(s => s ? { ...s, heroBannerMobileUrl: url } : s);
              }
            this.saveSettings('branding', true);
            this.toast.success('تم تجهيز بانر الموبايل ورفعه بنجاح.');
          }
        },
        error: () => {
          this.isUploading.set(false);
          this.toast.error('فشل رفع بانر الموبايل.');
        }
      });
    } catch {
      this.isUploading.set(false);
      this.toast.error('حدث خطأ أثناء معالجة بانر الموبايل.');
    }
  }

  removeLogo() {
    if (this.settings()) {
      const previousUrl = this.settings()!.logoUrl;
      if (previousUrl) this.adminService.deleteImageIfUnused(previousUrl).subscribe({ error: () => {} });
      this.settings.update(s => s ? { ...s, logoUrl: '' } : s);
      this.saveSettings('branding', true);
      this.toast.info('تم حذف اللوجو وحفظ التعديل في قاعدة البيانات.');
    }
  }

  removeBannerDesktop() {
    if (this.settings()) {
      const previousUrl = this.settings()!.heroBannerDesktopUrl;
      if (previousUrl) this.adminService.deleteImageIfUnused(previousUrl).subscribe({ error: () => {} });
      this.settings.update(s => s ? { ...s, heroBannerDesktopUrl: '' } : s);
      this.saveSettings('branding', true);
      this.toast.info('تم استعادة البانر الافتراضي وحفظ التعديل في قاعدة البيانات.');
    }
  }

  // Mecart Package Engine Methods
  loadPackageStats(): void {
    this.adminService.getPackageStats().subscribe({
      next: res => {
        if (res) { this.packageStats.set(res);
        }
      },
      error: () => {
        // Silently handle if not ready
      }
    });
  }

  onExportPackage(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.toast.info('جاري تجهيز وتحزيم ملفات المتجر والوسائط... يرجى الانتظار');

    this.adminService.exportStorePackage().subscribe({
      next: (blob: Blob) => {
        this.isExporting.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `store_backup_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toast.success('تم تنزيل حزمة المتجر بنجاح! احتفظ بها كنسخة احتياطية أو قالب للزرع.');
      },
      error: err => {
        this.isExporting.set(false);
        this.toast.error('حدث خطأ أثناء تصدير حزمة المتجر.');
        console.error(err);
      }
    });
  }

  onImportPackage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      this.toast.error('يرجى اختيار ملف مضغوط بصيغة ZIP (.zip).');
      return;
    }

    const clean = false;
    const confirmMsg = clean
      ? 'تحذير: لقد اخترت استبدال البيانات بالكامل! سيتم حذف الأصناف الحالية وتطبيق الحزمة الجديدة. هل تريد المتابعة؟'
      : 'سيتم استيراد الحزمة ودمج وتحديث بيانات المتجر واللغة الإنجليزية للأصناف والإعدادات الحالية بأمان بدون فقدان أي طلبات. هل تريد المتابعة؟';

    if (!confirm(confirmMsg)) {
      input.value = '';
      return;
    }

    this.isImporting.set(true);
    this.toast.info('جاري رفع واستيراد حزمة المتجر وتوزيع الصور في قاعدة البيانات...');

    this.adminService.importStorePackage(file, clean).subscribe({
      next: res => {
        this.isImporting.set(false);
        input.value = '';
        if (res && res.success) {
          this.toast.success(res.message || 'تم استيراد حزمة المتجر بنجاح!');
          this.loadSettings();
          this.loadPackageStats();
        } else {
          this.toast.error(res?.message || 'فشل استيراد الحزمة.');
        }
      },
      error: err => {
        this.isImporting.set(false);
        input.value = '';
        this.toast.error('حدث خطأ أثناء استيراد الحزمة: ' + (err?.error?.message || err.message));
        console.error(err);
      }
    });
  }

  onResetAndReseed(): void {
    if (!confirm('هل أنت متأكد من رغبتك في إعادة تهيئة بيانات المتجر إلى القالب الافتراضي النظيف؟')) {
      return;
    }

    this.isReseeding.set(true);
    this.toast.info('جاري إعادة تهيئة وحقن البيانات النظيفة للمتجر...');

    this.adminService.reseedSampleData().subscribe({
      next: () => {
        this.isReseeding.set(false);
        this.toast.success('تمت إعادة تهيئة البيانات الافتراضية بنجاح!');
        this.loadSettings();
        this.loadPackageStats();
      },
      error: err => {
        this.isReseeding.set(false);
        this.toast.error('فشلت عملية إعادة التهيئة.');
        console.error(err);
      }
    });
  }
}
