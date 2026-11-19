import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Full Width Call-to-Action Banner
 * Eye-catching banner for customized orders, support or special announcements
 */
@Component({
  selector: 'app-section-cta-full',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollAnimateDirective],
  styles: [`
    .cta-full-wrap {
      padding: 3.5rem 1.5rem;
      border-radius: 1.5rem;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, var(--primary-color, #10b981) 0%, #047857 100%);
      color: #ffffff;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.3);
    }
    .cta-eyebrow {
      display: inline-block;
      font-size: 0.8rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      background: rgba(255,255,255,0.2);
      padding: 0.3rem 1rem;
      border-radius: 9999px;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    .cta-title {
      font-size: 2.25rem;
      font-weight: 800;
      margin: 0 0 1rem;
      line-height: 1.25;
    }
    .cta-desc {
      font-size: 1.05rem;
      color: rgba(255,255,255,0.9);
      max-width: 580px;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }
    .btn-action-light {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      color: var(--primary-color, #047857);
      padding: 0.85rem 2.25rem;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 1rem;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    }
    .btn-action-light:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    }
  `],
  template: `
<section class="cta-full-wrap container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null"
  [style.color]="s.textColor || null">
  @if (eyebrow()) {
    <span class="cta-eyebrow">{{ eyebrow() }}</span>
  }
  <h2 class="cta-title">{{ title() }}</h2>
  @if (subtitle()) {
    <p class="cta-desc">{{ subtitle() }}</p>
  }
  <div>
    <a class="btn-action-light" [routerLink]="s.link || '/menu'">
      <span>{{ buttonText() }}</span>
      <i class="bi bi-arrow-left"></i>
    </a>
  </div>
</section>
`
})
export class SectionCtaFullComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);

  title() { return this.lang.text(this.s.title || 'هل تبحث عن طلب خاص أو مساعدة؟', this.s.titleEn || 'Looking for custom orders or help?'); }
  subtitle() { return this.lang.text(this.s.subtitle || 'فريقنا مستعد لتلبية كافة متطلباتك ومساعدتك على مدار الساعة', this.s.subtitleEn || 'Our team is ready to fulfill all your needs 24/7'); }
  eyebrow() { return this.lang.text(this.s.eyebrow, this.s.eyebrowEn); }
  buttonText() { return this.lang.text(this.s.buttonText || 'تواصل معنا الآن', this.s.buttonTextEn || 'Contact Us Now'); }
}
