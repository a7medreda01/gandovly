import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';
import { NotificationService } from '../../../../core/services/notification.service';

/**
 * Newsletter Section
 * Clean email subscription card with discount incentive and feedback toast
 */
@Component({
  selector: 'app-section-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollAnimateDirective],
  styles: [`
    .newsletter-card {
      background: var(--surface-card, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 1.5rem;
      padding: 3rem 1.5rem;
      text-align: center;
      margin-bottom: 2rem;
    }
    .newsletter-icon {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.1);
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
      color: var(--text-color, #0f172a);
    }
    .newsletter-subtitle {
      color: #64748b;
      font-size: 0.95rem;
      max-width: 480px;
      margin: 0 auto 1.75rem;
      line-height: 1.6;
    }
    .newsletter-form {
      display: flex;
      max-width: 460px;
      margin: 0 auto;
      gap: 0.5rem;
      flex-direction: column;
    }
    @media (min-width: 540px) {
      .newsletter-form { flex-direction: row; }
    }
    .newsletter-input {
      flex: 1;
      padding: 0.85rem 1.25rem;
      border-radius: 9999px;
      border: 1px solid var(--border-color, #cbd5e1);
      background: #ffffff;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .newsletter-input:focus {
      border-color: var(--primary-color, #10b981);
    }
    .btn-newsletter {
      padding: 0.85rem 1.75rem;
      border-radius: 9999px;
      border: none;
      background: var(--primary-color, #10b981);
      color: #ffffff;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    .btn-newsletter:hover { opacity: 0.9; }
    .success-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #10b981;
      font-weight: 600;
      padding: 0.75rem 1.5rem;
      background: rgba(16, 185, 129, 0.1);
      border-radius: 9999px;
    }
  `],
  template: `
<section class="newsletter-card container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null">
  <div class="newsletter-icon">
    <i class="bi bi-envelope-paper-heart"></i>
  </div>
  <h2 class="newsletter-title">{{ title() }}</h2>
  <p class="newsletter-subtitle">{{ subtitle() }}</p>

  @if (subscribed()) {
    <div class="success-badge">
      <i class="bi bi-check-circle-fill"></i>
      <span>{{ lang.text('شكراً لاشتراكك! ستصلك أحدث العروض قريباً.', 'Thank you for subscribing! Special offers coming soon.') }}</span>
    </div>
  } @else {
    <form class="newsletter-form" (submit)="$event.preventDefault(); submit()">
      <input type="email"
        class="newsletter-input"
        [(ngModel)]="email"
        name="email"
        [placeholder]="lang.text('أدخل بريدك الإلكتروني...', 'Enter your email address...')"
        required>
      <button type="submit" class="btn-newsletter">
        <span>{{ buttonText() }}</span>
        <i class="bi bi-arrow-left"></i>
      </button>
    </form>
  }
</section>
`
})
export class SectionNewsletterComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  private toast = inject(NotificationService);

  email = '';
  subscribed = signal(false);

  title() { return this.lang.text(this.s.title || 'اشترك في النشرة الإخبارية', this.s.titleEn || 'Join Our Newsletter'); }
  subtitle() { return this.lang.text(this.s.subtitle || 'احصل على خصم فوري 10% وأول من يعلم بالعروض والمنتجات الحصرية', this.s.subtitleEn || 'Get instant 10% off and be first to know about exclusive offers'); }
  buttonText() { return this.lang.text(this.s.buttonText || 'اشتراك', this.s.buttonTextEn || 'Subscribe'); }

  submit() {
    if (!this.email || !this.email.includes('@')) {
      this.toast.error(this.lang.text('يرجى إدخال بريد إلكتروني صحيح', 'Please enter a valid email'));
      return;
    }
    this.subscribed.set(true);
    this.toast.success(this.lang.text('تم الاشتراك بنجاح', 'Subscribed successfully'));
  }
}
