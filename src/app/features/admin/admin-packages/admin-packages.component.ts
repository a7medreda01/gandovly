import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-packages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-packages.component.html',
  styleUrl: './admin-packages.component.scss'
})
export class AdminPackagesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(NotificationService);

  packageStats = signal<any>(null);
  isLoading = signal<boolean>(false);
  isExporting = signal<boolean>(false);
  isImporting = signal<boolean>(false);
  isReseeding = signal<boolean>(false);
  cleanBeforeImport = signal<boolean>(false);
  showGuideModal = signal<boolean>(false);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.adminService.getPackageStats().subscribe({
      next: res => {
        this.isLoading.set(false);
        if (res && res.data) {
          this.packageStats.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onExportPackage(): void {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.toast.info('جاري تجهيز وتحزيم ملفات المتجر والوسائط الكاملة... يرجى الانتظار');

    this.adminService.exportStorePackage().subscribe({
      next: (blob: Blob) => {
        this.isExporting.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mecart_full_package_${new Date().toISOString().slice(0, 10)}.zip`;
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
      ? 'تحذير: لقد اخترت استبدال البيانات بالكامل! سيتم حذف الأصناف والأقسام السابقة وتطبيق الحزمة الجديدة. هل تريد المتابعة؟'
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
          this.toast.success(res.message || 'تم استيراد حزمة المتجر وتطبيقها بنجاح!');
          this.loadStats();
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
    if (!confirm('تحذير: هل تريد إعادة تهيئة وحقن قاعدة البيانات بقالب السوبرماركت الافتراضي النظيف؟')) {
      return;
    }

    this.isReseeding.set(true);
    this.toast.info('جاري إعادة تهيئة البيانات وحقن قالب التجزئة النظيف...');

    this.adminService.reseedSampleData().subscribe({
      next: () => {
        this.isReseeding.set(false);
        this.toast.success('تمت إعادة تهيئة البيانات الافتراضية بنجاح!');
        this.loadStats();
      },
      error: err => {
        this.isReseeding.set(false);
        this.toast.error('فشلت عملية إعادة التهيئة.');
        console.error(err);
      }
    });
  }

  toggleGuide(): void {
    this.showGuideModal.set(!this.showGuideModal());
  }
}

