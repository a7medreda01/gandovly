import { Component, Input, inject, signal, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeSection, HomeSectionTestimonial } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Testimonials Section (Image 2 reference)
 * Dark bg, star ratings, customer avatar + name, review text, carousel
 */
@Component({
  selector: 'app-section-testimonials',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  styles: [`
    .testimonials-section { padding:3rem 1rem; background:var(--surface-dark,#0f172a); color:var(--t-text,#ffffff); border-radius:1.5rem; }
    .testimonials-eyebrow { display:flex; align-items:center; gap:.75rem; justify-content:center; color:var(--primary-color,#38bdf8); font-size:.75rem; letter-spacing:.12em; text-transform:uppercase; margin-bottom:.75rem; }
    .testimonials-eyebrow::before, .testimonials-eyebrow::after { content:''; flex:1; max-width:60px; height:1px; background:var(--primary-color,#38bdf8); opacity:.5; }
    .testimonials-section h2 { text-align:center; color:var(--t-text,#ffffff); font-size:1.75rem; font-weight:700; margin:0 0 .5rem; }
    .testimonials-section .subtitle { text-align:center; color:color-mix(in srgb, var(--t-text,#ffffff) 70%, transparent); margin-bottom:2rem; }
    .testimonial-card { background:color-mix(in srgb, var(--t-text,#ffffff) 6%, transparent); border:1px solid color-mix(in srgb, var(--t-text,#ffffff) 12%, transparent); border-radius:1.25rem; padding:1.75rem; position:relative; min-height:260px; display:flex; flex-direction:column; justify-content:space-between; transition:min-height .25s ease; }
    .quote-icon { position:absolute; top:1rem; left:1rem; font-size:2rem; color:color-mix(in srgb, var(--t-text,#ffffff) 18%, transparent); line-height:1; font-family:Georgia,serif; }
    .stars { color:#f59e0b; font-size:1.1rem; margin-bottom:.75rem; display:flex; gap:.15rem; }
    .review-text { color:color-mix(in srgb, var(--t-text,#ffffff) 90%, transparent); line-height:1.7; margin-bottom:1.25rem; min-height:5.2rem; display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden; }
    .reviewer { display:flex; align-items:center; gap:.75rem; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:50%; background:var(--primary-color,#38bdf8); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1rem; overflow:hidden; flex-shrink:0; }
    .avatar img { width:100%; height:100%; object-fit:cover; }
    .reviewer-info strong { color:var(--t-text,#ffffff); display:block; font-size:.9rem; }
    .reviewer-info span { color:color-mix(in srgb, var(--t-text,#ffffff) 62%, transparent); font-size:.78rem; }
    .testimonials-section .carousel-controls { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1.5rem; }
    .testimonials-section .btn-arrow { width:2.25rem; height:2.25rem; border-radius:50%; border:1.5px solid color-mix(in srgb, var(--t-text,#ffffff) 30%, transparent); background:color-mix(in srgb, var(--t-text,#ffffff) 8%, transparent); color:var(--t-text,#ffffff); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:.2s; }
    .testimonials-section .btn-arrow:hover { background:var(--primary-color,#38bdf8); border-color:var(--primary-color,#38bdf8); color:#fff; }
    .testimonials-section .dots { display:flex; gap:.5rem; }
    .testimonials-section .dot { width:.5rem; height:.5rem; border-radius:50%; background:color-mix(in srgb, var(--t-text,#ffffff) 28%, transparent); cursor:pointer; transition:.2s; }
    .testimonials-section .dot.active { background:var(--primary-color,#38bdf8); width:1.25rem; border-radius:.5rem; }
  `],
  template: `
@if (reviews().length) {
<section class="testimonials-section"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null"
  [style.color]="effectiveTextColor()"
  [style.--t-text]="effectiveTextColor()"
  (touchstart)="onTouchStart($event)"
  (touchend)="onTouchEnd($event)">
  @if (eyebrow()) { <div class="testimonials-eyebrow">{{ eyebrow() }}</div> }
  <h2>{{ title() }}</h2>
  @if (subtitle()) { <p class="subtitle">{{ subtitle() }}</p> }
  <div class="testimonial-card">
    <span class="quote-icon">"</span>
    <div class="stars">
      @for (star of starsArray(); track $index) {
        <i class="bi" [class.bi-star-fill]="$index < (current().rating || 5)" [class.bi-star]="$index >= (current().rating || 5)"></i>
      }
    </div>
    <p class="review-text">{{ lang.text(current().text, current().textEn) }}</p>
    <div class="reviewer">
      <div class="avatar">
        @if (current().avatarUrl) { <img [src]="current().avatarUrl" [alt]="current().name" loading="lazy"> }
        @else { {{ initial() }} }
      </div>
      <div class="reviewer-info">
        <strong>{{ lang.text(current().name, current().nameEn) }}</strong>
        @if (current().role) { <span>{{ lang.text(current().role!, current().roleEn) }}</span> }
      </div>
    </div>
  </div>
  @if (reviews().length > 1) {
    <div class="carousel-controls">
      <button class="btn-arrow" (click)="prev()"><i class="bi bi-chevron-right"></i></button>
      <div class="dots">
        @for (d of reviews(); track $index) {
          <span class="dot" [class.active]="idx() === $index" (click)="goTo($index)"></span>
        }
      </div>
      <button class="btn-arrow" (click)="next()"><i class="bi bi-chevron-left"></i></button>
    </div>
  }
</section>
}`,
})
export class SectionTestimonialsComponent implements OnInit, OnDestroy {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  idx = signal(0);
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.startAutoplay();
  }
  ngOnDestroy() {
    this.stopAutoplay();
  }
  private startAutoplay() {
    this.autoplayTimer = setInterval(() => {
      const len = this.reviews().length;
      if (len > 1) this.idx.update(i => (i >= len - 1 ? 0 : i + 1));
    }, 4500);
  }
  private stopAutoplay() {
    if (this.autoplayTimer) { clearInterval(this.autoplayTimer); this.autoplayTimer = null; }
  }

  reviews() { return (this.s.testimonials?.length ? this.s.testimonials : this.defaultReviews) as HomeSectionTestimonial[]; }
  current() { return this.reviews()[this.idx()] ?? this.reviews()[0]; }
  starsArray() { return [1,2,3,4,5]; }
  initial() { return (this.current().name || '?').charAt(0).toUpperCase(); }
  prev() { this.stopAutoplay(); this.idx.update(i => (i <= 0 ? this.reviews().length - 1 : i - 1)); this.startAutoplay(); }
  next() { this.stopAutoplay(); this.idx.update(i => (i >= this.reviews().length - 1 ? 0 : i + 1)); this.startAutoplay(); }
  goTo(i: number) { this.stopAutoplay(); this.idx.set(i); this.startAutoplay(); }
  private touchStartX = 0;
  onTouchStart(e: TouchEvent) { if (e.touches.length === 1) this.touchStartX = e.touches[0].clientX; }
  onTouchEnd(e: TouchEvent) {
    if (!e.changedTouches.length || this.reviews().length <= 1) return;
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(dx) > 35) { if (dx > 0) this.next(); else this.prev(); }
  }
  title() { return this.lang.text(this.s.title, this.s.titleEn); }
  subtitle() { return this.lang.text(this.s.subtitle, this.s.subtitleEn); }
  eyebrow() { return this.lang.text(this.s.eyebrow || 'آراء العملاء', this.s.eyebrowEn || 'TESTIMONIALS'); }
  effectiveTextColor(): string {
    if (this.s.textColor?.trim()) return this.s.textColor.trim();
    if (this.s.backgroundColor?.trim()) {
      const hex = this.s.backgroundColor.replace('#', '').trim();
      if (hex.length === 6) {
        const b = (parseInt(hex.slice(0, 2), 16) * 299 + parseInt(hex.slice(2, 4), 16) * 587 + parseInt(hex.slice(4, 6), 16) * 114) / 1000;
        return b >= 150 ? '#152138' : '#ffffff';
      }
    }
    return '#ffffff';
  }
  private defaultReviews: HomeSectionTestimonial[] = [
    { name: 'أحمد محمد', role: 'عميل موثق', text: 'تجربة تسوق رائعة وتوصيل سريع جداً، سأعود للشراء مجدداً بالتأكيد.', rating: 5 },
    { name: 'سارة علي', role: 'عميلة موثقة', text: 'جودة المنتجات ممتازة والخدمة احترافية جداً.', rating: 5 },
  ];
}
