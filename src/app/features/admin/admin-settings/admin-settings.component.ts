import { Component, OnInit, inject, signal } from '@angular/core';
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
  imports: [CommonModule, FormsModule, ImageUrlPipe, LoadingStateComponent, PhoneInputComponent],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss'
})
export class AdminSettingsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  readonly settingsService = inject(SettingsService);
  private readonly toast = inject(NotificationService);

  activeTab = signal<'discounts' | 'branding' | 'policies' | 'info' | 'packages'>('discounts');
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

  setRadius(prop: 'borderRadius' | 'buttonBorderRadius', px: number): void {
    const current = this.settings();
    if (current) {
      this.settings.update(s => s ? { ...s, [prop]: `${px}px` } : s);
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
      this.settingsService.applyCssThemeVariables(current);
    }
  }

  ngOnInit() {
    this.loadSettings();
    this.loadPackageStats();
  }

  loadSettings() {
    this.isLoading.set(true);
    this.adminService.getSettings().subscribe({
      next: s => {
        const normalized = { ...s };
        if ((s as any).whatsApp && !normalized.whatsapp) {
          normalized.whatsapp = (s as any).whatsApp;
        }
        this.settings.set(normalized);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  saveSettings(section?: string, silent = false) {
    const current = this.settings();
    if (!current) return;

    const payload = {
      ...current,
      timeZone: current.timeZone || 'Africa/Cairo',
      locale: current.locale || 'ar-EG',
      countryCode: current.countryCode || 'EG',
      phoneCountryCode: current.phoneCountryCode || '+20',
      fontFamily: current.fontFamily || 'Cairo',
      whatsApp: current.whatsapp || (current as any).whatsApp || '01010415774',
      WhatsApp: current.whatsapp || (current as any).whatsApp || '01010415774',
      whatsapp: current.whatsapp || (current as any).whatsApp || '01010415774'
    };

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
        this.toast.error('حدث خطأ أثناء حفظ الإعدادات في قاعدة البيانات.');
      }
    });
  }

  async onLogoUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 600, quality: 0.9 });
      this.adminService.uploadImage(compressed, 'branding').subscribe({
        next: url => {
          this.isUploading.set(false);
          if (this.settings()) {
            this.settings.update(s => s ? { ...s, logoUrl: url } : s);
            this.saveSettings('branding', true);
            this.toast.success('تم ضغط الشعار ورفعه بنجاح بصيغة WebP.');
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

  async onBannerDesktopUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1920, quality: 0.85 });
      this.adminService.uploadImage(compressed, 'banners').subscribe({
        next: url => {
          this.isUploading.set(false);
          if (this.settings()) {
            this.settings.update(s => s ? { ...s, heroBannerDesktopUrl: url } : s);
            this.saveSettings('branding', true);
            this.toast.success('تم ضغط البانر ورفعه بنجاح بصيغة WebP فائقة السرعة.');
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
      const compressed = await compressImage(file, { maxWidth: 1080, quality: 0.85 });
      this.adminService.uploadImage(compressed, 'banners').subscribe({
        next: url => {
          this.isUploading.set(false);
          if (this.settings()) {
            this.settings.update(s => s ? { ...s, heroBannerMobileUrl: url } : s);
            this.saveSettings('branding', true);
            this.toast.success('تم ضغط بانر الموبايل ورفعه بنجاح بصيغة WebP فائقة السرعة.');
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
      this.settings.update(s => s ? { ...s, logoUrl: '' } : s);
      this.saveSettings('branding', true);
      this.toast.info('تم حذف اللوجو وحفظ التعديل في قاعدة البيانات.');
    }
  }

  removeBannerDesktop() {
    if (this.settings()) {
      this.settings.update(s => s ? { ...s, heroBannerDesktopUrl: '' } : s);
      this.saveSettings('branding', true);
      this.toast.info('تم استعادة البانر الافتراضي وحفظ التعديل في قاعدة البيانات.');
    }
  }

  // Mecart Package Engine Methods
  loadPackageStats(): void {
    this.adminService.getPackageStats().subscribe({
      next: res => {
        if (res && res.data) {
          this.packageStats.set(res.data);
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
        a.download = `mecart_store_package_${new Date().toISOString().slice(0, 10)}.zip`;
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

    const clean = this.cleanBeforeImport();
    const confirmMsg = clean
      ? 'تحذير: لقد اخترت استبدال البيانات بالكامل! سيتم حذف الأصناف الحالية وتطبيق الحزمة الجديدة. هل تريد المتابعة؟'
      : 'سيتم استيراد الحزمة ودمج الأقسام والمنتجات الجديدة. هل تريد المتابعة؟';

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
