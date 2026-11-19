import { Component, Input, inject, signal, computed, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection, HomeSectionSlide } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ImageRevealDirective } from '../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Full Screen Hero Slider Section
 * Edge-to-edge luxury hero slider with seamless top-navbar integration,
 * responsive mobile/desktop pictures, smooth autoplay, and optional typography overlays.
 */
@Component({
  selector: 'app-section-hero-slider',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, ImageRevealDirective, ScrollAnimateDirective],
  styles: [`
    .hero-slider-wrap {
      position: relative;
      width: 100%;
      height: calc(100vh - 72px);
      min-height: calc(100vh - 72px);
      max-height: none;
      overflow: hidden;
      border-radius: 0;
      margin: 0;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @media (min-width: 768px) {
      .hero-slider-wrap {
        height: calc(100vh - 72px);
        min-height: calc(100vh - 72px);
        max-height: none;
      }
    }
    @media (max-width: 767px) {
      .hero-slider-wrap {
        height: calc(100vh - 56px);
        height: calc(100dvh - 56px);
        min-height: calc(100vh - 56px);
        min-height: calc(100dvh - 56px);
        max-height: none;
        margin-bottom: 0;
      }
    }

    .slide-bottom-gradient {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 90px;
      background: linear-gradient(0deg, rgba(15, 23, 42, 0.5) 0%, transparent 100%);
      z-index: 2;
      pointer-events: none;
    }

    .slide-picture {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
    .slide-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      transition: opacity 0.5s ease;
      display: block;
    }
    .slide-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.35);
      z-index: 1;
    }

    .hero-content {
      position: relative;
      z-index: 3;
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
      font-size: clamp(1.75rem, 4vw, 2.75rem);
      font-weight: 850;
      line-height: 1.25;
      margin: 0 0 0.85rem;
      color: #ffffff;
      text-shadow: 0 3px 14px rgba(0,0,0,0.6);
      letter-spacing: -0.01em;
    }
    .hero-subtitle {
      font-size: clamp(0.95rem, 2vw, 1.15rem);
      color: rgba(255,255,255,0.92);
      margin: 0 0 1.5rem;
      line-height: 1.6;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }
    .btn-hero-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 2.25rem;
      border-radius: 9999px;
      background: var(--btn-primary-bg, #c88a2c);
      color: var(--btn-primary-text, #ffffff);
      font-weight: 700;
      font-size: 1rem;
      text-decoration: none;
      transition: all 0.25s ease;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.2);
    }
    .btn-hero-cta:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
      box-shadow: 0 10px 24px rgba(200, 138, 44, 0.4);
    }

    .arrow-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 4;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.4);
      background: rgba(15,23,42,0.45);
      backdrop-filter: blur(8px);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .arrow-btn:hover {
      background: var(--primary-color, #c88a2c);
      border-color: var(--primary-color, #c88a2c);
      transform: translateY(-50%) scale(1.08);
    }
    .arrow-btn.prev { right: 1.25rem; }
    .arrow-btn.next { left: 1.25rem; }

    .slider-dots {
      position: absolute;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 4;
      display: flex;
      gap: 0.5rem;
      background: rgba(15,23,42,0.35);
      padding: 0.35rem 0.65rem;
      border-radius: 999px;
      backdrop-filter: blur(4px);
    }
    .slider-dot {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      background: rgba(255,255,255,0.45);
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .slider-dot.active {
      background: #c88a2c;
      width: 1.6rem;
      border-radius: 9999px;
      box-shadow: 0 0 8px rgba(200, 138, 44, 0.7);
    }
  `],
  template: `
<section class="hero-slider-wrap"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false">

  <div class="slide-bottom-gradient"></div>

  <picture class="slide-picture">
    @if (currentSlide().mobileImageUrl) {
      <source media="(max-width: 767px)" [srcset]="currentSlide().mobileImageUrl | imageUrl:'banner'">
    }
    <img class="slide-bg"
      [src]="(currentSlide().imageUrl || s.imageUrl || '/assets/images/banner-placeholder.jpg') | imageUrl:'banner'"
      [alt]="currentSlide().title || 'Banner'"
      loading="eager"
      fetchpriority="high">
  </picture>

  @if (overlayOpacityPercent() > 0) {
    <div class="slide-overlay" [style.opacity]="overlayOpacityPercent() / 100"></div>
  }

  @if (hasContent()) {
    <div class="hero-content">
      @if (currentSlide().title) {
        <h1 class="hero-title">{{ currentSlide().title }}</h1>
      }
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
  }

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
export class SectionHeroSliderComponent implements OnInit, OnDestroy {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  currentIndex = signal(0);
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.startAutoplay();
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  private startAutoplay() {
    this.autoplayTimer = setInterval(() => {
      const len = this.slidesList().length;
      if (len > 1) {
        this.currentIndex.update(i => (i >= len - 1 ? 0 : i + 1));
      }
    }, 5500);
  }

  private stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  slidesList = computed(() => {
    if (this.s.slides && this.s.slides.length > 0) {
      return this.s.slides.map(slide => ({
        title: slide.title ? this.lang.text(slide.title, slide.titleEn) : '',
        subtitle: slide.subtitle ? this.lang.text(slide.subtitle, slide.subtitleEn) : '',
        buttonText: slide.buttonText ? this.lang.text(slide.buttonText, slide.buttonTextEn) : '',
        link: slide.link || this.s.link || '/menu',
        imageUrl: slide.imageUrl || this.s.imageUrl,
        mobileImageUrl: slide.mobileImageUrl || this.s.mobileImageUrl || slide.imageUrl || this.s.imageUrl,
        overlayOpacity: slide.overlayOpacity !== undefined ? slide.overlayOpacity : this.s.overlayOpacity
      }));
    }

    return [{
      title: this.s.title ? this.lang.text(this.s.title, this.s.titleEn) : '',
      subtitle: this.s.subtitle ? this.lang.text(this.s.subtitle, this.s.subtitleEn) : '',
      buttonText: this.s.buttonText ? this.lang.text(this.s.buttonText, this.s.buttonTextEn) : '',
      link: this.s.link || '/menu',
      imageUrl: this.s.imageUrl,
      mobileImageUrl: this.s.mobileImageUrl || this.s.imageUrl,
      overlayOpacity: this.s.overlayOpacity
    }];
  });

  currentSlide = computed(() => {
    const list = this.slidesList();
    return list[this.currentIndex()] || list[0];
  });

  hasContent = computed(() => {
    const cs = this.currentSlide();
    return !!(cs.title || cs.subtitle || cs.buttonText);
  });

  overlayOpacityPercent = computed(() => {
    const cs = this.currentSlide();
    if (cs.overlayOpacity !== undefined && cs.overlayOpacity !== null) {
      return cs.overlayOpacity;
    }
    return this.hasContent() ? 35 : 0;
  });

  prev() {
    this.stopAutoplay();
    this.currentIndex.update(i => (i <= 0 ? this.slidesList().length - 1 : i - 1));
    this.startAutoplay();
  }

  next() {
    this.stopAutoplay();
    this.currentIndex.update(i => (i >= this.slidesList().length - 1 ? 0 : i + 1));
    this.startAutoplay();
  }

  goTo(idx: number) {
    this.stopAutoplay();
    this.currentIndex.set(idx);
    this.startAutoplay();
  }
}
