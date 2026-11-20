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
 * Ultra-Smooth Full Screen Hero Slider Section
 * - True Full-Screen edge-to-edge coverage matching modern luxury e-commerce.
 * - Buttery-smooth hardware-accelerated sliding transition between banners.
 * - Real-time touch swipe gesture tracking on mobile.
 * - Subtle cinematic Ken Burns zoom on active banner image.
 * - Staggered fade-up typography animations for titles, subtitles, and CTA buttons.
 * - Glowing active pill pagination dots and glassmorphism arrow navigation.
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
      height: calc(100vh - 56px);
      height: calc(100dvh - 56px);
      min-height: 580px;
      overflow: hidden;
      margin: 0;
      background: #0f172a;
      user-select: none;
      -webkit-user-select: none;
      touch-action: pan-y pinch-zoom;
    }
    @media (max-width: 767px) {
      .hero-slider-wrap {
        height: calc(100vh - 50px);
        height: calc(100dvh - 50px);
        min-height: 520px;
      }
    }

    /* Hardware-accelerated sliding track */
    .hero-slides-track {
      display: flex;
      width: 100%;
      height: 100%;
      transition: transform 0.65s cubic-bezier(0.25, 1, 0.5, 1);
      will-change: transform;
    }
    .hero-slides-track.is-dragging {
      transition: none;
    }

    /* Individual slide */
    .hero-slide-item {
      flex: 0 0 100%;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
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
      display: block;
      transform: scale(1);
      transition: transform 6s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .hero-slide-item.is-active .slide-bg {
      transform: scale(1.045);
    }

    .slide-overlay {
      position: absolute;
      inset: 0;
      background: #0f172a;
      z-index: 1;
      pointer-events: none;
    }

    .slide-bottom-gradient {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 130px;
      background: linear-gradient(0deg, rgba(15, 23, 42, 0.65) 0%, transparent 100%);
      z-index: 2;
      pointer-events: none;
    }

    /* Typography & Content */
    .hero-content {
      position: relative;
      z-index: 3;
      text-align: center;
      max-width: 760px;
      padding: 2.5rem 1.5rem;
      color: #ffffff;
    }

    .hero-title {
      font-size: clamp(1.85rem, 4.5vw, 3.1rem);
      font-weight: 850;
      line-height: 1.25;
      margin: 0 0 0.85rem;
      color: #ffffff;
      text-shadow: 0 3px 18px rgba(0, 0, 0, 0.7);
      letter-spacing: -0.01em;
      opacity: 0;
      transform: translateY(22px);
      transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .hero-subtitle {
      font-size: clamp(0.95rem, 2vw, 1.25rem);
      color: rgba(255, 255, 255, 0.95);
      margin: 0 0 1.75rem;
      line-height: 1.6;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
      opacity: 0;
      transform: translateY(18px);
      transition: opacity 0.6s ease 0.1s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
    }
    .btn-hero-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.9rem 2.4rem;
      border-radius: 9999px;
      background: var(--btn-primary-bg, var(--primary-color, #c88a2c));
      color: var(--btn-primary-text, #ffffff);
      font-weight: 700;
      font-size: 1.05rem;
      text-decoration: none;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.3);
      opacity: 0;
      transform: translateY(14px) scale(0.96);
      transition: opacity 0.6s ease 0.2s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, filter 0.2s ease;
    }
    .btn-hero-cta:hover {
      transform: translateY(-2px) scale(1.03);
      filter: brightness(1.1);
      box-shadow: 0 10px 26px rgba(200, 138, 44, 0.45);
    }

    .hero-slide-item.is-active .hero-title,
    .hero-slide-item.is-active .hero-subtitle,
    .hero-slide-item.is-active .btn-hero-cta {
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    /* Navigation Arrows */
    .arrow-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      width: 3.1rem;
      height: 3.1rem;
      border-radius: 50%;
      border: 1.5px solid rgba(255, 255, 255, 0.45);
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.25rem;
      transition: all 0.25s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }
    .arrow-btn:hover {
      background: var(--btn-primary-bg, var(--primary-color, #c88a2c));
      border-color: var(--btn-primary-bg, var(--primary-color, #c88a2c));
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    }
    .arrow-btn.prev {
      inset-inline-start: 1.5rem;
    }
    .arrow-btn.next {
      inset-inline-end: 1.5rem;
    }
    @media (max-width: 767px) {
      .arrow-btn {
        width: 2.6rem;
        height: 2.6rem;
        font-size: 1rem;
      }
      .arrow-btn.prev { inset-inline-start: 0.75rem; }
      .arrow-btn.next { inset-inline-end: 0.75rem; }
    }

    /* Glowing Pill Dots */
    .slider-dots {
      position: absolute;
      bottom: 1.75rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(15, 23, 42, 0.45);
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .slider-dot {
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.45);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .slider-dot:hover {
      background: rgba(255, 255, 255, 0.75);
    }
    .slider-dot.active {
      background: var(--btn-primary-bg, var(--primary-color, #c88a2c));
      width: 1.8rem;
      border-radius: 9999px;
      box-shadow: 0 0 10px color-mix(in srgb, var(--primary-color, #c88a2c) 75%, transparent);
    }
  `],
  template: `
<section class="hero-slider-wrap"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  (touchstart)="onTouchStart($event)"
  (touchmove)="onTouchMove($event)"
  (touchend)="onTouchEnd()"
  (touchcancel)="onTouchEnd()"
  (mouseenter)="pauseAutoplay()"
  (mouseleave)="resumeAutoplay()">

  <div class="hero-slides-track"
    [class.is-dragging]="isDragging()"
    [style.transform]="trackTransform()">

    @for (slide of slidesList(); track $index) {
      <div class="hero-slide-item" [class.is-active]="currentIndex() === $index">
        <picture class="slide-picture">
          @if (slide.mobileImageUrl) {
            <source media="(max-width: 767px)" [srcset]="slide.mobileImageUrl | imageUrl:'banner'">
          }
          <img class="slide-bg"
            [src]="(slide.imageUrl || s.imageUrl || '/assets/images/banner-placeholder.jpg') | imageUrl:'banner'"
            [alt]="slide.title || 'Banner'"
            [loading]="$index === 0 ? 'eager' : 'lazy'"
            [attr.fetchpriority]="$index === 0 ? 'high' : null">
        </picture>

        @if (slideOverlayOpacity(slide) > 0) {
          <div class="slide-overlay" [style.opacity]="slideOverlayOpacity(slide) / 100"></div>
        }

        <div class="slide-bottom-gradient"></div>

        @if (slideHasContent(slide)) {
          <div class="hero-content">
            @if (slide.title) {
              <h1 class="hero-title">{{ slide.title }}</h1>
            }
            @if (slide.subtitle) {
              <p class="hero-subtitle">{{ slide.subtitle }}</p>
            }
            @if (slide.buttonText) {
              <a class="btn-hero-cta" [routerLink]="slidePath(slide.link)" [queryParams]="slideQuery(slide.link)">
                <span>{{ slide.buttonText }}</span>
                <i class="bi" [class.bi-arrow-left]="lang.isRtl()" [class.bi-arrow-right]="!lang.isRtl()"></i>
              </a>
            }
          </div>
        }
      </div>
    }
  </div>

  @if (slidesList().length > 1) {
    <button type="button" class="arrow-btn prev" (click)="prev()" [attr.aria-label]="lang.text('السابق','Previous')">
      <i class="bi" [class.bi-chevron-right]="lang.isRtl()" [class.bi-chevron-left]="!lang.isRtl()"></i>
    </button>
    <button type="button" class="arrow-btn next" (click)="next()" [attr.aria-label]="lang.text('التالي','Next')">
      <i class="bi" [class.bi-chevron-left]="lang.isRtl()" [class.bi-chevron-right]="!lang.isRtl()"></i>
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

  readonly currentIndex = signal(0);
  readonly isDragging = signal(false);
  readonly dragOffsetPx = signal(0);

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private isPaused = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private hasSwiped = false;

  get isRtl(): boolean {
    return typeof document !== 'undefined' ? document.dir === 'rtl' : true;
  }

  trackTransform(): string {
    const sign = this.isRtl ? 1 : -1;
    const base = sign * (this.currentIndex() * 100);
    const offset = this.dragOffsetPx();
    if (this.isDragging() && offset !== 0) {
      return `translateX(calc(${base}% + ${offset}px))`;
    }
    return `translateX(${base}%)`;
  }

  slidePath(link?: string): string {
    return (link || '/menu').split('?')[0] || '/menu';
  }

  slideQuery(link?: string): Record<string, string> {
    const q = (link || '').split('?')[1];
    return q ? Object.fromEntries(new URLSearchParams(q)) : {};
  }

  slideHasContent(slide: any): boolean {
    return !!(slide.title || slide.subtitle || slide.buttonText);
  }

  slideOverlayOpacity(slide: any): number {
    if (slide.overlayOpacity !== undefined && slide.overlayOpacity !== null && slide.overlayOpacity !== '') {
      const n = Number(slide.overlayOpacity);
      if (!Number.isNaN(n)) return Math.max(0, Math.min(90, n));
    }
    return this.slideHasContent(slide) ? 35 : 0;
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

  ngOnInit() {
    this.startAutoplay();
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      const len = this.slidesList().length;
      if (len > 1 && !this.isPaused) {
        this.next();
      }
    }, 5500);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  pauseAutoplay() { this.isPaused = true; }
  resumeAutoplay() { this.isPaused = false; }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1 || this.slidesList().length <= 1) return;
    this.pauseAutoplay();
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.hasSwiped = false;
    this.isDragging.set(true);
    this.dragOffsetPx.set(0);
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isDragging() || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - this.touchStartX;
    const dy = e.touches[0].clientY - this.touchStartY;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      this.hasSwiped = true;
      this.dragOffsetPx.set(dx);
    }
  }

  onTouchEnd() {
    if (!this.isDragging()) return;
    const dx = this.dragOffsetPx();
    this.isDragging.set(false);
    this.dragOffsetPx.set(0);
    const threshold = 40;
    if (Math.abs(dx) >= threshold) {
      if (this.isRtl) {
        if (dx > 0) this.next();
        else this.prev();
      } else {
        if (dx < 0) this.next();
        else this.prev();
      }
    }
    this.resumeAutoplay();
  }

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