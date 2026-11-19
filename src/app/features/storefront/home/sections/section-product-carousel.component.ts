import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings, Product } from '../../../../core/models/models';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ImageRevealDirective } from '../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Product Carousel Section with Autoplay & Smooth Sliding
 */
@Component({
  selector: 'app-section-product-carousel',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, ImageRevealDirective, ScrollAnimateDirective],
  styles: [`
    .carousel-section {
      padding: 2.25rem 1.25rem;
      border-radius: 1.5rem;
      background: var(--surface-card, #f8fafc);
      border: 1px solid var(--border-color, #e2e8f0);
      margin-bottom: 2.5rem;
    }
    .carousel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .carousel-header h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main, #0f172a);
      margin: 0;
    }
    .carousel-wrap {
      position: relative;
      overflow: hidden;
      border-radius: 1.25rem;
    }
    .carousel-track {
      display: flex;
      gap: 1rem;
      transition: transform .45s cubic-bezier(.25, .8, .25, 1);
      will-change: transform;
    }
    .carousel-card {
      flex: 0 0 calc(50% - .5rem);
      min-width: calc(50% - .5rem);
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 1.25rem;
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      display: flex;
      flex-direction: column;
    }
    .carousel-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    }
    @media (min-width: 768px) {
      .carousel-card {
        flex: 0 0 calc(33.33% - .67rem);
        min-width: calc(33.33% - .67rem);
      }
    }
    @media (min-width: 1024px) {
      .carousel-card {
        flex: 0 0 calc(25% - .75rem);
        min-width: calc(25% - .75rem);
      }
    }
    .carousel-img-wrap {
      position: relative;
      aspect-ratio: 1;
      background: #f1f5f9;
      overflow: hidden;
    }
    .carousel-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }
    .carousel-card:hover .carousel-img-wrap img {
      transform: scale(1.05);
    }
    .cat-badge {
      position: absolute;
      top: 0.65rem;
      inset-inline-start: 0.65rem;
      background: rgba(15, 23, 42, 0.72);
      color: #fff;
      backdrop-filter: blur(8px);
      border-radius: 2rem;
      padding: 0.2rem 0.65rem;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.03em;
    }
    .carousel-info {
      padding: 0.85rem 1rem 1.15rem;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .carousel-info h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
      margin: 0 0 0.35rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }
    .carousel-price {
      color: var(--primary-color, #c88a2c);
      font-weight: 850;
      font-size: 1.05rem;
      font-variant-numeric: tabular-nums;
    }
    .carousel-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .btn-arrow {
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 50%;
      border: 1.5px solid var(--border-color, #e2e8f0);
      background: var(--card-bg, #ffffff);
      color: var(--text-main, #0f172a);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }
    .btn-arrow:hover {
      background: var(--primary-color, #c88a2c);
      border-color: var(--primary-color, #c88a2c);
      color: #ffffff;
      transform: scale(1.05);
    }
    .dots {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .dot {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      background: #cbd5e1;
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .dot.active {
      background: var(--primary-color, #c88a2c);
      width: 1.4rem;
      border-radius: 0.5rem;
    }
    .cta-row {
      text-align: center;
      margin-top: 1.75rem;
    }
    .btn-view-all {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: 1.5px solid var(--primary-color, #c88a2c);
      border-radius: 3rem;
      padding: 0.65rem 2rem;
      color: var(--primary-color, #c88a2c);
      background: transparent;
      font-weight: 700;
      font-size: 0.95rem;
      text-decoration: none;
      transition: all 0.25s ease;
    }
    .btn-view-all:hover {
      background: var(--primary-color, #c88a2c);
      color: #ffffff;
      box-shadow: 0 6px 20px color-mix(in srgb, var(--primary-color, #c88a2c) 25%, transparent);
      transform: translateY(-2px);
    }
  `],
  template: `
@if (products.length) {
<section class="carousel-section container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null"
  (mouseenter)="pauseAutoplay()"
  (mouseleave)="resumeAutoplay()"
  (touchstart)="pauseAutoplay()"
  (touchend)="resumeAutoplay()">
  <div class="carousel-header">
    <div>
      @if (eyebrow()) {
        <span class="eyebrow" style="color:var(--primary-color,#c88a2c);font-size:.78rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:4px;">{{ eyebrow() }}</span>
      }
      <h2>{{ title() }}</h2>
    </div>
  </div>
  <div class="carousel-wrap">
    <div class="carousel-track" [style.transform]="'translateX(' + (isRtl ? '' : '-') + (currentIndex() * slideWidth()) + 'px)'">
      @for (p of products; track p.id) {
        <div class="carousel-card" (click)="selectProduct.emit(p)">
          <div class="carousel-img-wrap">
            <img [src]="p.imageUrl" [alt]="lang.getLocalizedName(p)" loading="lazy">
            @if (p.categoryNameAr) {
              <span class="cat-badge">{{ p.categoryNameAr }}</span>
            }
          </div>
          <div class="carousel-info">
            <h3>{{ lang.getLocalizedName(p) }}</h3>
            <div class="carousel-price">{{ (p.pricePerUnit || p.pricePerKg || 0) | number:'1.0-2' }} {{ settings.currencySymbol || 'EGP' }}</div>
          </div>
        </div>
      }
    </div>
  </div>
  <div class="carousel-controls">
    <button class="btn-arrow" (click)="prev()" [attr.aria-label]="lang.text('السابق','Previous')">
      <i class="bi bi-chevron-right"></i>
    </button>
    <div class="dots">
      @for (d of dotArray(); track $index) {
        <span class="dot" [class.active]="currentIndex() === $index" (click)="goTo($index)"></span>
      }
    </div>
    <button class="btn-arrow" (click)="next()" [attr.aria-label]="lang.text('التالي','Next')">
      <i class="bi bi-chevron-left"></i>
    </button>
  </div>
  @if (btnText()) {
    <div class="cta-row">
      <a class="btn-view-all" [routerLink]="path()" [queryParams]="queryParams()" queryParamsHandling="merge">
        {{ btnText() }} <i class="bi bi-arrow-left"></i>
      </a>
    </div>
  }
</section>
}`,
})
export class SectionProductCarouselComponent implements OnInit, OnDestroy {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  @Input() products: Product[] = [];
  @Output() selectProduct = new EventEmitter<Product>();
  readonly lang = inject(LanguageService);

  currentIndex = signal(0);
  private autoplayTimer: any = null;
  private isPaused = false;

  ngOnInit() {
    this.startAutoplay();
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  startAutoplay() {
    this.stopAutoplay();
    if (typeof window === 'undefined') return;
    this.autoplayTimer = setInterval(() => {
      if (!this.isPaused && this.products.length > 2) {
        this.next();
      }
    }, 3800);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  pauseAutoplay() {
    this.isPaused = true;
  }

  resumeAutoplay() {
    this.isPaused = false;
  }

  get isRtl() {
    return typeof document !== 'undefined' ? document.dir === 'rtl' : true;
  }

  visibleCardsCount(): number {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  }

  maxIndex(): number {
    return Math.max(0, this.products.length - this.visibleCardsCount());
  }

  slideWidth(): number {
    if (typeof window === 'undefined') return 300;
    const w = window.innerWidth;
    if (w < 768) {
      // 2 cards per view with 16px gap
      return ((w - 48) / 2) + 16;
    }
    if (w < 1024) {
      return 260 + 16;
    }
    return 280 + 16;
  }

  dotArray(): any[] {
    const count = this.maxIndex() + 1;
    return Array.from({ length: Math.min(count, 8) });
  }

  prev() {
    this.currentIndex.update(i => {
      if (i <= 0) return this.maxIndex();
      return i - 1;
    });
  }

  next() {
    this.currentIndex.update(i => {
      if (i >= this.maxIndex()) return 0;
      return i + 1;
    });
  }

  goTo(i: number) {
    this.currentIndex.set(Math.min(i, this.maxIndex()));
  }

  title() { return this.lang.text(this.s.title, this.s.titleEn); }
  eyebrow() { return this.lang.text(this.s.eyebrow, this.s.eyebrowEn); }
  btnText() { return this.lang.text(this.s.buttonText, this.s.buttonTextEn); }
  path() { return this.s.link.split('?')[0] || '/menu'; }
  queryParams() {
    const q: any = { page: null, search: null, product: null, category: null, sort: null, ...Object.fromEntries(new URLSearchParams(this.s.link.split('?')[1] || '')) };
    if (this.path() === '/menu') {
      if (this.s.source === 'category') q.category = this.s.categoryId;
      if (['latest', 'offers', 'bestsellers'].includes(this.s.source || '') && !q.sort) q.sort = this.s.source;
    }
    return q;
  }
}
