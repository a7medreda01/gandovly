import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SettingsService } from '../../../core/services/settings.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StorefrontSettings } from '../../../core/models/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUrlPipe, LoadingStateComponent],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss'
})
export class AdminSettingsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  readonly settingsService = inject(SettingsService);
  private readonly toast = inject(NotificationService);

  activeTab = signal<'discounts' | 'branding' | 'policies' | 'info'>('discounts');
  settings = signal<StorefrontSettings | null>(null);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isUploading = signal<boolean>(false);

  ngOnInit() {
    this.loadSettings();
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
      timeZone: 'Africa/Cairo',
      locale: 'ar-EG',
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

  onLogoUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.adminService.uploadImage(file, 'branding').subscribe({
      next: url => {
        this.isUploading.set(false);
        if (this.settings()) {
          this.settings.update(s => s ? { ...s, logoUrl: url } : s);
          this.saveSettings('branding', true);
          this.toast.success('تم رفع الشعار وحفظه في قاعدة البيانات بنجاح.');
        }
      },
      error: () => {
        this.isUploading.set(false);
        this.toast.error('فشل رفع الشعار.');
      }
    });
  }

  onBannerDesktopUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.adminService.uploadImage(file, 'banners').subscribe({
      next: url => {
        this.isUploading.set(false);
        if (this.settings()) {
          this.settings.update(s => s ? { ...s, heroBannerDesktopUrl: url } : s);
          this.saveSettings('branding', true);
          this.toast.success('تم رفع البانر وحفظه في قاعدة البيانات بنجاح.');
        }
      },
      error: () => {
        this.isUploading.set(false);
        this.toast.error('فشل رفع البانر.');
      }
    });
  }

  onBannerMobileUpload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.isUploading.set(true);
    this.adminService.uploadImage(file, 'banners').subscribe({
      next: url => {
        this.isUploading.set(false);
        if (this.settings()) {
          this.settings.update(s => s ? { ...s, heroBannerMobileUrl: url } : s);
          this.saveSettings('branding', true);
          this.toast.success('تم رفع بانر الموبايل وحفظه في قاعدة البيانات بنجاح.');
        }
      },
      error: () => {
        this.isUploading.set(false);
        this.toast.error('فشل رفع بانر الموبايل.');
      }
    });
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
}
