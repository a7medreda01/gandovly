import { Component, Input, inject , ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Stats / Numbers Section
 * Displays trust-building metrics (e.g. orders delivered, happy customers, product count)
 */
@Component({
  selector: 'app-section-stats',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  styles: [`
    .stats-section {
      padding: 3rem 1.5rem;
      border-radius: 1.5rem;
      margin-bottom: 2.5rem;
      background: var(--surface-card, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      text-align: center;
    }
    .stats-header {
      margin-bottom: 2rem;
    }
    .stats-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--primary-color, #c88a2c);
      background: color-mix(in srgb, var(--primary-color, #c88a2c) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--primary-color, #c88a2c) 25%, transparent);
      margin-bottom: 0.75rem;
      text-transform: uppercase;
    }
    .stats-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-main, #0f172a);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    @media (min-width: 992px) {
      .stats-grid { grid-template-columns: repeat(4, 1fr); }
    }
    .stat-card {
      padding: 1.75rem 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 1.25rem;
      box-shadow: 0 4px 18px rgba(15, 23, 42, 0.03);
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 26px color-mix(in srgb, var(--primary-color, #c88a2c) 16%, transparent);
      border-color: color-mix(in srgb, var(--primary-color, #c88a2c) 35%, transparent);
    }
    .stat-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: color-mix(in srgb, var(--primary-color, #c88a2c) 12%, #ffffff);
      color: var(--primary-color, #c88a2c);
      border: 1.5px solid color-mix(in srgb, var(--primary-color, #c88a2c) 25%, transparent);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      line-height: 1;
      margin-bottom: 0.85rem;
      transition: transform 0.25s ease;
    }
    .stat-card:hover .stat-icon-wrapper {
      transform: scale(1.1);
    }
    .stat-number {
      font-size: 2.25rem;
      font-weight: 850;
      color: var(--primary-color, #c88a2c);
      line-height: 1.1;
      margin-bottom: 0.45rem;
      font-variant-numeric: tabular-nums;
      direction: ltr;
      display: inline-block;
    }
    .stat-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
      margin: 0 0 0.25rem;
      line-height: 1.45;
    }
    .stat-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }
  `],
  template: `
<section class="stats-section container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null">
  <div class="stats-header">
    <span class="stats-badge"><i class="bi bi-award-fill"></i> {{ lang.text('ريادة وجودة موثوقة', 'Trusted Quality & Excellence') }}</span>
    <h2 class="stats-title">{{ title() }}</h2>
    @if (subtitle()) {
      <p class="text-muted mt-2 mb-0">{{ subtitle() }}</p>
    }
  </div>

  <div class="stats-grid">
    @for (item of statsList(); track $index) {
      <div class="stat-card">
        @if (item.icon) {
          <div class="stat-icon-wrapper">
            <i class="bi" [ngClass]="item.icon" aria-hidden="true"></i>
          </div>
        }
        <div class="stat-number">{{ item.number }}</div>
        <h3 class="stat-label">{{ item.title }}</h3>
        @if (item.sub) {
          <p class="stat-sub">{{ item.sub }}</p>
        }
      </div>
    }
  </div>
</section>
`
})
export class SectionStatsComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);

  title() { return this.lang.text(this.s.title || 'إنارات في أرقام', this.s.titleEn || 'Our Milestones'); }
  subtitle() { return this.lang.text(this.s.subtitle || 'نفخر بخدمة آلاف العملاء بكل حب واحترافية', this.s.subtitleEn || 'Proudly serving thousands of happy clients'); }

  statsList() {
    if (this.s.items && this.s.items.length > 0) {
      return this.s.items.map(it => {
        const rawIcon = (it.icon || '').trim();
        const isIconClass = /^(bi-|fa-|ph-|icon-)/.test(rawIcon) || rawIcon.includes('bi-') || rawIcon.includes(' ');
        
        let icon = isIconClass ? rawIcon : '';
        let number = ((it as any).number || '').trim();
        let title = this.lang.text(it.title, it.titleEn)?.trim() || '';
        let sub = this.lang.text(it.text, it.textEn)?.trim() || '';

        // If title starts with a digit/symbol, it is definitely a metric number (e.g. "+75,000", "99.4%", "27", "+2,000")
        const isNumericTitle = /^[+0-9%.,\sKkMmBb]+$/.test(title) || /^[+0-9]/.test(title);

        if (!number && isNumericTitle) {
          number = title;
          title = sub;
          sub = '';
        } else if (!number) {
          // If title was non-numeric Arabic text, detect known Enarat stats by icon to restore numbers:
          if (icon.includes('people')) { number = '+75,000'; }
          else if (icon.includes('lamp')) { number = '+2,000'; }
          else if (icon.includes('geo')) { number = '27'; }
          else if (icon.includes('star')) { number = '99.4%'; }
          else if (!isIconClass && rawIcon) { number = rawIcon; }
          else { number = '+10K'; }
        }

        return {
          icon: icon || 'bi-trophy',
          number,
          title: title || '',
          sub: sub || ''
        };
      });
    }
    return [
      { icon: 'bi-box-seam', number: '+15,000', title: this.lang.text('طلب مكتمل', 'Orders Completed'), sub: this.lang.text('في كافة المناطق', 'Nationwide delivery') },
      { icon: 'bi-star-fill', number: '99.4%', title: this.lang.text('رضا العملاء', 'Happy Customers'), sub: this.lang.text('تقييمات إيجابية', '5-star reviews') },
      { icon: 'bi-shield-check', number: '+500', title: this.lang.text('منتج أصلي', 'Curated Products'), sub: this.lang.text('بأعلى معايير الجودة', 'Guaranteed quality') },
      { icon: 'bi-headset', number: '24/7', title: this.lang.text('دعم فوري', 'Support Around Clock'), sub: this.lang.text('جاهزون لمساعدتك', 'Ready to assist') }
    ];
  }
}
