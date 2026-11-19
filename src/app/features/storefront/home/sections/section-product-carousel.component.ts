import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings, Product } from '../../../../core/models/models';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ImageRevealDirective } from '../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Product Carousel Section (Image 1 reference)
 * Dark card with category badge, arrows, dots, View All CTA
 */
@Component({
  selector: 'app-section-product-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, ImageRevealDirective, ScrollAnimateDirective],
  styles: [`
    .carousel-section { padding: 2rem 0; }
    .carousel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .carousel-header h2 { font-size:1.5rem; font-weight:700; margin:0; }
    .carousel-wrap { position:relative; overflow:hidden; }
    .carousel-track { display:flex; gap:1rem; transition:transform .4s cubic-bezier(.25,.8,.25,1); will-change:transform; }
    .carousel-card { flex:0 0 calc(50% - .5rem); min-width:calc(50% - .5rem); background:var(--surface-dark,#1a1a2e); border-radius:1.25rem; overflow:hidden; cursor:pointer; }
    @media (min-width:768px){ .carousel-card { flex:0 0 calc(33.33% - .67rem); min-width:calc(33.33% - .67rem); } }
    @media (min-width:1024px){ .carousel-card { flex:0 0 calc(25% - .75rem); min-width:calc(25% - .75rem); } }
    .carousel-img-wrap { position:relative; aspect-ratio:1; }
    .carousel-img-wrap img { width:100%; height:100%; object-fit:cover; border-radius:1.25rem 1.25rem 0 0; }
    .cat-badge { position:absolute; top:.75rem; left:.75rem; background:rgba(255,255,255,.18); color:#fff; backdrop-filter:blur(8px); border-radius:2rem; padding:.2rem .75rem; font-size:.7rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase; }
    .carousel-info { padding:.75rem 1rem 1rem; color:#fff; }
    .carousel-info h3 { font-size:.95rem; font-weight:600; margin:0 0 .25rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .carousel-price { color:var(--primary-color,#38bdf8); font-weight:700; font-size:.95rem; }
    .carousel-controls { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1.25rem; }
    .btn-arrow { width:2.25rem; height:2.25rem; border-radius:50%; border:1.5px solid rgba(255,255,255,.3); background:rgba(255,255,255,.08); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:.2s; }
    .btn-arrow:hover { background:var(--primary-color,#38bdf8); border-color:var(--primary-color,#38bdf8); }
    .dots { display:flex; gap:.5rem; }
    .dot { width:.5rem; height:.5rem; border-radius:50%; background:rgba(255,255,255,.25); transition:.2s; cursor:pointer; }
    .dot.active { background:var(--primary-color,#38bdf8); width:1.25rem; border-radius:.5rem; }
    .cta-row { text-align:center; margin-top:1.5rem; }
    .btn-view-all { display:inline-flex; align-items:center; gap:.5rem; border:1.5px solid rgba(255,255,255,.3); border-radius:3rem; padding:.6rem 1.75rem; color:#fff; background:transparent; font-weight:500; text-decoration:none; transition:.2s; }
    .btn-view-all:hover { background:var(--primary-color,#38bdf8); border-color:var(--primary-color,#38bdf8); }
    .carousel-section.dark-bg { background:var(--surface-dark,#0f172a); border-radius:1.5rem; padding:2rem 1rem; }
  `],
  template: `
@if (products.length) {
<section class="carousel-section dark-bg"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false">
  <div class="carousel-header">
    <div>
      @if (eyebrow()) { <span class="eyebrow" style="color:var(--primary-color,#38bdf8);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;">{{ eyebrow() }}</span> }
      <h2 style="color:#fff">{{ title() }}</h2>
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
export class SectionProductCarouselComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  @Input() products: Product[] = [];
  @Output() selectProduct = new EventEmitter<Product>();
  readonly lang = inject(LanguageService);
  currentIndex = signal(0);
  get isRtl() { return document.dir === 'rtl'; }
  slideWidth() { return typeof window !== 'undefined' ? (window.innerWidth < 768 ? (window.innerWidth - 48) / 2 + 8 : 300) : 300; }
  dotArray() { return Array.from({ length: Math.max(0, this.products.length - 1) }); }
  prev() { this.currentIndex.update(i => Math.max(0, i - 1)); }
  next() { this.currentIndex.update(i => Math.min(this.products.length - 2, i + 1)); }
  goTo(i: number) { this.currentIndex.set(i); }
  title() { return this.lang.text(this.s.title, this.s.titleEn); }
  eyebrow() { return this.lang.text(this.s.eyebrow, this.s.eyebrowEn); }
  btnText() { return this.lang.text(this.s.buttonText, this.s.buttonTextEn); }
  path() { return this.s.link.split('?')[0] || '/menu'; }
  queryParams() {
    const q: any = {page:null,search:null,product:null,category:null,sort:null,...Object.fromEntries(new URLSearchParams(this.s.link.split('?')[1]||''))};
    if(this.path()==='/menu'){if(this.s.source==='category')q.category=this.s.categoryId;if(['latest','offers','bestsellers'].includes(this.s.source||'')&&!q.sort)q.sort=this.s.source;}
    return q;
  }
}
