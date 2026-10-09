import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true
})
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | null | undefined, type: 'product' | 'category' | 'logo' | 'banner' = 'product'): string {
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

    // If absolute URL or data URL, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    // If pointing to /uploads or uploads, prefix with backend URL
    if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads')) {
      const apiHost = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
      const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return `${apiHost}${path}`;
    }

    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
}
