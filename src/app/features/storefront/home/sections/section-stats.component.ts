import { Component, Input, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Stats / Numbers Section
 * Displays luxury trust-building metrics (orders, happy clients, exclusive models, coverage)
 */
@Component({
  selector: 'app-section-stats',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  styles: [`
    .stats-section {
      padding: 2.75rem 1.25rem 2.25rem;
      border-radius: 1.5rem;
      margin-bottom: 2.5rem;
      background: linear-gradient(180deg, #ffffff 0%, #fcfaf6 100%);
      border: 1px solid #efe4d2;
      box-shadow: 0 4px 20px rgba(200, 138, 44, 0.04);
      text-align: center;
    }
    .stats-header {
      margin-bottom: 1.75rem;
    }
    .stats-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 750;
      letter-spacing: 0.04em;
      color: #b87a28;
      background: #fbf5eb;
      border: 1px solid #eed9b9;
      margin-bottom: 0.65rem;
      text-transform: uppercase;
      box-shadow: 0 2px 6px rgba(200, 138, 44, 0.08);
    }
    .stats-title {
      font-size: clamp(1.5rem, 3.5vw, 2.1rem);
      font-weight: 850;
      color: var(--text-main, #0f172a);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem;
    }
    @media (min-width: 768px) {
      .stats-grid {
        gap: 1.15rem;
      }
    }
    @media (min-width: 992px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
      }
    }
    .stat-card {
      padding: 1.35rem 0.85rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: #ffffff;
      border: 1px solid #ede1cf;
      border-radius: 1.15rem;
      box-shadow: 0 4px 14px rgba(200, 138, 44, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03);
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
      position: relative;
      overflow: hidden;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, #c88a2c, transparent);
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(200, 138, 44, 0.16);
      border-color: #c88a2c;
    }
    .stat-card:hover::before {
      opacity: 1;
    }
    .stat-icon-wrapper {
      width: 46px;
      height: 46px;
      border-radius: 13px;
      background: linear-gradient(135deg, #fef8ee 0%, #faedd3 100%);
      color: #b87a28;
      border: 1.5px solid #ebd4af;
      box-shadow: 0 2px 8px rgba(200, 138, 44, 0.12);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      line-height: 1;
      margin-bottom: 0.65rem;
      transition: transform 0.25s ease;
    }
    .stat-card:hover .stat-icon-wrapper {
      transform: scale(1.1);
    }
    .stat-number {
      font-size: clamp(1.65rem, 4vw, 2.25rem);
      font-weight: 900;
      color: #b87a28;
      background: linear-gradient(135deg, #c88a2c 0%, #9a6519 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1.15;
      margin-bottom: 0.35rem;
      font-variant-numeric: tabular-nums;
      direction: ltr;
      display: inline-block;
    }
    .stat-label {
      font-size: 0.88rem;
      font-weight: 750;
      color: #1e293b;
      margin: 0 0 0.25rem;
      line-height: 1.35;
    }
    .stat-sub {
      font-size: 0.74rem;
      color: #64748b;
      margin: 0;
      line-height: 1.35;
    }
    @media (max-width: 767px) {
      .stats-section {
        padding: 1.75rem 0.85rem 1.5rem;
        margin-bottom: 1.75rem;
      }
      .stat-card {
        padding: 1.1rem 0.65rem;
        border-radius: 14px;
        min-height: 145px;
      }
      .stat-icon-wrapper {
        width: 40px;
        height: 40px;
        font-size: 1.15rem;
        border-radius: 11px;
        margin-bottom: 0.45rem;
      }
      .stat-number {
        font-size: 1.5rem;
        margin-bottom: 0.25rem;
      }
      .stat-label {
        font-size: 0.8rem;
        margin-bottom: 0.2rem;
      }
      .stat-sub {
        font-size: 0.68rem;
      }
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
            <i [class]="'bi ' + item.icon" aria-hidden="true"></i>
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

        if (title === number || isNumericTitle) {
          if (!number && isNumericTitle) {
            number = title;
          }
          if (sub) {
            title = sub;
            sub = '';
          }
        }

        // Rich Enarat presets based on icon and content
        if (icon.includes('people') || title.includes('عميل')) {
          number = number || '+75,000';
          title = this.lang.text('عميل سعيد وموثوق', 'Happy Clients');
          sub = sub || this.lang.text('في مصر والخليج العربي', 'Across Egypt & GCC');
          icon = 'bi-people-fill';
        } else if (icon.includes('lamp') || title.includes('موديل') || title.includes('طاولات') || title.includes('نجف')) {
          number = number || '+2,000';
          title = this.lang.text('موديل وتصميم حصري', 'Exclusive Designs');
          sub = sub || this.lang.text('من النجف والطاولات والديكور', 'Lighting, Tables & Decor');
          icon = 'bi-lamp-fill';
        } else if (icon.includes('geo') || title.includes('محافظة')) {
          number = number || '27';
          title = this.lang.text('محافظة نصل إليها', 'Governorates Covered');
          sub = sub || this.lang.text('توصيل سريع خلال 24 - 48 ساعة', 'Fast 24-48h Delivery');
          icon = 'bi-geo-alt-fill';
        } else if (icon.includes('star') || title.includes('رضا') || title.includes('تقييم')) {
          number = number || '99.4%';
          title = this.lang.text('نسبة رضا العملاء', 'Client Satisfaction');
          sub = sub || this.lang.text('ضمان حقيقي وتقييمات إيجابية', 'Genuine Quality & Reviews');
          icon = 'bi-star-fill';
        } else {
          number = number || (isNumericTitle ? title : '+10K');
          icon = icon || 'bi-trophy-fill';
        }

        return {
          icon,
          number,
          title: title || '',
          sub: sub || ''
        };
      });
    }
    return [
      { icon: 'bi-people-fill', number: '+75,000', title: this.lang.text('عميل سعيد وموثوق', 'Happy Clients'), sub: this.lang.text('في مصر والخليج العربي', 'Across Egypt & GCC') },
      { icon: 'bi-lamp-fill', number: '+2,000', title: this.lang.text('موديل وتصميم حصري', 'Exclusive Designs'), sub: this.lang.text('من النجف والطاولات والديكور', 'Lighting, Tables & Decor') },
      { icon: 'bi-geo-alt-fill', number: '27', title: this.lang.text('محافظة نصل إليها', 'Governorates Covered'), sub: this.lang.text('توصيل سريع خلال 24 - 48 ساعة', 'Fast 24-48h Delivery') },
      { icon: 'bi-star-fill', number: '99.4%', title: this.lang.text('نسبة رضا العملاء', 'Client Satisfaction'), sub: this.lang.text('ضمان حقيقي وتقييمات إيجابية', 'Genuine Quality & Reviews') }
    ];
  }
}
