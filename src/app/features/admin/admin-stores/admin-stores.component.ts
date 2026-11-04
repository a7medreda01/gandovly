import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';

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
    businessDomain: 'Supermarket' as const,
    plan: 'Growth' as const,
    seedTemplate: 'supermarket-carrefour',
    ownerPhone: '',
    ownerEmail: '',
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

  // Statistics
  totalStores = computed(() => this.stores().length);
  activeStores = computed(() => this.stores().filter(s => s.status === 'Active').length);
  customDomainsCount = computed(() => this.stores().filter(s => !!s.customDomain).length);
  totalProductsAcrossStores = computed(() => this.stores().reduce((acc, s) => acc + s.productsCount, 0));

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    const saved = localStorage.getItem('mecart_tenants_registry');
    if (saved) {
      try {
        this.stores.set(JSON.parse(saved));
        return;
      } catch { }
    }

    // Default Seed Stores in Platform Registry
    const defaults: StoreTenant[] = [
      {
        id: 't-super-01',
        name: 'كارفور مصر — سوبرماركت التوفير',
        subdomain: 'super',
        customDomain: 'supermarket1.runasp.net',
        businessDomain: 'Supermarket',
        plan: 'Pro',
        status: 'Active',
        productsCount: 1037,
        ownerPhone: '+201148472670',
        ownerEmail: 'carrefour@mecart.app',
        createdAt: '2026-11-01',
        logoUrl: '/assets/images/branding/logo.png'
      },
      {
        id: 't-rest-02',
        name: 'مطعم ومشويات الأصيل',
        subdomain: 'alaseel',
        customDomain: '',
        businessDomain: 'Restaurant',
        plan: 'Growth',
        status: 'Active',
        productsCount: 68,
        ownerPhone: '+201000000001',
        ownerEmail: 'alaseel@mecart.app',
        createdAt: '2026-11-02'
      },
      {
        id: 't-pharma-03',
        name: 'صيدليات الشفاء والعناية',
        subdomain: 'elshifaa',
        customDomain: 'elshifaa-pharma.com',
        businessDomain: 'Pharmacy',
        plan: 'Enterprise',
        status: 'Active',
        productsCount: 412,
        ownerPhone: '+201000000002',
        ownerEmail: 'pharma@mecart.app',
        createdAt: '2026-11-03'
      },
      {
        id: 't-auto-04',
        name: 'سبيد أوتو لقطع غيار السيارات',
        subdomain: 'speedauto',
        customDomain: '',
        businessDomain: 'AutoParts',
        plan: 'Growth',
        status: 'Active',
        productsCount: 185,
        ownerPhone: '+201000000003',
        ownerEmail: 'parts@mecart.app',
        createdAt: '2026-11-04'
      }
    ];

    this.stores.set(defaults);
    this.saveStoresToStorage();
  }

  saveStoresToStorage(): void {
    localStorage.setItem('mecart_tenants_registry', JSON.stringify(this.stores()));
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
      enableInstantSSL: true
    };
    this.isModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isModalOpen.set(false);
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

    setTimeout(() => {
      const created: StoreTenant = {
        id: 't-' + Date.now().toString(36),
        name: this.newStore.name.trim(),
        subdomain: cleanSubdomain,
        customDomain: this.newStore.customDomain.trim() || undefined,
        businessDomain: this.newStore.businessDomain,
        plan: this.newStore.plan,
        status: 'Active',
        productsCount: this.newStore.seedTemplate === 'supermarket-carrefour' ? 1037 : 24,
        ownerPhone: this.newStore.ownerPhone.trim() || '+201148472670',
        ownerEmail: this.newStore.ownerEmail.trim() || `${cleanSubdomain}@mecart.app`,
        createdAt: new Date().toISOString().slice(0, 10)
      };

      this.stores.update(list => [created, ...list]);
      this.saveStoresToStorage();
      this.isCreating.set(false);
      this.closeCreateModal();

      this.toast.success(`تم إنشاء المتجر وتفعيله بنجاح! الرابط: https://${created.subdomain}.mecart.app`);
    }, 1000);
  }

  toggleStoreStatus(store: StoreTenant): void {
    const newStatus = store.status === 'Active' ? 'Suspended' : 'Active';
    const actionText = newStatus === 'Active' ? 'تنشيط' : 'إيقاف';

    this.stores.update(list =>
      list.map(s => s.id === store.id ? { ...s, status: newStatus } : s)
    );
    this.saveStoresToStorage();
    this.toast.info(`تم ${actionText} متجر [${store.name}] بنجاح.`);
  }

  exportStoreZip(store: StoreTenant): void {
    this.toast.info(`جاري تصدير حزمة متجر [${store.name}] الكاملة...`);
    this.adminService.exportStorePackage().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mecart_${store.subdomain}_package.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toast.success(`تم تنزيل حزمة متجر [${store.name}] بنجاح!`);
      },
      error: () => {
        this.toast.error('حدث خطأ أثناء تصدير حزمة المتجر.');
      }
    });
  }

  deleteStore(store: StoreTenant): void {
    if (!confirm(`تحذير نهائي: هل أنت متأكد من حذف متجر [${store.name}]؟ سيتم حذف بيانات ونطاق المتجر نهائياً!`)) {
      return;
    }

    this.stores.update(list => list.filter(s => s.id !== store.id));
    this.saveStoresToStorage();
    this.toast.success(`تم حذف متجر [${store.name}] بنجاح.`);
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

