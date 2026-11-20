import { Component, Input, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Newsletter / VIP Club Promo Section
 * Clean promotional card with direct CTA button (no email input required)
 */
@Component({
  selector: 'app-section-newsletter',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollAnimateDirective],
  styles: [`
    .newsletter-card {
      background: var(--surface-card, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 1.5rem;
      padding: 3rem 1.5rem;
      text-align: center;
      margin-bottom: 2rem;
      color: var(--nl-text, #0f172a);
    }
    .newsletter-icon {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: color-mix(in srgb, var(--primary-color, #10b981) 12%, transparent);
      color: var(--primary-color, #10b981);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin-bottom: 1.25rem;
    }
    .newsletter-title {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0 0 0.5rem;
      color: var(--nl-text, #0f172a);
    }
    .newsletter-subtitle {
      color: color-mix(in srgb, var(--nl-text, #0f172a) 68%, transparent);
      font-size: 0.95rem;
      max-width: 480px;
      margin: 0 auto 1.75rem;
      line-height: 1.6;
    }
    .newsletter-actions {
      display: flex;
      justify-content: center;
    }
    .btn-newsletter {
      padding: 0.85rem 2rem;
      border-radius: 9999px;
      border: none;
      background: var(--btn-primary-bg, var(--primary-color, #10b981));
      color: var(--btn-primary-text, #ffffff);
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      white-space: nowrap;
      transition: opacity 0.2s, transform 0.2s;
    }
    .btn-newsletter:hover { opacity: 0.92; transform: translateY(-1px); }
  `],
  template: `
<section class="newsletter-card container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null"
  [style.color]="effectiveTextColor()"
  [style.--nl-text]="effectiveTextColor()">
  <div class="newsletter-icon">
    <i class="bi bi-stars"></i>
  </div>
  <h2 class="newsletter-title">{{ title() }}</h2>
  <p class="newsletter-subtitle">{{ subtitle() }}</p>

  @if (buttonText()) {
    <div class="newsletter-actions">
      <a class="btn-newsletter" [routerLink]="linkPath()" [queryParams]="linkQuery()">
        <span>{{ buttonText() }}</span>
        <i class="bi bi-arrow-left"></i>
      </a>
    </div>
  }
</section>
`
})
export class SectionNewsletterComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);

  title() { return this.lang.text(this.s.title || 'اشترك في عروضنا الحصرية', this.s.titleEn || 'Join Our Exclusive Offers'); }
  subtitle() { return this.lang.text(this.s.subtitle || 'اكتشف أحدث العروض والمنتجات المميزة في متجرنا', this.s.subtitleEn || 'Discover the latest offers and featured products in our store'); }
  buttonText() { return this.lang.text(this.s.buttonText || 'تسوق الآن', this.s.buttonTextEn || 'Shop Now'); }
  linkPath(): string { return (this.s.link || '/menu').split('?')[0] || '/menu'; }
  linkQuery(): Record<string, string> {
    const q = (this.s.link || '').split('?')[1];
    return q ? Object.fromEntries(new URLSearchParams(q)) : {};
  }
  effectiveTextColor(): string {
    if (this.s.textColor?.trim()) return this.s.textColor.trim();
    if (this.s.backgroundColor?.trim()) {
      const hex = this.s.backgroundColor.replace('#', '').trim();
      if (hex.length === 6) {
        const b = (parseInt(hex.slice(0, 2), 16) * 299 + parseInt(hex.slice(2, 4), 16) * 587 + parseInt(hex.slice(4, 6), 16) * 114) / 1000;
        return b >= 150 ? '#0f172a' : '#ffffff';
      }
    }
    return '#0f172a';
  }
}
