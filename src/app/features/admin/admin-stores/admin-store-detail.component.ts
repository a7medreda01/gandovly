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
  dnsConfigured = signal<boolean | null>(null);
  dnsChecking = signal<boolean>(false);

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
        if (s.customDomain && this.dnsConfigured() === null && !this.dnsChecking()) {
          this.checkDns(s.customDomain, false);
        }
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
  get effectiveDomain(): string {
    return (this.customDomainInput || this.store()?.customDomain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
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

  copyText(text: string, label: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.notice.success(`تم نسخ ${label}`);
      }).catch(() => {
        this.fallbackCopy(text, label);
      });
    } else {
      this.fallbackCopy(text, label);
    }
  }

  private fallbackCopy(text: string, label: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.notice.success(`تم نسخ ${label}`);
  }

  checkDns(domainToCheck?: string, showToast = true): void {
    const s = this.store();
    const dom = (domainToCheck || s?.customDomain || this.customDomainInput || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!dom) {
      if (showToast) this.notice.error('أدخل اسم الدومين أولاً لفحصه.');
      return;
    }
    this.dnsChecking.set(true);
    this.detailApi.get<{ domain: string; dnsConfigured: boolean }>(`admin/settings/custom-domain/check-dns?domain=${encodeURIComponent(dom)}`).subscribe({
      next: (res) => {
        this.dnsChecking.set(false);
        this.dnsConfigured.set(res?.dnsConfigured ?? false);
        if (showToast) {
          if (res?.dnsConfigured) {
            this.notice.success(`ممتاز! تم التحقق بنجاح من توجيه DNS لـ ${dom} ويعمل الآن.`);
          } else {
            this.notice.info(`لم تكتمل مزامنة DNS لـ ${dom} بعد في Hostinger. انتظر دقائق ثم أعد الفحص.`);
          }
        }
      },
      error: () => {
        this.dnsChecking.set(false);
        if (showToast) this.notice.error('تعذر فحص سجلات DNS حالياً.');
      }
    });
  }

  saveCustomDomainDirect(): void {
    const s = this.store();
    if (!s || this.domainDirectBusy) return;
    const clean = (this.customDomainInput || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean) {
      this.unlinkCustomDomain();
      return;
    }
    this.domainDirectBusy = true;
    this.detailApi.put<{ customDomain: string; dnsConfigured?: boolean }>('admin/tenants/' + s.id + '/custom-domain', { customDomain: clean }).subscribe({
      next: (res) => {
        this.domainDirectBusy = false;
        const dom = res?.customDomain || clean;
        this.stores.update(list => list.map(item => item.id === s.id ? { ...item, customDomain: dom } : item));
        if (res?.dnsConfigured !== undefined) {
          this.dnsConfigured.set(res.dnsConfigured);
        } else {
          this.checkDns(dom, false);
        }
        this.notice.success('تم حفظ وربط الدومين بنجاح!');
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
        this.dnsConfigured.set(null);
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
