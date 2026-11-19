import { Component, Input, inject, signal, computed , ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection, HomeSectionSlide } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ImageRevealDirective } from '../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Hero Slider / Carousel Section (Image 3 reference)
 * Full-width/height dark hero with background image, centered copy, CTA button,
 * previous/next arrows and navigation dots.
 */
@Component({
  selector: 'app-section-hero-slider',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, ImageRevealDirective, ScrollAnimateDirective],
  styles: [`
    .hero-slider {
      position: relative;
      width: 100%;
      min-height: 440px;
      max-height: 650px;
      overflow: hidden;
      border-radius: 1.5rem;
      margin-bottom: 2rem;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @media (min-width: 768px) {
      .hero-slider { min-height: 540px; }
    }
    .slide-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .slide-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.85) 100%);
      z-index: 1;
    }
    .hero-content {
      position: relative;
      z-index: 2;
      text-align: center;
      max-width: 680px;
      padding: 2.5rem 1.5rem;
      color: #ffffff;
      animation: fadeInSlide .4s ease-out;
    }
    @keyframes fadeInSlide {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .hero-title {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1.25;
      margin: 0 0 1rem;
      color: #ffffff;
      text-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }
    @media (min-width: 768px) {
      .hero-title { font-size: 2.75rem; }
    }
    .hero-subtitle {
      font-size: 1.05rem;
      color: rgba(255,255,255,0.85);
      margin: 0 0 1.75rem;
      line-height: 1.6;
    }
    .btn-hero-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.85rem 2.25rem;
      border-radius: 9999px;
      background: var(--primary-color, #10b981);
      color: #ffffff;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s ease;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    }
    .btn-hero-cta:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
    .arrow-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 3;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.3);
      background: rgba(0,0,0,0.35);
      backdrop-filter: blur(8px);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    .arrow-btn:hover { background: rgba(0,0,0,0.65); }
    .arrow-btn.prev { right: 1rem; }
    .arrow-btn.next { left: 1rem; }
    .slider-dots {
      position: absolute;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 3;
      display: flex;
      gap: 0.5rem;
    }
    .slider-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: rgba(255,255,255,0.4);
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .slider-dot.active {
      background: #ffffff;
      width: 1.5rem;
      border-radius: 9999px;
    }
  `],
  template: `
<section class="hero-slider"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false">
  <img class="slide-bg"
    [src]="currentSlide().imageUrl || s.imageUrl || '/assets/images/banner-placeholder.jpg'"
    [alt]="currentSlide().title"
    loading="eager"
    fetchpriority="high">
  <div class="slide-overlay" [style.opacity]="(s.overlayOpacity || 50) / 100"></div>

  <div class="hero-content">
    <h1 class="hero-title">{{ currentSlide().title }}</h1>
    @if (currentSlide().subtitle) {
      <p class="hero-subtitle">{{ currentSlide().subtitle }}</p>
    }
    @if (currentSlide().buttonText) {
      <a class="btn-hero-cta" [routerLink]="currentSlide().link || '/menu'">
        <span>{{ currentSlide().buttonText }}</span>
        <i class="bi bi-arrow-left"></i>
      </a>
    }
  </div>

  @if (slidesList().length > 1) {
    <button class="arrow-btn prev" (click)="prev()" [attr.aria-label]="lang.text('السابق','Previous')">
      <i class="bi bi-chevron-right"></i>
    </button>
    <button class="arrow-btn next" (click)="next()" [attr.aria-label]="lang.text('التالي','Next')">
      <i class="bi bi-chevron-left"></i>
    </button>

    <div class="slider-dots">
      @for (sl of slidesList(); track $index) {
        <span class="slider-dot" [class.active]="currentIndex() === $index" (click)="goTo($index)"></span>
      }
    </div>
  }
</section>
`
})
export class SectionHeroSliderComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  currentIndex = signal(0);

  slidesList = computed(() => {
    if (this.s.slides && this.s.slides.length > 0) {
      return this.s.slides.map(slide => ({
        title: this.lang.text(slide.title, slide.titleEn),
        subtitle: this.lang.text(slide.subtitle || '', slide.subtitleEn),
        buttonText: this.lang.text(slide.buttonText || this.s.buttonText || 'تسوق الآن', slide.buttonTextEn || this.s.buttonTextEn || 'Shop now'),
        link: slide.link || this.s.link || '/menu',
        imageUrl: slide.imageUrl || this.s.imageUrl
      }));
    }
    return [{
      title: this.lang.text(this.s.title, this.s.titleEn),
      subtitle: this.lang.text(this.s.subtitle, this.s.subtitleEn),
      buttonText: this.lang.text(this.s.buttonText || 'تسوق الآن', this.s.buttonTextEn || 'Shop now'),
      link: this.s.link || '/menu',
      imageUrl: this.s.imageUrl
    }];
  });

  currentSlide = computed(() => {
    const list = this.slidesList();
    return list[this.currentIndex()] || list[0];
  });

  prev() {
    this.currentIndex.update(i => (i <= 0 ? this.slidesList().length - 1 : i - 1));
  }
  next() {
    this.currentIndex.update(i => (i >= this.slidesList().length - 1 ? 0 : i + 1));
  }
  goTo(idx: number) {
    this.currentIndex.set(idx);
  }
}
