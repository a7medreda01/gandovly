import { Component, inject, computed, effect, HostListener, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminStoresComponent, StoreTenant } from './admin-stores.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-store-detail.component.html',
  styleUrl: './admin-store-detail.component.scss'
})
export class AdminStoreDetailComponent extends AdminStoresComponent {
  private readonly router = inject(Router);
  private readonly detailApi = inject(ApiService);
  private readonly notice = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  readonly store = computed(() => this.stores().find(s => s.id === this.route.snapshot.paramMap.get('id')));

  // Registry Details Edit
  editing = false;
  saving = false;
  draft = { name: '', plan: 'Growth', ownerPhone: '', ownerEmail: '' };

  // Subdomain Management
  subdomainInput = '';
  subdomainBusy = false;

  // Custom Domain Management
  customDomainInput = '';
  domainDirectBusy = false;
  showDnsVerify = false;
  domainBusy = false;
  domainProof: any = null;

  // Store Status
  statusBusy = false;

  // Delete Store Modal & State
  isDeleteModalOpen = false;
  deleteConfirmSlug = '';
  deleteBusy = false;

  // Support Session Sections
  readonly sections = [
    { path: 'settings', label: 'الإعدادات والهوية والدومين' },
    { path: 'catalog', label: 'المنتجات والأقسام والخيارات' },
    { path: 'orders', label: 'الطلبات' },
    { path: 'delivery-zones', label: 'مناطق التوصيل' },
    { path: 'reports', label: 'التقارير' },
    { path: 'analytics', label: 'الإحصائيات' },
    { path: 'notifications', label: 'الإشعارات وواتساب' }
  ];

  constructor() {
    super();
    // Synchronize inputs with store values
    effect(() => {
      const s = this.store();
      if (s) {
        this.subdomainInput = s.subdomain;
        this.customDomainInput = s.customDomain || '';
      }
    });
  }

  private readonly dialogEffect = effect(onCleanup => {
    if (!this.supportLoginUrl()) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => document.querySelector<HTMLElement>('.support-dialog')?.focus(), 0);
    onCleanup(() => {
      clearTimeout(timer);
      document.body.style.overflow = overflow;
      previous?.focus();
    });
  });

  @HostListener('document:keydown', ['$event']) onDialogKey(event: KeyboardEvent) {
    if (this.supportLoginUrl()) {
      if (event.key === 'Escape') { event.preventDefault(); this.supportLoginUrl.set(null); }
      if (event.key === 'Tab') {
        const elements = Array.from(document.querySelectorAll<HTMLElement>('.support-dialog a,.support-dialog button'));
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement?.classList.contains('support-dialog'))) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement?.classList.contains('support-dialog'))) {
          event.preventDefault(); first?.focus();
        }
      }
    }
    if (this.isDeleteModalOpen && event.key === 'Escape' && !this.deleteBusy) {
      event.preventDefault();
      this.closeDeleteModal();
    }
  }

  // --- Subdomain Update ---
  updateSubdomain(): void {
    const s = this.store();
    if (!s || this.subdomainBusy) return;
    const clean = (this.subdomainInput || '').trim().toLowerCase();
    if (!clean || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(clean)) {
      this.notice.error('يرجى إدخال نطاق فرعي صالح (حروف إنجليزية صغيرة، أرقام، وشرطات فقط).');
      return;
    }
    if (clean === s.subdomain) {
      this.notice.info('النطاق الفرعي مطابق للنطاق الحالي.');
      return;
    }
    this.subdomainBusy = true;
    this.detailApi.put<{ subdomain: string }>('admin/tenants/' + s.id + '/subdomain', { subdomain: clean }).subscribe({
      next: (res) => {
        this.subdomainBusy = false;
        const newSlug = res?.subdomain || clean;
        this.stores.update(list => list.map(item => item.id === s.id ? { ...item, subdomain: newSlug } : item));
        this.notice.success('تم تغيير النطاق الفرعي بنجاح إلى: ' + newSlug);
      },
      error: (e) => {
        this.subdomainBusy = false;
        this.notice.error(e.error?.message || 'تعذر تغيير النطاق الفرعي.');
      }
    });
  }

  // --- Custom Domain Management ---
  saveCustomDomainDirect(): void {
    const s = this.store();
    if (!s || this.domainDirectBusy) return;
    const clean = (this.customDomainInput || '').trim().toLowerCase();
    if (!clean) {
      this.unlinkCustomDomain();
      return;
    }
    this.domainDirectBusy = true;
    this.detailApi.put<{ customDomain: string }>('admin/tenants/' + s.id + '/custom-domain', { customDomain: clean }).subscribe({
      next: (res) => {
        this.domainDirectBusy = false;
        const dom = res?.customDomain || clean;
        this.stores.update(list => list.map(item => item.id === s.id ? { ...item, customDomain: dom } : item));
        this.notice.success('تم ربط وتحديث الدومين المخصص بنجاح.');
      },
      error: (e) => {
        this.domainDirectBusy = false;
        this.notice.error(e.error?.message || 'تعذر ربط الدومين المخصص.');
      }
    });
  }

  unlinkCustomDomain(): void {
    const s = this.store();
    if (!s || this.domainDirectBusy) return;
    if (!confirm('هل تريد بالتأكيد إلغاء ربط الدومين المخصص من هذا المتجر؟')) return;
    this.domainDirectBusy = true;
    this.detailApi.put<{ customDomain: string | null }>('admin/tenants/' + s.id + '/custom-domain', { customDomain: null }).subscribe({
      next: () => {
        this.domainDirectBusy = false;
        this.customDomainInput = '';
        this.stores.update(list => list.map(item => item.id === s.id ? { ...item, customDomain: undefined } : item));
        this.notice.success('تم إلغاء ربط الدومين المخصص.');
      },
      error: (e) => {
        this.domainDirectBusy = false;
        this.notice.error(e.error?.message || 'تعذر إلغاء ربط الدومين.');
      }
    });
  }

  prepareDomain(): void {
    const s = this.store();
    if (!s || this.domainBusy) return;
    const clean = (this.customDomainInput || '').trim();
    if (!clean) {
      this.notice.error('أدخل اسم الدومين أولاً.');
      return;
    }
    this.domainBusy = true;
    this.domainProof = null;
    this.detailApi.post<any>('admin/tenants/' + s.id + '/custom-domain/challenge', { domain: clean }).subscribe({
      next: r => {
        this.domainBusy = false;
        this.domainProof = r;
        this.customDomainInput = r.domain;
      },
      error: e => {
        this.domainBusy = false;
        this.notice.error(e.error?.message || 'تعذر إنشاء سجلات التحقق.');
      }
    });
  }

  verifyDomain(): void {
    const s = this.store();
    if (!s || !this.domainProof || this.domainBusy) return;
    this.domainBusy = true;
    this.detailApi.post<any>('admin/tenants/' + s.id + '/custom-domain/verify', this.domainProof).subscribe({
      next: () => {
        this.domainBusy = false;
        this.domainProof = null;
        this.loadStores();
        this.notice.success('تم التحقق من DNS وربط الدومين بنجاح.');
      },
      error: e => {
        this.domainBusy = false;
        this.notice.error(e.error?.message || 'تعذر التحقق من سجل TXT.');
      }
    });
  }

  // --- Toggle Store Status ---
  override toggleStoreStatus(store: StoreTenant): void {
    if (this.statusBusy) return;
    const newStatus = store.status === 'Active' ? 'Suspended' : 'Active';
    this.statusBusy = true;
    this.detailApi.patch<boolean>('admin/tenants/' + store.id + '/status', { status: newStatus }).subscribe({
      next: () => {
        this.statusBusy = false;
        this.stores.update(list => list.map(item => item.id === store.id ? { ...item, status: newStatus } : item));
        this.notice.success(newStatus === 'Active' ? 'تم تفعيل المتجر بنجاح.' : 'تم إيقاف المتجر مؤقتاً.');
      },
      error: (e) => {
        this.statusBusy = false;
        this.notice.error(e.error?.message || 'تعذر تغيير حالة المتجر.');
      }
    });
  }

  // --- Delete Store Modal ---
  openDeleteModal(): void {
    this.deleteConfirmSlug = '';
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    if (this.deleteBusy) return;
    this.isDeleteModalOpen = false;
    this.deleteConfirmSlug = '';
  }

  confirmDeleteStore(): void {
    const s = this.store();
    if (!s || this.deleteBusy) return;
    if (this.deleteConfirmSlug.trim().toLowerCase() !== s.subdomain.toLowerCase()) {
      this.notice.error('اسم النطاق المدخل غير مطابق.');
      return;
    }
    this.deleteBusy = true;
    this.detailApi.delete<boolean>('admin/tenants/' + s.id).subscribe({
      next: () => {
        this.deleteBusy = false;
        this.isDeleteModalOpen = false;
        this.stores.update(list => list.filter(item => item.id !== s.id));
        this.notice.success(`تم حذف متجر [${s.name}] وجميع بياناته بنجاح.`);
        this.router.navigate(['/admin/stores']);
      },
      error: (e) => {
        this.deleteBusy = false;
        this.notice.error(e.error?.message || 'تعذر حذف المتجر.');
      }
    });
  }

  // --- Registry Details ---
  editDetails(): void {
    const s = this.store();
    if (s) {
      this.draft = {
        name: s.name,
        plan: s.plan,
        ownerPhone: s.ownerPhone || '',
        ownerEmail: s.ownerEmail || ''
      };
      this.editing = true;
    }
  }

  saveDetails(): void {
    const s = this.store();
    if (!s || this.saving) return;
    this.saving = true;
    this.detailApi.put<boolean>('admin/tenants/' + s.id + '/details', this.draft).subscribe({
      next: () => {
        this.saving = false;
        this.editing = false;
        this.loadStores();
        this.notice.success('تم حفظ بيانات سجل المتجر.');
      },
      error: e => {
        this.saving = false;
        this.notice.error(e.error?.message || 'تعذر حفظ البيانات.');
      }
    });
  }

  openSection(path: string): void {
    const s = this.store();
    if (!s) return;
    this.detailApi.post<{ loginPath: string }>('admin/tenants/' + s.id + '/support-access', {}).subscribe({
      next: r => {
        const url = new URL(r.loginPath, new URL(this.ownerLoginUrl(s)).origin);
        url.searchParams.set('section', path);
        this.supportLoginUrl.set(url.href);
      },
      error: () => this.notice.error('تعذر إنشاء جلسة الدعم. اختر متجرًا نشطًا.')
    });
  }
}
