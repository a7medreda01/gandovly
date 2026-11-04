import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

export function resolveCategoryPng(hint?: string): string {
  if (!hint) return '/assets/images/categories/rice-pasta.png';
  const h = hint.toLowerCase();
  if (h.includes('أرز') || h.includes('مكرونة') || h.includes('بقوليات') || h.includes('rice')) return '/assets/images/categories/rice-pasta.png';
  if (h.includes('زيت') || h.includes('زيوت') || h.includes('سمن') || h.includes('توابل') || h.includes('صلص') || h.includes('oil')) return '/assets/images/categories/cooking-oil.png';
  if (h.includes('لبن') || h.includes('ألبان') || h.includes('جبن') || h.includes('أجبان') || h.includes('بيض') || h.includes('dairy')) return '/assets/images/categories/dairy-eggs.png';
  if (h.includes('حلو') || h.includes('حلويات') || h.includes('شوكو') || h.includes('بسكويت') || h.includes('sweet')) return '/assets/images/categories/sweets-chocolate.png';
  if (h.includes('غذائية') || h.includes('استهلاك') || h.includes('سكر') || h.includes('دقيق') || h.includes('sugar')) return '/assets/images/categories/baking-sugar.png';
  if (h.includes('سناكس') || h.includes('شيبس') || h.includes('مقرمش') || h.includes('snack') || h.includes('chip')) return '/assets/images/categories/chips-snacks.png';
  if (h.includes('شاي') || h.includes('قهوة') || h.includes('كافيه') || h.includes('ساخنة') || h.includes('tea') || h.includes('coffee')) return '/assets/images/categories/tea-coffee.png';
  if (h.includes('شخصية') || h.includes('عناية') || h.includes('صحة') || h.includes('جمال') || h.includes('care')) return '/assets/images/categories/personal-care.png';
  if (h.includes('معلب') || h.includes('محفوظ') || h.includes('تونا') || h.includes('صلصة') || h.includes('canned')) return '/assets/images/categories/canned-food.png';
  if (h.includes('عصير') || h.includes('عصائر') || h.includes('مياه') || h.includes('مشروب') || h.includes('beverage') || h.includes('water')) return '/assets/images/categories/beverages-water.png';
  if (h.includes('منظف') || h.includes('صابون') || h.includes('مسحوق') || h.includes('منزل') || h.includes('clean')) return '/assets/images/categories/cleaning.png';
  if (h.includes('مطعم') || h.includes('مطاعم') || h.includes('مأكولات') || h.includes('سمك') || h.includes('بحري') || h.includes('restaurant')) return '/assets/images/categories/restaurant.png';
  if (h.includes('صيدل') || h.includes('دواء') || h.includes('أدوية') || h.includes('طبي') || h.includes('pharma')) return '/assets/images/categories/pharmacy.png';
  if (h.includes('غيار') || h.includes('سيار') || h.includes('موتور') || h.includes('auto')) return '/assets/images/categories/autoparts.png';
  if (h.includes('إلكترون') || h.includes('أجهز') || h.includes('كمبيوتر') || h.includes('لاب') || h.includes('electr')) return '/assets/images/categories/electronics.png';
  return '/assets/images/categories/rice-pasta.png';
}

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    type: 'product' | 'category' | 'logo' | 'banner' = 'product',
    version?: string | number | Date | null,
    nameHint?: string
  ): string {
    // Only apply fallback when no custom/uploaded image value is provided
    if (!value || typeof value !== 'string' || value.trim() === '') {
      switch (type) {
        case 'logo':
          return '/assets/images/branding/logo.png';
        case 'banner':
          return '/assets/images/banners/hero-desktop.jpg';
        case 'category':
          return resolveCategoryPng(nameHint);
        case 'product':
        default:
          return '/assets/images/categories/rice-pasta.png';
      }
    }

    const trimmed = value.trim();

    let fullUrl = trimmed;
    // If absolute URL or data URL, keep it
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
      if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads')) {
        let apiHost = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
        if (!apiHost || apiHost.startsWith('/')) {
          apiHost = 'https://supermarket1.runasp.net';
        }
        const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        fullUrl = `${apiHost}${path}`;
      } else {
        fullUrl = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      }
    }

    // Attach version parameter for instant cache-busting when admin updates images,
    // while remaining 100% cached on client when browsing categories.
    if (version && !fullUrl.startsWith('data:')) {
      const vStr = typeof version === 'object' && version instanceof Date
        ? version.getTime().toString()
        : String(version);
      const sep = fullUrl.includes('?') ? '&' : '?';
      return `${fullUrl}${sep}v=${encodeURIComponent(vStr)}`;
    }

    return fullUrl;
  }
}
