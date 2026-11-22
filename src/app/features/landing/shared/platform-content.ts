export const WHATSAPP_NUMBER = '201080225502';

export function buildWhatsAppUrl(
  lang: 'ar' | 'en',
  customAr?: string,
  customEn?: string
): string {
  const defaultAr = 'مرحباً فريق RunX، أرغب في إطلاق متجر على منصة MeCart';
  const defaultEn = 'Hello RunX team, I would like to launch a store on MeCart';
  const message = lang === 'en' ? (customEn || defaultEn) : (customAr || defaultAr);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export interface PlatformMetric {
  value: string;
  labelAr: string;
  labelEn: string;
}

export const PLATFORM_METRICS: PlatformMetric[] = [
  { value: '99.99%', labelAr: 'استقرار سحابي', labelEn: 'Cloud Uptime' },
  { value: '< 0.8s', labelAr: 'سرعة فائقة', labelEn: 'Instant Load' },
  { value: '1-Click', labelAr: 'نقل فوري', labelEn: 'Seed Engine' },
  { value: 'SSL', labelAr: 'نطاقك الخاص', labelEn: 'Custom Domain' }
];

export interface PlatformIndustry {
  id: string;
  icon: string;
  labelAr: string;
  labelEn: string;
  shortAr: string;
  shortEn: string;
}

export const PLATFORM_INDUSTRIES: PlatformIndustry[] = [
  {
    id: 'Supermarket',
    icon: 'bi-basket2',
    labelAr: 'سوبر ماركت',
    labelEn: 'Supermarket',
    shortAr: 'تسعير بالوزن والقطعة',
    shortEn: 'Weight & unit pricing'
  },
  {
    id: 'Restaurant',
    icon: 'bi-cup-hot',
    labelAr: 'مطاعم وكافيهات',
    labelEn: 'Restaurants',
    shortAr: 'منيو وإضافات سريعة',
    shortEn: 'Menus & live modifiers'
  },
  {
    id: 'Pharmacy',
    icon: 'bi-capsule',
    labelAr: 'صيدليات',
    labelEn: 'Pharmacies',
    shortAr: 'أصناف وبحث فوري',
    shortEn: 'Catalog & fast lookup'
  },
  {
    id: 'Electronics',
    icon: 'bi-laptop',
    labelAr: 'إلكترونيات',
    labelEn: 'Electronics',
    shortAr: 'مواصفات وموديلات',
    shortEn: 'Specs & variants'
  },
  {
    id: 'AutoParts',
    icon: 'bi-gear',
    labelAr: 'قطع غيار',
    labelEn: 'Auto Parts',
    shortAr: 'فلاتر توافق دقيقة',
    shortEn: 'Precision part filters'
  },
  {
    id: 'GeneralRetail',
    icon: 'bi-shop',
    labelAr: 'أثاث وتجارة',
    labelEn: 'Retail & Home',
    shortAr: 'معارض وكتالوج حديث',
    shortEn: 'Modern storefront UI'
  }
];

export interface PlatformService {
  id: string;
  icon: string;
  accent: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  tagsAr: string[];
  tagsEn: string[];
}

export const PLATFORM_SERVICES: PlatformService[] = [
  {
    id: 'hosting',
    icon: 'bi-cloud-check',
    accent: '#10B981',
    titleAr: 'استضافة سحابية مُدارة',
    titleEn: 'Managed Cloud',
    descAr: 'خوادم سريعة وشبكة CDN بمعدل جاهزية 99.99%.',
    descEn: 'High-speed cloud infrastructure with 99.99% uptime.',
    tagsAr: ['استقرار 99.99%', 'توزيع CDN'],
    tagsEn: ['99.99% Uptime', 'Global CDN']
  },
  {
    id: 'domain',
    icon: 'bi-globe2',
    accent: '#3B82F6',
    titleAr: 'نطاقات مخصصة وSSL',
    titleEn: 'Custom Domains',
    descAr: 'نطاق فرعي فوري أو ربط دومينك الخاص بشهادة أمان.',
    descEn: 'Instant subdomain or your own domain with SSL.',
    tagsAr: ['دومين خاص', 'حماية SSL'],
    tagsEn: ['Your Domain', 'Auto SSL']
  },
  {
    id: 'seed-engine',
    icon: 'bi-file-earmark-zip',
    accent: '#6366F1',
    titleAr: 'محرك نقل البيانات',
    titleEn: 'Seed Engine',
    descAr: 'نسخ وتصدير كامل المتجر والصور بضغطة زر واحدة.',
    descEn: 'Export and migrate full store data in one click.',
    tagsAr: ['نسخ فوري', 'نقل سلس'],
    tagsEn: ['1-Click Backup', 'Zero Downtime']
  },
  {
    id: 'whatsapp',
    icon: 'bi-whatsapp',
    accent: '#10B981',
    titleAr: 'ربط واتساب التجاري',
    titleEn: 'WhatsApp Cloud',
    descAr: 'إرسال فواتير الطلب وتحديثات الشحن للعملاء آلياً.',
    descEn: 'Automated order receipts and delivery updates.',
    tagsAr: ['فواتير آلية', 'تأكيد فوري'],
    tagsEn: ['Auto Invoices', 'Order Alerts']
  },
  {
    id: 'delivery',
    icon: 'bi-geo-alt',
    accent: '#06B6D4',
    titleAr: 'مناطق ورسوم التوصيل',
    titleEn: 'Delivery Zones',
    descAr: 'تسعير ذكي للشحن حسب المحافظة والحي تلقائياً.',
    descEn: 'Dynamic shipping rates by city and neighborhood.',
    tagsAr: ['تسعير جغرافي', 'تتبع الشحن'],
    tagsEn: ['Geo Pricing', 'Live Tracking']
  },
  {
    id: 'multi-industry',
    icon: 'bi-layers',
    accent: '#8B5CF6',
    titleAr: 'واجهات متعددة الأنشطة',
    titleEn: 'Adaptive Themes',
    descAr: 'قوالب وتصميمات مخصصة لكل نشاط تجاري وهوية.',
    descEn: 'Tailored storefronts crafted for any retail vertical.',
    tagsAr: ['ثيمات مرنة', 'عربي وإنجليزي'],
    tagsEn: ['Custom Layouts', 'AR & EN']
  }
];

export const DOMAIN_LABELS: Record<string, { ar: string; en: string }> = {
  Supermarket: { ar: 'سوبر ماركت وبقالة', en: 'Supermarket' },
  Restaurant: { ar: 'مطاعم وكافيهات', en: 'Restaurants' },
  Pharmacy: { ar: 'صيدليات ومستحضرات', en: 'Pharmacies' },
  AutoParts: { ar: 'قطع غيار ومعدات', en: 'Auto Parts' },
  Electronics: { ar: 'إلكترونيات وأجهزة', en: 'Electronics' },
  GeneralRetail: { ar: 'أثاث وتجارة عامة', en: 'Retail & Home' }
};

export function getLocalizedDomainLabel(
  domain: string,
  fallback: string,
  lang: 'ar' | 'en'
): string {
  const entry = DOMAIN_LABELS[domain];
  if (entry) {
    return lang === 'en' ? entry.en : entry.ar;
  }
  return fallback || domain || (lang === 'en' ? 'Online Store' : 'متجر إلكتروني');
}
