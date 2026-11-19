import { Component, Input, inject, signal } from '@angular/core';
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
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  styles: [`
    .testimonials-section { padding:3rem 1rem; background:var(--surface-dark,#0f172a); border-radius:1.5rem; }
    .testimonials-eyebrow { display:flex; align-items:center; gap:.75rem; justify-content:center; color:var(--primary-color,#38bdf8); font-size:.75rem; letter-spacing:.12em; text-transform:uppercase; margin-bottom:.75rem; }
    .testimonials-eyebrow::before, .testimonials-eyebrow::after { content:''; flex:1; max-width:60px; height:1px; background:var(--primary-color,#38bdf8); opacity:.5; }
    .testimonials-section h2 { text-align:center; color:#fff; font-size:1.75rem; font-weight:700; margin:0 0 .5rem; }
    .testimonials-section .subtitle { text-align:center; color:rgba(255,255,255,.55); margin-bottom:2rem; }
    .testimonial-card { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); border-radius:1.25rem; padding:1.5rem; position:relative; min-height:160px; }
    .quote-icon { position:absolute; top:1rem; left:1rem; font-size:2rem; color:rgba(255,255,255,.12); line-height:1; font-family:Georgia,serif; }
    .stars { color:#f59e0b; font-size:1.1rem; margin-bottom:1rem; display:flex; gap:.15rem; }
    .review-text { color:rgba(255,255,255,.85); line-height:1.7; margin-bottom:1.25rem; }
    .reviewer { display:flex; align-items:center; gap:.75rem; }
    .avatar { width:2.5rem; height:2.5rem; border-radius:50%; background:var(--primary-color,#38bdf8); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1rem; overflow:hidden; flex-shrink:0; }
    .avatar img { width:100%; height:100%; object-fit:cover; }
    .reviewer-info strong { color:#fff; display:block; font-size:.9rem; }
    .reviewer-info span { color:rgba(255,255,255,.45); font-size:.78rem; }
    .carousel-controls { display:flex; justify-content:center; align-items:center; gap:1rem; margin-top:1.5rem; }
    .btn-arrow { width:2.25rem; height:2.25rem; border-radius:50%; border:1.5px solid rgba(255,255,255,.3); background:rgba(255,255,255,.08); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:.2s; }
    .btn-arrow:hover { background:var(--primary-color,#38bdf8); border-color:var(--primary-color,#38bdf8); }
    .dots { display:flex; gap:.5rem; }
    .dot { width:.5rem; height:.5rem; border-radius:50%; background:rgba(255,255,255,.25); cursor:pointer; transition:.2s; }
    .dot.active { background:var(--primary-color,#38bdf8); width:1.25rem; border-radius:.5rem; }
  `],
  template: `
@if (reviews().length) {
<section class="testimonials-section"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false">
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
          <span class="dot" [class.active]="idx() === $index" (click)="idx.set($index)"></span>
        }
      </div>
      <button class="btn-arrow" (click)="next()"><i class="bi bi-chevron-left"></i></button>
    </div>
  }
</section>
}`,
})
export class SectionTestimonialsComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  idx = signal(0);
  reviews() { return (this.s.testimonials?.length ? this.s.testimonials : this.defaultReviews) as HomeSectionTestimonial[]; }
  current() { return this.reviews()[this.idx()] ?? this.reviews()[0]; }
  starsArray() { return [1,2,3,4,5]; }
  initial() { return (this.current().name || '?').charAt(0).toUpperCase(); }
  prev() { this.idx.update(i => Math.max(0, i - 1)); }
  next() { this.idx.update(i => Math.min(this.reviews().length - 1, i + 1)); }
  title() { return this.lang.text(this.s.title, this.s.titleEn); }
  subtitle() { return this.lang.text(this.s.subtitle, this.s.subtitleEn); }
  eyebrow() { return this.lang.text(this.s.eyebrow || 'آراء العملاء', this.s.eyebrowEn || 'TESTIMONIALS'); }
  private defaultReviews: HomeSectionTestimonial[] = [
    { name: 'أحمد محمد', role: 'عميل موثق', text: 'تجربة تسوق رائعة وتوصيل سريع جداً، سأعود للشراء مجدداً بالتأكيد.', rating: 5 },
    { name: 'سارة علي', role: 'عميلة موثقة', text: 'جودة المنتجات ممتازة والخدمة احترافية جداً.', rating: 5 },
  ];
}
