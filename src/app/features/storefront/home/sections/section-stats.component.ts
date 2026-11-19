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
      margin-bottom: 2rem;
      background: var(--surface-card, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      text-align: center;
    }
    .stats-header {
      margin-bottom: 2.5rem;
    }
    .stats-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-color, #0f172a);
      margin: 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    @media (min-width: 768px) {
      .stats-grid { grid-template-columns: repeat(4, 1fr); }
    }
    .stat-card {
      padding: 1.25rem 0.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .stat-icon {
      font-size: 2.2rem;
      line-height: 1;
      margin-bottom: 0.65rem;
      color: var(--primary-color, #10b981);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon i {
      display: inline-block;
    }
    .stat-number {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--primary-color, #10b981);
      line-height: 1.1;
      margin-bottom: 0.5rem;
      font-variant-numeric: tabular-nums;
    }
    .stat-label {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-color, #1e293b);
      margin: 0 0 0.25rem;
    }
    .stat-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin: 0;
    }
  `],
  template: `
<section class="stats-section container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null">
  <div class="stats-header">
    <h2 class="stats-title">{{ title() }}</h2>
    @if (subtitle()) {
      <p class="text-muted mt-2">{{ subtitle() }}</p>
    }
  </div>

  <div class="stats-grid">
    @for (item of statsList(); track $index) {
      <div class="stat-card">
        @if (item.icon) {
          <div class="stat-icon">
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

  title() { return this.lang.text(this.s.title || 'إنجازاتنا بالأرقام', this.s.titleEn || 'Our Milestones'); }
  subtitle() { return this.lang.text(this.s.subtitle || 'نفخر بخدمة آلاف العملاء بكل حب واحترافية', this.s.subtitleEn || 'Proudly serving thousands of happy clients'); }

  statsList() {
    if (this.s.items && this.s.items.length > 0) {
      return this.s.items.map(it => {
        const rawIcon = (it.icon || '').trim();
        const isIconClass = /^(bi-|fa-|ph-|icon-)/.test(rawIcon) || rawIcon.includes('bi-') || rawIcon.includes(' ');
        
        let icon = '';
        let number = ((it as any).number || '').trim();
        let title = this.lang.text(it.title, it.titleEn)?.trim() || '';
        let sub = this.lang.text(it.text, it.textEn)?.trim() || '';

        if (isIconClass) {
          icon = rawIcon;
        }

        if (!number) {
          // If title starts with a digit or looks like a stat number (e.g. "+75,000", "99.4%", "2,000+", "27")
          const isNumericTitle = /^[+0-9%.,\sKkMmBb]+$/.test(title) || /^[+0-9]/.test(title);
          if (isNumericTitle) {
            number = title;
            title = sub;
            sub = '';
          } else if (!isIconClass && rawIcon) {
            number = rawIcon;
          } else {
            number = title;
            title = sub;
            sub = '';
          }
        }

        return {
          icon,
          number: number || '+10K',
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
