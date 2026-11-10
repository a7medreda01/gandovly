import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CommerceService } from '../../../core/services/commerce.service';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';

export interface CommerceTabInfo {
  id: string;
  name: string;
  icon: string;
  badge?: number | string;
  subtitle?: string;
  isPrimary?: boolean;
}

@Component({
  selector: 'app-admin-commerce',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-commerce.component.html',
  styleUrl: './admin-commerce.component.scss'
})
export class AdminCommerceComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly service = inject(CommerceService);
  private readonly api = inject(ApiService);
  private readonly toast = inject(NotificationService);
  readonly settingsService = inject(SettingsService);

  readonly dataState = signal<any>(null);
  get data() { return this.dataState(); }
  set data(v: any) { this.dataState.set(v); }

  readonly busyState = signal(false);
  get busy() { return this.busyState(); }
  set busy(v: boolean) { this.busyState.set(v); }

  readonly errorState = signal('');
  get error() { return this.errorState(); }
  set error(v: string) { this.errorState.set(v); }

  readonly productState = signal<any[]>([]);
  get products() { return this.productState(); }
  set products(v: any[]) { this.productState.set(v); }

  readonly showAllTools = signal(false);
  readonly currentTab = signal<string>('inquiries');
  get tab() { return this.currentTab(); }
  set tab(v: string) { this.currentTab.set(v); }

  search = '';
  productId = 0;
  reference = '';
  paymentOrderId = 0;
  codes = '';
  reviewNotes: Record<number, string> = {};
  day = '';

  resource: any = {
    name: '',
    capacity: 1,
    isActive: true,
    opensAt: '09:00',
    closesAt: '18:00',
    daysOfWeek: '0,1,2,3,4,5,6',
    blackouts: ''
  };

  batch: any = {
    lotNumber: '',
    expiresOn: '',
    quantity: 1
  };

  /**
   * Domain-specific configuration that adapts this page to the store's exact domain/preset.
   */
  readonly domainConfig = computed(() => {
    const s = this.settingsService.settings();
    const preset = s.activityPreset || '';
    const domain = s.defaultDomain || 'GeneralRetail';
    const isAll = preset === 'all' || s.isMultiDomain === true;

    if (isAll) {
      return {
        isAll: true,
        title: 'تشغيل النشاط الشامل لكافة المجالات',
        badge: 'متجر شامل',
        badgeIcon: 'bi-grid-fill',
        description: 'إدارة تشغيل متكاملة تضم الحجوزات، الروشتات، طلبات المعاينة والتسعير، الكتالوجات الرقمية، تواريخ الصلاحية، والاشتراكات.',
        defaultTab: 'inquiries',
        primaryTabs: ['inquiries', 'resources', 'digital', 'subscriptions', 'batches', 'prescriptions'],
        tabLabels: {
          inquiries: { name: 'طلبات المعاينة والتسعير والتقسيط', icon: 'bi-clipboard2-check', subtitle: 'طلبات الاستعلام والتقسيط وعروض الأسعار' },
          resources: { name: 'المواعيد والموارد وجدول العمل', icon: 'bi-calendar2-range', subtitle: 'أوقات وسعة فرق العمل والحجوزات' },
          digital: { name: 'الملفات والأكواد والضمانات', icon: 'bi-file-earmark-code', subtitle: 'ملفات PDF وأكواد التفعيل' },
          subscriptions: { name: 'الاشتراكات وتأكيد الدفع', icon: 'bi-wallet2', subtitle: 'تأكيد الدفع اليدوي والاشتراكات' },
          batches: { name: 'التشغيلات وتواريخ الصلاحية', icon: 'bi-calendar-check', subtitle: 'إدارة تواريخ الصلاحية والدفعات' },
          prescriptions: { name: 'الروشتات الطبية', icon: 'bi-file-earmark-medical', subtitle: 'مراجعة وصفات الأدوية' }
        }
      };
    }

    if (preset === 'furniture' || (!preset && domain === 'GeneralRetail')) {
      return {
        isAll: false,
        title: `تشغيل المتجر — ${s.businessDomainLabel || 'أثاث وديكور'}`,
        badge: s.businessDomainLabel || 'أثاث وديكور',
        badgeIcon: 'bi-shop-window',
        description: 'متابعة طلبات معاينة الموديلات، عروض الأسعار والتقسيط، جدولة مواعيد التسليم والمعاينات، وإدارة الكتالوجات والضمانات.',
        defaultTab: 'inquiries',
        primaryTabs: ['inquiries', 'resources', 'digital', 'subscriptions'],
        tabLabels: {
          inquiries: { name: 'طلبات المعاينة والتسعير والتقسيط', icon: 'bi-clipboard2-check-fill', subtitle: 'طلبات معاينة الموديلات وعروض الأسعار والتقسيط' },
          resources: { name: 'مواعيد المعاينة والتسليم الميداني', icon: 'bi-calendar2-range-fill', subtitle: 'إدارة أوقات وسعة فرق المعاينة والتسليم' },
          digital: { name: 'الكتالوجات والملفات والضمانات', icon: 'bi-file-earmark-pdf-fill', subtitle: 'كتالوجات PDF، شهادات الضمان، وأدلة التجميع' },
          subscriptions: { name: 'الدفعات وتأكيد العربون', icon: 'bi-wallet2', subtitle: 'تأكيد استلام دفعات العربون والتحويلات اليدوية' },
          batches: { name: 'دفعات الشحنات والبضائع', icon: 'bi-boxes', subtitle: 'أرقام شحنات البضائع المستوردة' },
          prescriptions: { name: 'الروشتات (خاص بالصيدليات)', icon: 'bi-file-medical', subtitle: 'غير مفعل لنشاط الأثاث' }
        }
      };
    }

    if (preset === 'pharmacy' || domain === 'Pharmacy') {
      return {
        isAll: false,
        title: 'تشغيل الصيدلية ومراجعة الروشتات',
        badge: 'صيدلية ومستحضرات',
        badgeIcon: 'bi-capsule',
        description: 'مراجعة الروشتات الطبية وصرف الأدوية الخاضعة للوصفة، ومراقبة دفعات وتواريخ انتهاء الصلاحية وتجنب الهدر.',
        defaultTab: 'prescriptions',
        primaryTabs: ['prescriptions', 'batches', 'inquiries', 'subscriptions'],
        tabLabels: {
          prescriptions: { name: 'الروشتات والوصفات الطبية', icon: 'bi-file-earmark-medical-fill', subtitle: 'مراجعة روشتات العملاء واعتماد الصرف' },
          batches: { name: 'تشغيلات وصلاحية الأدوية', icon: 'bi-hourglass-split', subtitle: 'تواريخ انتهاء الصلاحية وسحب الأقرب انتهاءً أولاً' },
          inquiries: { name: 'استفسارات الأدوية وتوفير النواقص', icon: 'bi-chat-dots-fill', subtitle: 'طلبات توفير أدوية ومستحضرات خاصة' },
          subscriptions: { name: 'اشتراكات الأدوية المزمنة', icon: 'bi-arrow-repeat', subtitle: 'صرف العلاج الدوري وتأكيد الدفع' },
          resources: { name: 'مواعيد الاستشارات الطبية', icon: 'bi-calendar-check', subtitle: 'جدولة استشارات الصيدلي' },
          digital: { name: 'الملفات والأكواد', icon: 'bi-qr-code', subtitle: 'كوبونات الخصم والملفات' }
        }
      };
    }

    if (preset === 'grocery' || preset === 'perishable' || domain === 'Supermarket') {
      return {
        isAll: false,
        title: 'تشغيل السوبر ماركت وتواريخ الصلاحية',
        badge: 'سوبر ماركت وبقالة',
        badgeIcon: 'bi-basket2-fill',
        description: 'إدارة تشغيلات المنتجات الغذائية وتواريخ الصلاحية بالقطع والوزن وسحب الأقرب انتهاءً أولاً، مع متابعة اشتراكات البقالة.',
        defaultTab: 'batches',
        primaryTabs: ['batches', 'subscriptions', 'inquiries', 'resources'],
        tabLabels: {
          batches: { name: 'تشغيلات وتواريخ صلاحية الأغذية', icon: 'bi-calendar-check-fill', subtitle: 'مراقبة الصلاحية بالقطع والوزن وسحب الأقرب انتهاءً' },
          subscriptions: { name: 'اشتراكات التوصيل الدوري', icon: 'bi-arrow-repeat', subtitle: 'طلبات البقالة الدورية وتأكيد الدفع' },
          inquiries: { name: 'طلبات الجملة والتوريد الخاص', icon: 'bi-box-seam-fill', subtitle: 'عروض أسعار توريدات الشركات والكميات الكبيرة' },
          resources: { name: 'فترات وسيارات التوصيل', icon: 'bi-truck', subtitle: 'إدارة سعة فترات التوصيل السريع' },
          digital: { name: 'كوبونات وقسائم رقمية', icon: 'bi-ticket-perforated-fill', subtitle: 'أكواد الخصم والقسائم' },
          prescriptions: { name: 'الروشتات (خاص بالصيدليات)', icon: 'bi-file-medical', subtitle: 'غير مفعل للسوبر ماركت' }
        }
      };
    }

    if (preset === 'restaurant' || domain === 'Restaurant') {
      return {
        isAll: false,
        title: 'تشغيل المطعم وحجوزات الصالة',
        badge: 'مطاعم ومأكولات',
        badgeIcon: 'bi-egg-fried',
        description: 'إدارة حجوزات الطاولات وسعة الصالة ومواعيد العمل، ومتابعة صلاحيات المواد الخام وتوريدات المطبخ.',
        defaultTab: 'resources',
        primaryTabs: ['resources', 'batches', 'inquiries'],
        tabLabels: {
          resources: { name: 'حجوزات الطاولات وسعة الصالة', icon: 'bi-calendar-event-fill', subtitle: 'إدارة أوقات العمل، سعة الطاولات، والغرف الخاصة' },
          batches: { name: 'صلاحية المواد الخام والمطبخ', icon: 'bi-fire', subtitle: 'مراقبة اللحوم والمواد الطازجة وتواريخ التوريد' },
          inquiries: { name: 'حجوزات الحفلات والبوفيهات', icon: 'bi-people-fill', subtitle: 'طلبات المناسبات، عروض الأسعار، وتأكيد العربون' },
          subscriptions: { name: 'اشتراكات الوجبات الشهرية', icon: 'bi-arrow-repeat', subtitle: 'باقات الوجبات وتأكيد الدفع' },
          digital: { name: 'الملفات وقوائم الطعام', icon: 'bi-file-earmark-text', subtitle: 'قوائم الطعام وملفات التحميل' },
          prescriptions: { name: 'الروشتات', icon: 'bi-file-medical', subtitle: 'غير مفعل للمطاعم' }
        }
      };
    }

    if (preset === 'auto-parts' || domain === 'AutoParts') {
      return {
        isAll: false,
        title: 'تشغيل قطع الغيار وطلبات التوافق',
        badge: 'قطع غيار سيارات',
        badgeIcon: 'bi-gear-wide-connected',
        description: 'مراجعة طلبات استعلام قطع الغيار ومطابقتها لموديل السيارة، عروض الأسعار والتقسيط، ومواعيد التركيب والصيانة.',
        defaultTab: 'inquiries',
        primaryTabs: ['inquiries', 'resources', 'batches'],
        tabLabels: {
          inquiries: { name: 'طلبات القطع وعروض الأسعار والتقسيط', icon: 'bi-car-front-fill', subtitle: 'فحص التوافق مع السيارة، عروض الأسعار والتقسيط' },
          resources: { name: 'مواعيد التركيب وورشة الصيانة', icon: 'bi-tools', subtitle: 'جدولة فترات التركيب ومواعيد الفنيين' },
          batches: { name: 'شحنات ودفعات القطع المستوردة', icon: 'bi-boxes', subtitle: 'تتبع أرقام شحنات القطع وتاريخ وصولها' },
          digital: { name: 'كتالوجات ومخططات التفكيك', icon: 'bi-file-earmark-pdf-fill', subtitle: 'كتالوجات ومخططات قطع الغيار' },
          subscriptions: { name: 'الدفعات والتقسيط', icon: 'bi-wallet2', subtitle: 'تأكيد دفعات التقسيط وقطع الغيار' },
          prescriptions: { name: 'الروشتات', icon: 'bi-file-medical', subtitle: 'خاص بالصيدليات' }
        }
      };
    }

    if (preset === 'electronics' || domain === 'Electronics') {
      return {
        isAll: false,
        title: 'تشغيل الإلكترونيات والخدمات الرقمية',
        badge: 'إلكترونيات وأجهزة',
        badgeIcon: 'bi-laptop',
        description: 'إدارة أكواد التفعيل وسيريالات الضمان، الملفات الرقمية، طلبات عروض الأسعار والتقسيط، ومواعيد الصيانة.',
        defaultTab: 'digital',
        primaryTabs: ['digital', 'inquiries', 'subscriptions', 'resources'],
        tabLabels: {
          digital: { name: 'الأكواد وسيريالات الضمان والتفعيل', icon: 'bi-key-fill', subtitle: 'إدارة وتوليد أكواد التفعيل والضمان المشفرة' },
          inquiries: { name: 'عروض أسعار الأجهزة والتقسيط', icon: 'bi-credit-card-2-front-fill', subtitle: 'طلبات تقسيط الأجهزة الإلكترونية وعروض الأسعار' },
          subscriptions: { name: 'اشتراكات الضمان الممتد والدعم', icon: 'bi-shield-check', subtitle: 'باقات الدعم الفني وتأكيد الدفع اليدوي' },
          resources: { name: 'مواعيد الصيانة والفحص الفني', icon: 'bi-wrench-adjustable', subtitle: 'حجز مواعيد الفحص الفني وزيارات الدعم' },
          batches: { name: 'دفعات الأجهزة والشحنات', icon: 'bi-boxes', subtitle: 'أرقام شحنات الأجهزة الإلكترونية' },
          prescriptions: { name: 'الروشتات', icon: 'bi-file-medical', subtitle: 'خاص بالصيدليات' }
        }
      };
    }

    if (preset === 'cars') {
      return {
        isAll: false,
        title: 'تشغيل معرض السيارات والمركبات',
        badge: 'معرض سيارات',
        badgeIcon: 'bi-car-front-fill',
        description: 'طلبات استعلام وفحص السيارات، عروض الأسعار والتقسيط، مواعيد تجربة القيادة والمعاينة، وتأكيد مقدمات الحجز.',
        defaultTab: 'inquiries',
        primaryTabs: ['inquiries', 'resources', 'subscriptions'],
        tabLabels: {
          inquiries: { name: 'طلبات الفحص وعروض الأسعار والتقسيط', icon: 'bi-car-front-fill', subtitle: 'طلبات المعاينة، عروض الأسعار، وتأكيد المقدم' },
          resources: { name: 'مواعيد تجربة القيادة والمعاينة', icon: 'bi-calendar-check-fill', subtitle: 'جدولة مواعيد فحص وتجربة السيارات' },
          subscriptions: { name: 'تأكيد استلام المقدمات والدفعات', icon: 'bi-wallet2', subtitle: 'تأكيد استلام دفعات حجز السيارات' },
          digital: { name: 'أوراق الفحص والكتالوجات', icon: 'bi-file-earmark-pdf', subtitle: 'تقارير فحص السيارات وكتالوجات المواصفات' },
          batches: { name: 'أرقام الشاسيه والدفعات', icon: 'bi-boxes', subtitle: 'إدارة شحنات المركبات' },
          prescriptions: { name: 'الروشتات', icon: 'bi-file-medical', subtitle: 'خاص بالصيدليات' }
        }
      };
    }

    // Default General Retail
    return {
      isAll: false,
      title: `تشغيل المتجر — ${s.businessDomainLabel || 'التجارة العامة'}`,
      badge: s.businessDomainLabel || 'متجر تجاري',
      badgeIcon: 'bi-shop',
      description: 'إدارة طلبات المعاينة والتسعير المخصص، مواعيد التسليم والمعاينات، والملفات الرقمية وتأكيد الدفعات.',
      defaultTab: 'inquiries',
      primaryTabs: ['inquiries', 'resources', 'digital', 'subscriptions'],
      tabLabels: {
        inquiries: { name: 'طلبات المعاينة والتسعير والتقسيط', icon: 'bi-clipboard2-check', subtitle: 'طلبات الاستعلام وعروض الأسعار' },
        resources: { name: 'مواعيد المعاينة والتسليم', icon: 'bi-calendar2-range', subtitle: 'إدارة أوقات فرق التسليم والمعاينة' },
        digital: { name: 'الملفات والكتالوجات والضمانات', icon: 'bi-file-earmark-pdf', subtitle: 'الكتالوجات الرقمية وأدلة الاستخدام' },
        subscriptions: { name: 'الدفعات وتأكيد العربون', icon: 'bi-wallet2', subtitle: 'تأكيد استلام الدفعات والتحويلات اليدوية' },
        batches: { name: 'التشغيلات والشحنات', icon: 'bi-boxes', subtitle: 'أرقام شحنات البضائع' },
        prescriptions: { name: 'الروشتات (خاص بالصيدليات)', icon: 'bi-file-medical', subtitle: 'خاص بالصيدليات' }
      }
    };
  });

  /**
   * Visible tabs based on whether the user is in domain-specific mode or "show all tools" mode.
   */
  readonly visibleTabs = computed<CommerceTabInfo[]>(() => {
    const cfg = this.domainConfig();
    const allTabIds = ['inquiries', 'resources', 'digital', 'subscriptions', 'batches', 'prescriptions'];
    const activeTabIds = (this.showAllTools() || cfg.isAll) ? allTabIds : cfg.primaryTabs;

    return activeTabIds.map(id => {
      const meta = (cfg.tabLabels as any)[id] || { name: id, icon: 'bi-app', subtitle: '' };
      let badge: number | string | undefined = undefined;

      if (id === 'inquiries' && this.data?.inquiries) {
        const pending = this.data.inquiries.filter((i: any) => i.status === 'Pending').length;
        if (pending > 0) badge = pending;
      } else if (id === 'prescriptions' && this.data?.prescriptions) {
        const pending = this.data.prescriptions.filter((p: any) => p.reviewStatus === 'Pending').length;
        if (pending > 0) badge = pending;
      } else if (id === 'batches' && this.data?.batches) {
        const urgent = this.data.batches.filter((b: any) => b.expired || b.expiringSoon).length;
        if (urgent > 0) badge = urgent;
      } else if (id === 'resources' && this.data?.resources) {
        badge = this.data.resources.length || undefined;
      }

      return {
        id,
        name: meta.name,
        icon: meta.icon,
        subtitle: meta.subtitle,
        badge,
        isPrimary: cfg.primaryTabs.includes(id)
      };
    });
  });

  /**
   * Domain-specific KPIs to give immediate insight to the store manager.
   */
  readonly domainKpis = computed(() => {
    const cfg = this.domainConfig();
    const d = this.data;
    if (!d) return [];

    const pendingInquiries = (d.inquiries || []).filter((i: any) => i.status === 'Pending').length;
    const approvedInquiries = (d.inquiries || []).filter((i: any) => i.status === 'Approved').length;
    const confirmedDeposits = (d.inquiries || []).filter((i: any) => i.depositConfirmed).length;
    const totalBookings = this.bookings.length;
    const activeAssets = (d.assets || []).filter((a: any) => a.isActive).length;
    const pendingPrescriptions = (d.prescriptions || []).filter((p: any) => p.reviewStatus === 'Pending').length;
    const expiringBatches = (d.batches || []).filter((b: any) => b.expired || b.expiringSoon).length;
    const totalBatches = (d.batches || []).length;
    const activeSubs = (d.subscriptions || []).filter((s: any) => s.state !== 'Revoked').length;

    if (cfg.primaryTabs.includes('prescriptions')) {
      return [
        { label: 'روشتات بانتظار المراجعة', value: pendingPrescriptions, icon: 'bi-file-earmark-medical-fill', tone: pendingPrescriptions > 0 ? 'warning' : 'primary', tabId: 'prescriptions' },
        { label: 'أدوية قريبة أو منتهية الصلاحية', value: expiringBatches, icon: 'bi-hourglass-split', tone: expiringBatches > 0 ? 'danger' : 'success', tabId: 'batches' },
        { label: 'إجمالي تشغيلات الصيدلية', value: totalBatches, icon: 'bi-capsule', tone: 'primary', tabId: 'batches' },
        { label: 'اشتراكات الأدوية الدورية', value: activeSubs, icon: 'bi-arrow-repeat', tone: 'primary', tabId: 'subscriptions' }
      ];
    }

    if (cfg.primaryTabs.includes('batches') && !cfg.primaryTabs.includes('inquiries')) {
      return [
        { label: 'أغذية منتهية أو قاربت الانتهاء', value: expiringBatches, icon: 'bi-calendar-x', tone: expiringBatches > 0 ? 'danger' : 'success', tabId: 'batches' },
        { label: 'دفعات وتشغيلات المخزون', value: totalBatches, icon: 'bi-boxes', tone: 'primary', tabId: 'batches' },
        { label: 'فترات الحجز والتوصيل', value: totalBookings, icon: 'bi-truck', tone: 'primary', tabId: 'resources' },
        { label: 'الاشتراكات الدورية النشطة', value: activeSubs, icon: 'bi-arrow-repeat', tone: 'primary', tabId: 'subscriptions' }
      ];
    }

    // Default for Furniture / GeneralRetail / AutoParts / Cars
    return [
      { label: 'طلبات معاينة وتسعير بانتظار الرد', value: pendingInquiries, icon: 'bi-clipboard2-pulse', tone: pendingInquiries > 0 ? 'warning' : 'primary', tabId: 'inquiries' },
      { label: 'عروض أسعار معتمدة', value: approvedInquiries, icon: 'bi-check2-circle', tone: 'success', tabId: 'inquiries' },
      { label: 'عربونات ودفعات مؤكدة', value: confirmedDeposits, icon: 'bi-wallet2', tone: 'primary', tabId: 'inquiries' },
      { label: 'مواعيد التسليم والمعاينة', value: totalBookings, icon: 'bi-calendar-event', tone: 'primary', tabId: 'resources' }
    ];
  });

  ngOnInit() {
    this.tab = this.domainConfig().defaultTab;
    this.load();
    this.loadProducts();
  }

  toggleToolMode() {
    this.showAllTools.update(v => !v);
  }

  setTab(tabId: string) {
    this.tab = tabId;
  }

  load() {
    this.error = '';
    this.service.dashboard().pipe(finalize(() => this.cdr.markForCheck())).subscribe({
      next: r => {
        this.data = r;
        // Make sure current tab is valid in visible tabs
        const currentValid = this.visibleTabs().some(t => t.id === this.tab);
        if (!currentValid) {
          this.tab = this.domainConfig().defaultTab;
        }
      },
      error: e => this.error = e.error?.message || 'تعذر تحميل بيانات التشغيل'
    });
  }

  loadProducts() {
    this.api.get<any>('admin/catalog/products', { search: this.search, pageSize: 100 })
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe(r => this.products = r.items || []);
  }

  action(path: string, body: any) {
    if (this.busy) return;
    this.busy = true;
    this.service.post(path, body).pipe(finalize(() => this.cdr.markForCheck())).subscribe({
      next: () => {
        this.busy = false;
        this.reference = '';
        this.toast.success('تم حفظ الإجراء بنجاح.');
        this.load();
      },
      error: e => {
        this.busy = false;
        this.toast.error(e.error?.message || 'تعذر تنفيذ الإجراء');
      }
    });
  }

  newResource() {
    this.resource = {
      name: '',
      capacity: 1,
      isActive: true,
      opensAt: '09:00',
      closesAt: '18:00',
      daysOfWeek: '0,1,2,3,4,5,6',
      blackouts: ''
    };
  }

  saveResource() {
    this.action('resources', {
      ...this.resource,
      blackoutDates: this.resource.blackouts.split(/[\s,]+/).filter(Boolean)
    });
  }

  editResource(r: any) {
    this.resource = {
      ...r,
      blackouts: JSON.parse(r.blackoutDatesJson || '[]').join('\n')
    };
  }

  saveBatch() {
    this.action('batches', {
      ...this.batch,
      productId: Number(this.productId)
    });
  }

  blockBatch(b: any) {
    this.api.patch('admin/commerce/batches/' + b.id, { isActive: b.isBlocked })
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: () => this.load(),
        error: e => this.toast.error(e.error?.message || 'تعذر التعديل')
      });
  }

  upload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.productId) return;
    this.busy = true;
    this.service.uploadDigital(Number(this.productId), file)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: () => {
          this.busy = false;
          this.load();
          this.toast.success('تم رفع الملف الخاص بنجاح.');
        },
        error: e => {
          this.busy = false;
          this.toast.error(e.error?.message || 'تعذر الرفع');
        }
      });
  }

  assetActive(a: any) {
    this.api.patch('admin/commerce/assets/' + a.id, { isActive: !a.isActive })
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe(() => this.load());
  }

  saveInquiry(row: any) {
    this.busy = true;
    this.api.put('admin/commerce/inquiries/' + row.id, row)
      .pipe(finalize(() => this.cdr.markForCheck()))
      .subscribe({
        next: () => {
          this.busy = false;
          this.load();
          this.toast.success('تم حفظ العرض والحالة بنجاح.');
        },
        error: e => {
          this.busy = false;
          this.toast.error(e.error?.message || 'تعذر الحفظ');
        }
      });
  }

  get bookings() {
    return [
      ...(this.data?.bookings || []),
      ...(this.data?.inquiries || [])
        .filter((i: any) => i.action === 'visit' && i.status === 'Approved')
        .map((i: any) => ({
          id: 'visit-' + i.id,
          inquiryId: i.id,
          resourceId: i.resourceId,
          productNameAr: 'معاينة',
          startsAt: i.preferredAt,
          endsAt: i.endsAt,
          quantity: 1,
          state: i.status
        }))
    ].filter((r: any) => !this.day || new Date(r.startsAt).toLocaleDateString('en-CA') === this.day);
  }

  resourceName(id: number) {
    return this.data?.resources?.find((r: any) => r.id === id)?.name || '#' + id;
  }

  getWhatsAppUrl(phone: string, customerName?: string, inquiryId?: number): string {
    if (!phone) return '';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '2' + clean;
    }
    const storeName = this.settingsService.settings().restaurantName || 'المتجر';
    const msg = encodeURIComponent(`مرحبًا ${customerName || 'عزيزي العميل'}، نتواصل معك بخصوص طلبك ${inquiryId ? '#' + inquiryId : ''} من ${storeName}`);
    return `https://wa.me/${clean}?text=${msg}`;
  }
}
