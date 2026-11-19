import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Custom Story / Markdown / Rich-Text Section
 * For store story, brand heritage, or customized announcements
 */
@Component({
  selector: 'app-section-markdown',
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  styles: [`
    .story-section {
      padding: 3.5rem 1.5rem;
      border-radius: 1.5rem;
      margin-bottom: 2rem;
      background: var(--surface-card, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .story-inner {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    .story-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-color, #0f172a);
      margin: 0 0 1rem;
    }
    .story-body {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #475569;
    }
  `],
  template: `
<section class="story-section container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null"
  [style.color]="s.textColor || null">
  <div class="story-inner">
    @if (eyebrow()) {
      <span class="badge mb-2" style="background:rgba(16,185,129,0.1);color:var(--primary-color,#10b981)">{{ eyebrow() }}</span>
    }
    <h2 class="story-title">{{ title() }}</h2>
    <div class="story-body">
      @if (s.markdownContent) {
        <div [innerHTML]="s.markdownContent"></div>
      } @else {
        <p>{{ subtitle() }}</p>
      }
    </div>
  </div>
</section>
`
})
export class SectionMarkdownComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);

  title() { return this.lang.text(this.s.title || 'قصتنا', this.s.titleEn || 'Our Story'); }
  subtitle() { return this.lang.text(this.s.subtitle || 'نؤمن بتقديم أفضل المنتجات وأعلى جودة لتجربة تسوق لا تُنسى.', this.s.subtitleEn || 'Committed to delivering high quality and an exceptional shopping experience.'); }
  eyebrow() { return this.lang.text(this.s.eyebrow, this.s.eyebrowEn); }
}
