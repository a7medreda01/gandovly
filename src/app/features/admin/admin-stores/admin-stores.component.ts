import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

export interface StoreTenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  businessDomain: 'Supermarket' | 'Restaurant' | 'Pharmacy' | 'AutoParts' | 'Electronics' | 'GeneralRetail';
  plan: 'Trial' | 'Growth' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Suspended' | 'Pending';
  productsCount: number;
  ownerPhone: string;
  ownerEmail: string;
  createdAt: string;
  logoUrl?: string;
  ownerAccess?: { username: string; password: string; loginPath: string };
}

@Component({
  selector: 'app-admin-stores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-stores.component.html',
  styleUrl: './admin-stores.component.scss'
})
export class AdminStoresComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  protected readonly authService = inject(AuthService);
  readonly canDeleteStore = computed(() => this.authService.currentAdmin()?.canDeleteStore === true || this.authService.currentAdmin()?.role === 'SuperAdmin');
  supportLoginUrl = signal<string | null>(null);
  createdOwnerAccess = signal<{ username: string; password: string; url: string } | null>(null);
  loadError = signal<string>('');
  private readonly toast = inject(NotificationService);

  // Search & Filters
  searchQuery = signal<string>('');
  selectedDomainFilter = signal<string>('all');
  selectedStatusFilter = signal<string>('all');

  // Stores State
  stores = signal<StoreTenant[]>([]);
  isLoading = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  isModalOpen = signal<boolean>(false);

  // New Store Form Bindings
  newStore = {
    name: '',
    subdomain: '',
    customDomain: '',
    businessDomain: 'Supermarket' as StoreTenant['businessDomain'],
    plan: 'Growth' as const,
    seedTemplate: 'supermarket-carrefour',
    ownerPhone: '',
    ownerEmail: '',
    ownerUsername: 'owner',
    ownerPassword: '',
    enableInstantSSL: true
  };

  businessDomainList = [
    { id: 'Supermarket', label: 'سوبر ماركت وتجزئة شاملة', icon: 'bi-basket2-fill', color: '#10B981', desc: 'أصناف طازجة ومجمدة، بيع بالقطعة والوزن' },
    { id: 'Restaurant', label: 'مطاعم وكافيهات ومأكولات', icon: 'bi-egg-fried', color: '#F59E0B', desc: 'قوائم وجبات، إضافات، خيارات الطهي والأحجام' },
    { id: 'Pharmacy', label: 'صيدليات ومستحضرات تجميل', icon: 'bi-capsule', color: '#3B82F6', desc: 'مستلزمات طبية، باركود، ورفع الروشتات' },
    { id: 'AutoParts', label: 'قطع غيار ومستلزمات سيارات', icon: 'bi-gear-wide-connected', color: '#8B5CF6', desc: 'فلترة الماركات والموديلات ورقم OEM' },
    { id: 'Electronics', label: 'أجهزة وإلكترونيات وهواتف', icon: 'bi-laptop', color: '#EC4899', desc: 'مواصفات تقنية، ألوان، وضمان الأجهزة' },
    { id: 'GeneralRetail', label: 'محلات أزياء ومتاجر عامة', icon: 'bi-shop', color: '#6366F1', desc: 'ألوان ومقاسات ومجموعات منتجات سريعة' }
  ];

  plansList = [
    { id: 'Trial', label: 'باقة تجريبية (14 يوم مجاناً)' },
    { id: 'Growth', label: 'باقة النمو (Growth) — 39$/شهرياً' },
    { id: 'Pro', label: 'باقة المحترفين (Pro) — 79$/شهرياً' },
    { id: 'Enterprise', label: 'باقة المؤسسات (Enterprise) — مخصصة' }
  ];

  filteredStores = computed(() => {
    let list = this.stores();
    const q = this.searchQuery().trim().toLowerCase();
    const domain = this.selectedDomainFilter();
    const status = this.selectedStatusFilter();

    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.subdomain.toLowerCase().includes(q) ||
        (s.customDomain && s.customDomain.toLowerCase().includes(q)) ||
        s.ownerPhone.includes(q)
      );
    }

    if (domain !== 'all') {
      list = list.filter(s => s.businessDomain === domain);
    }

    if (status !== 'all') {
      list = list.filter(s => s.status === status);
    }

    return list;
  });

  page = signal(1);
  readonly pageSize = 10;
  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredStores().length / this.pageSize)));
  pagedStores = computed(() => this.filteredStores().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));

  // Statistics
  totalStores = computed(() => this.stores().length);
  activeStores = computed(() => this.stores().filter(s => s.status === 'Active').length);
  customDomainsCount = computed(() => this.stores().filter(s => !!s.customDomain).length);
  totalProductsAcrossStores = computed(() => this.stores().reduce((acc, s) => acc + s.productsCount, 0));

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.api.get<StoreTenant[]>('admin/tenants').subscribe({
      next: stores => { this.stores.set(stores); this.page.set(1); this.isLoading.set(false); },
      error: () => { this.loadError.set('تعذر تحميل المتاجر. تحقق من الاتصال وسجل الدخول مجددًا.'); this.isLoading.set(false); }
    });
  }

  openCreateModal(): void {
    this.newStore = {
      name: '',
      subdomain: '',
      customDomain: '',
      businessDomain: 'Supermarket',
      plan: 'Growth',
      seedTemplate: 'supermarket-carrefour',
      ownerPhone: '',
      ownerEmail: '',
    ownerUsername: 'owner',
    ownerPassword: '',
      enableInstantSSL: true
    };
    this.isModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (!this.isCreating()) this.isModalOpen.set(false);
  }

  autoSlug(): void {
    if (this.newStore.name && !this.newStore.subdomain) {
      this.newStore.subdomain = this.newStore.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    }
  }

  onSubmitNewStore(): void {
    if (!this.newStore.name.trim()) {
      this.toast.error('يرجى إدخال اسم المتجر.');
      return;
    }

    const cleanSubdomain = (this.newStore.subdomain || 'store' + Math.floor(Math.random() * 900 + 100))
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');

    // Check duplicate subdomain
    if (this.stores().some(s => s.subdomain.toLowerCase() === cleanSubdomain)) {
      this.toast.error('هذا النطاق الفرعي محجوز بالفعل! يرجى اختيار اسم نطاق آخر.');
      return;
    }

    this.isCreating.set(true);
    this.toast.info(`جاري تأسيس متجر [${this.newStore.name}] وزراعة القالب الأولي...`);

    this.api.post<StoreTenant>('admin/tenants', { ...this.newStore, subdomain: cleanSubdomain, ownerPassword: this.newStore.ownerPassword || null }).subscribe({
      next: store => {
        const { ownerAccess, ...publicStore } = store;
        this.stores.update(list => [publicStore, ...list]);
        this.page.set(1);
        this.isCreating.set(false);
        this.closeCreateModal();
        if (store.ownerAccess) this.createdOwnerAccess.set({ ...store.ownerAccess, url: this.ownerLoginUrl(store) });
        this.newStore.ownerPassword = '';
        this.toast.success('تم إنشاء المتجر وزراعة ' + store.productsCount + ' منتج بنجاح.');
      },
      error: error => {
        this.isCreating.set(false);
        this.toast.error(error.error?.message || 'فشل إنشاء المتجر.');
      }
    });
  }

  toggleStoreStatus(store: StoreTenant): void {
    const status = store.status === 'Active' ? 'Suspended' : 'Active';
    this.api.patch<boolean>('admin/tenants/' + store.id + '/status', { status }).subscribe({
      next: () => this.loadStores(),
      error: () => this.toast.error('تعذر تغيير الحالة؛ المتجر الأساسي محمي.')
    });
  }

  exportStoreZip(store: StoreTenant): void {
    this.http.get(this.api.baseUrl + '/admin/tenants/' + store.id + '/export', { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'mecart_' + store.subdomain + '_package.zip';
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('تعذر تصدير حزمة هذا المتجر.')
    });
  }

  deleteStore(store: StoreTenant): void {
    this.toast.info('يمكن إيقاف المتجر مع الاحتفاظ ببياناته من زر الحالة. الحذف النهائي غير متاح.');
  }

  openSupport(store: StoreTenant): void {
    this.api.post<{loginPath: string}>('admin/tenants/' + store.id + '/support-access', {}).subscribe({
      next: response => {
        const url = new URL(response.loginPath, new URL(this.ownerLoginUrl(store)).origin);
        this.supportLoginUrl.set(url.href);
      },
      error: () => this.toast.error('تعذر إنشاء جلسة الدعم. اختر متجرًا نشطًا.')
    });
  }

  ownerLoginUrl(store: StoreTenant): string {
    return ['127.0.0.1', 'localhost'].includes(window.location.hostname)
      ? window.location.origin + '/admin/login?tenant=' + encodeURIComponent(store.subdomain)
      : 'https://' + store.subdomain + '.mecart.app/admin/login';
  }

  storeUrl(store: StoreTenant): string {
    return window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
      ? window.location.origin + '/?tenant=' + encodeURIComponent(store.subdomain)
      : 'https://' + store.subdomain + '.mecart.app';
  }

  getDomainBadgeClass(domain: string): string {
    switch (domain) {
      case 'Supermarket': return 'badge-supermarket';
      case 'Restaurant': return 'badge-restaurant';
      case 'Pharmacy': return 'badge-pharmacy';
      case 'AutoParts': return 'badge-autoparts';
      case 'Electronics': return 'badge-electronics';
      case 'GeneralRetail': return 'badge-retail';
      default: return 'badge-secondary';
    }
  }

  getDomainLabel(domain: string): string {
    const found = this.businessDomainList.find(d => d.id === domain);
    return found ? found.label : domain;
  }
}

