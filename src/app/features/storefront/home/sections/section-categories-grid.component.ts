import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ImageRevealDirective } from '../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';
import { CatalogService } from '../../../../core/services/catalog.service';

/**
 * Categories Grid / Collections Section (Image 4 reference)
 * Large full-width/grid collection cards with high-res images, overlaid typography,
 * and elegant dark theme borders.
 */
@Component({
  selector: 'app-section-categories-grid',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, ImageRevealDirective, ScrollAnimateDirective],
  styles: [`
    .collections-section {
      padding: 2.5rem 0;
    }
    .collections-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .collections-eyebrow {
      display: inline-block;
      font-size: 0.75rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--primary-color, #10b981);
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .collections-title {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0;
      color: var(--text-color, #0f172a);
    }
    .collections-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    @media (min-width: 640px) {
      .collections-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (min-width: 1024px) {
      .collections-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    }
    .collection-card {
      position: relative;
      border-radius: 1.25rem;
      overflow: hidden;
      aspect-ratio: 16 / 10;
      display: block;
      text-decoration: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .collection-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.12);
    }
    .collection-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .collection-card:hover img {
      transform: scale(1.05);
    }
    .collection-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%);
      display: flex;
      align-items: flex-end;
      padding: 1.5rem;
    }
    .collection-meta {
      color: #ffffff;
    }
    .collection-label {
      font-size: 1.35rem;
      font-weight: 700;
      margin: 0;
      color: #ffffff;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }
    .collection-count {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.8);
      margin-top: 0.25rem;
      display: block;
    }
  `],
  template: `
<section class="collections-section container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false">
  <div class="collections-header">
    <span class="collections-eyebrow">{{ eyebrow() }}</span>
    <h2 class="collections-title">{{ title() }}</h2>
    @if (subtitle()) {
      <p class="text-muted mt-2">{{ subtitle() }}</p>
    }
  </div>

  <div class="collections-grid">
    @for (cat of displayCategories(); track cat.id) {
      <a class="collection-card" [routerLink]="['/menu']"
        [queryParams]="{category: cat.id, page: null, search: null, sort: null}"
        queryParamsHandling="merge">
        <img appImageReveal
          [src]="cat.imageUrl | imageUrl:'category':cat.id:cat.nameAr"
          [alt]="lang.getLocalizedName(cat)"
          loading="lazy">
        <div class="collection-overlay">
          <div class="collection-meta">
            <h3 class="collection-label">{{ lang.getLocalizedName(cat) }}</h3>
          </div>
        </div>
      </a>
    }
  </div>
</section>
`
})
export class SectionCategoriesGridComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  readonly catalog = inject(CatalogService);

  title() { return this.lang.text(this.s.title || 'التشكيلات المميزة', this.s.titleEn || 'Featured Collections'); }
  subtitle() { return this.lang.text(this.s.subtitle, this.s.subtitleEn); }
  eyebrow() { return this.lang.text(this.s.eyebrow || 'تشكيلات مختارة', this.s.eyebrowEn || 'COLLECTIONS'); }

  displayCategories() {
    const all = this.catalog.categories() || [];
    const limit = this.s.limit || 6;
    return all.slice(0, limit);
  }
}
