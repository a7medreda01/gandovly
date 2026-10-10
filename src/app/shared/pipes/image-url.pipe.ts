import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    type: 'product' | 'category' | 'logo' | 'banner' = 'product',
    version?: string | number | Date | null
  ): string {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      switch (type) {
        case 'logo':
          return '/assets/images/branding/logo.png';
        case 'banner':
          return '/assets/images/branding/hero-desktop.jpg';
        case 'category':
          return '/assets/images/products/clams-gandofli.jpg';
        case 'product':
        default:
          return '/assets/images/products/fish-bolti-fried.jpg';
      }
    }

    const trimmed = value.trim();

    let fullUrl = trimmed;
    // If absolute URL or data URL, keep it
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
      if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads')) {
        const apiHost = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
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
