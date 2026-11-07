import { Component } from '@angular/core';
import { ProductCardSkeletonComponent } from '../../../shared/components/product-card-skeleton/product-card-skeleton.component';

@Component({
  selector: 'app-home-skeleton',
  imports: [ProductCardSkeletonComponent],
  template: `
    <div class="container">
      <span class="sr-only" role="status">جاري تحميل الرئيسية…</span>
      <div class="preview" aria-hidden="true">
        <div class="banner"><span></span><span></span><span></span></div>
        <div class="search"></div>
        <div class="heading"></div>
        <div class="categories">
          @for (item of [1, 2, 3, 4, 5, 6]; track item) {
            <div class="category"><span></span><span></span></div>
          }
        </div>
        <div class="heading"></div>
        <div class="products">
          @for (item of [1, 2, 3, 4]; track item) { <app-product-card-skeleton /> }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; padding-block: 16px 24px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .preview { --placeholder: color-mix(in srgb, var(--primary-color, #52697e) 9%, var(--card-bg, #fff)); }
    .banner, .search, .heading, .category span { background: var(--placeholder); }
    .banner { min-height: clamp(200px, 26vw, 360px); border-radius: var(--radius-card, 18px); display: grid; align-content: center; gap: 12px; padding: clamp(20px, 4vw, 54px); }
    .banner span { display: block; height: 14px; width: min(70%, 280px); background: var(--card-bg, #fff); opacity: .6; border-radius: 10px; }
    .banner span:first-child { width: min(55%, 200px); height: 22px; }
    .banner span:last-child { width: 95px; height: 34px; margin-top: 6px; }
    .search { width: min(100%, 620px); height: 44px; margin: 12px auto 20px; border-radius: 999px; }
    .heading { width: 136px; height: 16px; margin-block: 18px 12px; border-radius: 8px; }
    .categories { display: flex; gap: 12px; overflow: hidden; }
    .category { flex: 0 0 76px; display: grid; justify-items: center; gap: 7px; }
    .category span:first-child { width: 60px; height: 60px; border-radius: var(--radius-control, 12px); }
    .category span:last-child { width: 50px; height: 9px; border-radius: 8px; }
    .products { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    @media (max-width: 767px) { .products { grid-template-columns: repeat(var(--mobile-product-columns, 2), minmax(0, 1fr)); } }
    @media (prefers-reduced-motion: no-preference) {
      .banner, .search, .heading, .category span { animation: pulse 1.6s ease-in-out infinite alternate; }
      @keyframes pulse { to { opacity: .55; } }
    }
  `
})
export class HomeSkeletonComponent {}
