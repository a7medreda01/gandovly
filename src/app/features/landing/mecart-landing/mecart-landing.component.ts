import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface BusinessDomainItem {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  badge: string;
  description: string;
  isLive: boolean;
  demoRoute?: string;
  productCount: string;
  features: string[];
}

@Component({
  selector: 'app-mecart-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './mecart-landing.component.html',
  styleUrls: ['./mecart-landing.component.scss']
})
export class MecartLandingComponent {
  selectedDomainId = signal<string>('supermarket');

  // Quick store launcher form
  storeName = signal<string>('');
  storeSubdomain = signal<string>('');
  selectedIndustry = signal<string>('Supermarket');

  domains: BusinessDomainItem[] = [
    {
      id: 'supermarket',
      nameAr: 'سوبر ماركت وبقالة',
      nameEn: 'Supermarket & Grocery',
      icon: 'bi-basket2-fill',
      badge: 'ديمو حي متكامل (Live Now)',
      description: 'منظومة غذائية متكاملة تدعم التسعير بالوزن (كجم/جرام) والقطعة، عروض وتخفيضات، وتصنيف الأقسام السريعة.',
      isLive: true,
      demoRoute: '/store',
      productCount: '1,037+ منتج',
      features: ['تسعير بالوزن والقطعة', 'توصيل أحياء فوري', 'تصنيفات عريضة وبحث لحظي']
    },
    {
      id: 'restaurant',
      nameAr: 'مطاعم ومأكولات',
      nameEn: 'Restaurants & Cafes',
      icon: 'bi-cup-hot-fill',
      badge: 'قالب تفاعلي',
      description: 'منيو إلكتروني مع إضافات الوجبات، اختيارات الأحجام، شاشة تحضير للمطبخ، وطلب سريع عبر واتساب.',
      isLive: false,
      productCount: 'جاهز للتخصيص',
      features: ['تخصيص الوجبات والإضافات', 'شاشة عرض المطبخ KDS', 'حجز طاولات وطلب سفري']
    },
    {
      id: 'pharmacy',
      nameAr: 'صيدلية وعناية',
      nameEn: 'Pharmacy & Wellness',
      icon: 'bi-heart-pulse-fill',
      badge: 'قالب طبي',
      description: 'إدارة المستلزمات الطبية، العناية الشخصية، البحث بالاسم العلمي، ورفع الروشتات الطبية إلكترونياً.',
      isLive: false,
      productCount: 'جاهز للتخصيص',
      features: ['رفع الوصفات الطبية', 'تصنيف مستحضرات وأدوية', 'توصيل مبرد وسريع']
    },
    {
      id: 'autoparts',
      nameAr: 'قطع غيار ومعدات',
      nameEn: 'Auto & Spare Parts',
      icon: 'bi-gear-wide-connected',
      badge: 'قالب صناعي',
      description: 'كتالوج قطع الغيار بالأرقام الأصلية (OEM)، توافق الموديلات والماركات، ومتابعة المخزون بدقة.',
      isLive: false,
      productCount: 'جاهز للتخصيص',
      features: ['بحث برقم القطعة OEM', 'فلترة حسب ماركة السيارة', 'شحن طرود وأوزان ثقيلة']
    },
    {
      id: 'electronics',
      nameAr: 'إلكترونيات وأجهزة',
      nameEn: 'Electronics & Mobiles',
      icon: 'bi-laptop-fill',
      badge: 'قالب تكنولوجي',
      description: 'عرض مواصفات الأجهزة الذكية، فترات الضمان، الألوان ومساحات التخزين، والمقارنة الفورية.',
      isLive: false,
      productCount: 'جاهز للتخصيص',
      features: ['إدارة خيارات السعة واللون', 'بيانات الضمان والسيريال', 'بوابات دفع إلكتروني']
    },
    {
      id: 'retail',
      nameAr: 'أزياء وتجارة عامة',
      nameEn: 'Fashion & General Retail',
      icon: 'bi-bag-check-fill',
      badge: 'قالب عام',
      description: 'متجر ملابس وأحذية وإكسسوارات مع دليل المقاسات واختيارات الألوان وسرعة إتمام الطلب.',
      isLive: false,
      productCount: 'جاهز للتخصيص',
      features: ['جدول مقاسات ذكي', 'ألوان وصور متعددة', 'إشعار واتساب تلقائي']
    }
  ];

  constructor(private router: Router) {}

  selectDomain(id: string) {
    this.selectedDomainId.set(id);
  }

  updateSubdomainFromName(name: string) {
    this.storeName.set(name);
    // Convert Arabic/English text to a clean slug
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w-]/g, '');
    this.storeSubdomain.set(slug || 'mystore');
  }

  launchStore() {
    // Navigate to admin stores page with pre-filled state/query
    this.router.navigate(['/admin/stores'], {
      queryParams: {
        name: this.storeName() || undefined,
        domain: this.storeSubdomain() || undefined,
        industry: this.selectedIndustry()
      }
    });
  }
}

