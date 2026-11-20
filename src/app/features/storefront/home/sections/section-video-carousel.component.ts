import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, QueryList,
  ViewChildren, ViewEncapsulation, computed, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HomeSection, HomeSectionVideo } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

/**
 * Video Carousel / Slider Section (Products Slider Style)
 * Modern borderless multi-card video carousel with touch swipe, autoplay,
 * individual card sound toggles, and responsive card sizing (like product carousel).
 */
@Component({
  selector: 'app-section-video-carousel',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollAnimateDirective, ImageUrlPipe],
  styles: [`
    .vcar-section {
      padding: 2.25rem 0;
      background: var(--vcar-bg, transparent);
      color: var(--vcar-text, var(--text-main, #0f172a));
      border: none !important;
      box-shadow: none !important;
    }
    .vcar-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1.5rem;
      padding-inline: 0.5rem;
    }
    .vcar-eyebrow {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--primary-color, #c88a2c);
      margin-bottom: 0.35rem;
    }
    .vcar-title {
      font-size: clamp(1.3rem, 2.4vw, 1.75rem);
      font-weight: 800;
      margin: 0;
      color: inherit;
      line-height: 1.3;
    }
    .vcar-sub {
      margin: 0.35rem 0 0;
      opacity: 0.75;
      font-size: 0.92rem;
    }

    .vcar-wrap {
      position: relative;
      overflow: hidden;
      border: none !important;
      touch-action: pan-y pinch-zoom;
      user-select: none;
      -webkit-user-select: none;
      padding: 0.5rem 0.25rem 1rem;
    }
    .vcar-track {
      display: flex;
      gap: 1rem;
      transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      will-change: transform;
      border: none !important;
    }
    .vcar-track.is-dragging {
      transition: none !important;
      cursor: grabbing;
    }

    /* Video Card - No border, clean modern shadow */
    .vcar-card {
      position: relative;
      flex: 0 0 calc(50% - 0.5rem);
      min-width: calc(50% - 0.5rem);
      border-radius: 1.25rem;
      overflow: hidden;
      background: #0f172a;
      border: none !important;
      outline: none !important;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      aspect-ratio: var(--vcar-aspect, 9 / 16);
      cursor: pointer;
    }
    .vcar-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
    }
    @media (max-width: 480px) {
      .vcar-card {
        flex: 0 0 calc(62% - 0.5rem);
        min-width: calc(62% - 0.5rem);
      }
    }
    @media (min-width: 768px) {
      .vcar-card {
        flex: 0 0 calc(33.333% - 0.67rem);
        min-width: calc(33.333% - 0.67rem);
      }
    }
    @media (min-width: 1024px) {
      .vcar-card {
        flex: 0 0 calc(25% - 0.75rem);
        min-width: calc(25% - 0.75rem);
      }
    }

    .vcar-card video {
      width: 100%;
      height: 100%;
      object-fit: var(--vcar-fit, cover);
      display: block;
      background: #0f172a;
      pointer-events: auto;
      border: none !important;
    }

    /* Floating Sound Button */
    .vcar-card-sound {
      position: absolute;
      top: 10px;
      inset-inline-end: 10px;
      z-index: 4;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: none;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.9rem;
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .vcar-card-sound:hover {
      transform: scale(1.1);
      background: rgba(15, 23, 42, 0.8);
    }

    /* Pause/Play indicator */
    .vcar-play-badge {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      pointer-events: none;
      z-index: 3;
      animation: vcarPulse 1.4s infinite;
    }
    @keyframes vcarPulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.08); }
    }

    /* Bottom Gradient Overlay */
    .vcar-overlay {
      position: absolute;
      inset: auto 0 0 0;
      height: 55%;
      pointer-events: none;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.45) 55%, transparent 100%);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 1rem;
      z-index: 3;
      color: #ffffff;
    }
    .vcar-card-title {
      font-size: 0.95rem;
      font-weight: 800;
      line-height: 1.35;
      margin: 0 0 0.5rem;
      color: #ffffff;
      text-shadow: 0 2px 6px rgba(0,0,0,0.5);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .vcar-card-cta {
      pointer-events: auto;
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      background: var(--btn-primary-bg, var(--primary-color, #c88a2c));
      color: var(--btn-primary-text, #ffffff);
      font-size: 0.78rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      transition: transform 0.2s ease, filter 0.2s ease;
    }
    .vcar-card-cta:hover {
      filter: brightness(1.1);
      transform: translateY(-2px);
    }

    /* Carousel Controls (Same as Product Carousel) */
    .vcar-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .vcar-controls .btn-arrow {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 1.5px solid color-mix(in srgb, var(--primary-color, #c88a2c) 45%, transparent);
      background: color-mix(in srgb, var(--primary-color, #c88a2c) 12%, var(--card-bg, #ffffff));
      color: var(--primary-color, #c88a2c);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color, #c88a2c) 14%, transparent);
    }
    .vcar-controls .btn-arrow:hover,
    .vcar-controls .btn-arrow:active {
      background: var(--btn-primary-bg, var(--primary-color, #c88a2c));
      border-color: var(--btn-primary-bg, var(--primary-color, #c88a2c));
      color: var(--btn-primary-text, #ffffff);
      transform: scale(1.06);
    }
    .vcar-controls .dots {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .vcar-controls .dot {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      background: color-mix(in srgb, var(--primary-color, #c88a2c) 26%, #cbd5e1);
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .vcar-controls .dot.active {
      background: var(--btn-primary-bg, var(--primary-color, #c88a2c));
      width: 1.5rem;
      border-radius: 0.5rem;
    }
  `],
  template: `
@if (validVideos().length) {
<section class="vcar-section container"
  [style.--vcar-bg]="s.backgroundColor || null"
  [style.--vcar-text]="s.textColor || null"
  [style.--vcar-aspect]="aspectCss(s.videoAspect || '9/16')"
  [style.--vcar-fit]="s.videoFit || 'cover'"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  (mouseenter)="pauseAutoplay()"
  (mouseleave)="resumeAutoplay()">

  @if (title() || subtitle() || eyebrow()) {
    <div class="vcar-header">
      <div>
        @if (eyebrow()) { <span class="vcar-eyebrow">{{ eyebrow() }}</span> }
        @if (title()) { <h2 class="vcar-title">{{ title() }}</h2> }
        @if (subtitle()) { <p class="vcar-sub">{{ subtitle() }}</p> }
      </div>
    </div>
  }

  <div class="vcar-wrap"
    (touchstart)="onTouchStart($event)"
    (touchmove)="onTouchMove($event)"
    (touchend)="onTouchEnd()"
    (touchcancel)="onTouchEnd()">
    <div class="vcar-track"
      [class.is-dragging]="isDragging()"
      [style.transform]="trackTransform()">

      @for (v of validVideos(); track $index) {
        <div class="vcar-card" (click)="onCardClick($index, $event)">
          <video #videoEl
            [src]="resolveVideoUrl(v)"
            [poster]="v.posterUrl ? (v.posterUrl | imageUrl:'banner') : null"
            playsinline webkit-playsinline
            muted autoplay loop preload="auto"
            (error)="onVideoError($event, $index)">
          </video>

          <!-- Floating Sound Toggle Button -->
          <button type="button" class="vcar-card-sound"
            [attr.aria-label]="isCardMuted($index) ? lang.text('تشغيل الصوت', 'Unmute') : lang.text('كتم الصوت', 'Mute')"
            (click)="toggleSound($index, $event)">
            <i class="bi" [class.bi-volume-mute-fill]="isCardMuted($index)" [class.bi-volume-up-fill]="!isCardMuted($index)"></i>
          </button>

          <!-- Play/Pause indicator if paused -->
          @if (isCardPaused($index)) {
            <div class="vcar-play-badge">
              <i class="bi bi-play-fill"></i>
            </div>
          }

          <!-- Overlay details -->
          @if (cardTitle(v) || v.link) {
            <div class="vcar-overlay">
              @if (cardTitle(v)) {
                <h3 class="vcar-card-title">{{ cardTitle(v) }}</h3>
              }
              @if (v.link) {
                <a class="vcar-card-cta"
                  [routerLink]="linkPath(v.link)"
                  [queryParams]="linkQuery(v.link)"
                  (click)="$event.stopPropagation()">
                  <span>{{ lang.text(s.buttonText || 'تسوق الآن', s.buttonTextEn || 'Shop now') }}</span>
                  <i class="bi" [class.bi-arrow-left]="lang.isRtl()" [class.bi-arrow-right]="!lang.isRtl()"></i>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  </div>

  @if (validVideos().length > 1) {
    <div class="vcar-controls">
      <button type="button" class="btn-arrow" (click)="prev()" [attr.aria-label]="lang.text('السابق', 'Previous')">
        <i class="bi" [class.bi-chevron-right]="lang.isRtl()" [class.bi-chevron-left]="!lang.isRtl()"></i>
      </button>
      <div class="dots">
        @for (d of dotArray(); track $index) {
          <span class="dot" [class.active]="currentIndex() === $index" (click)="goTo($index)"></span>
        }
      </div>
      <button type="button" class="btn-arrow" (click)="next()" [attr.aria-label]="lang.text('التالي', 'Next')">
        <i class="bi" [class.bi-chevron-left]="lang.isRtl()" [class.bi-chevron-right]="!lang.isRtl()"></i>
      </button>
    </div>
  }
</section>
}
`
})
export class SectionVideoCarouselComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  @ViewChildren('videoEl') videoEls!: QueryList<ElementRef<HTMLVideoElement>>;

  readonly lang = inject(LanguageService);

  readonly currentIndex = signal(0);
  readonly isDragging = signal(false);
  readonly dragOffsetPx = signal(0);

  // Per-card state
  readonly mutedMap = signal<Record<number, boolean>>({});
  readonly pausedMap = signal<Record<number, boolean>>({});

  private touchStartX = 0;
  private touchStartY = 0;
  private hasSwiped = false;
  private autoplayTimer: any = null;
  private isPaused = false;

  validVideos = computed(() => {
    return (this.s?.videos || []).filter(v => !!(v.url || v.mobileUrl));
  });

  title() { return this.lang.text(this.s?.title, this.s?.titleEn); }
  subtitle() { return this.lang.text(this.s?.subtitle, this.s?.subtitleEn); }
  eyebrow() { return this.lang.text(this.s?.eyebrow, this.s?.eyebrowEn); }
  cardTitle(v: HomeSectionVideo) { return this.lang.text(v.title || '', v.titleEn || ''); }

  aspectCss(a: string) { return a.replace('/', ' / '); }

  linkPath(link: string) { return (link || '').split('?')[0] || '/menu'; }
  linkQuery(link: string) {
    const q = (link || '').split('?')[1];
    if (!q) return null;
    const out: Record<string, string> = {};
    new URLSearchParams(q).forEach((v, k) => out[k] = v);
    return out;
  }

  resolveVideoUrl(v: HomeSectionVideo): string {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const raw = (isMobile && v.mobileUrl) ? v.mobileUrl : (v.url || v.mobileUrl || '');
    if (!raw) return '';
    const trimmed = raw.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      return trimmed;
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  isCardMuted(index: number): boolean {
    const map = this.mutedMap();
    return map[index] !== undefined ? map[index] : true;
  }

  isCardPaused(index: number): boolean {
    return !!this.pausedMap()[index];
  }

  toggleSound(index: number, event: Event) {
    event.stopPropagation();
    const current = this.isCardMuted(index);
    const nextState = !current;
    this.mutedMap.update(m => ({ ...m, [index]: nextState }));
    const video = this.videoEls?.toArray()[index]?.nativeElement;
    if (video) {
      video.muted = nextState;
      if (!nextState && video.paused) {
        video.play()?.catch(() => {});
        this.pausedMap.update(p => ({ ...p, [index]: false }));
      }
    }
  }

  onCardClick(index: number, event: MouseEvent) {
    if (this.hasSwiped) {
      event.preventDefault();
      event.stopPropagation();
      this.hasSwiped = false;
      return;
    }
    const video = this.videoEls?.toArray()[index]?.nativeElement;
    if (!video) return;
    if (video.paused) {
      video.play()?.catch(() => {});
      this.pausedMap.update(p => ({ ...p, [index]: false }));
    } else {
      video.pause();
      this.pausedMap.update(p => ({ ...p, [index]: true }));
    }
  }

  onVideoError(event: any, index: number) {
    console.warn(`[VideoCarousel] Failed to play video #${index}:`, event);
  }

  trackTransform(): string {
    const base = (this.isRtl ? 1 : -1) * (this.currentIndex() * this.slideWidth());
    const offset = this.dragOffsetPx();
    return `translateX(${base + offset}px)`;
  }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
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
    const threshold = 35;
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

  ngOnInit() {
    this.startAutoplay();
  }

  ngAfterViewInit() {
    // Ensure all videos start playing muted immediately
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      this.videoEls?.forEach((vRef, idx) => {
        const el = vRef.nativeElement;
        if (el) {
          el.muted = true;
          el.play()?.catch(() => {
            // Autoplay fallback
            el.muted = true;
            el.play()?.catch(() => {});
          });
        }
      });
    }, 150);
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  startAutoplay() {
    this.stopAutoplay();
    if (typeof window === 'undefined') return;
    this.autoplayTimer = setInterval(() => {
      if (!this.isPaused && this.validVideos().length > this.visibleCardsCount()) {
        this.next();
      }
    }, 4200);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  pauseAutoplay() { this.isPaused = true; }
  resumeAutoplay() { this.isPaused = false; }

  get isRtl() {
    return typeof document !== 'undefined' ? document.dir === 'rtl' : true;
  }

  visibleCardsCount(): number {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth;
    if (w < 480) return 1.6;
    if (w < 768) return 2;
    if (w < 1024) return 3;
    return 4;
  }

  maxIndex(): number {
    const total = this.validVideos().length;
    return Math.max(0, total - Math.floor(this.visibleCardsCount()));
  }

  slideWidth(): number {
    if (typeof window === 'undefined') return 240;
    const w = window.innerWidth;
    if (w < 480) {
      return ((w - 32) * 0.62) + 16;
    }
    if (w < 768) {
      return ((w - 32) / 2) + 16;
    }
    if (w < 1024) {
      return 240 + 16;
    }
    return 260 + 16;
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
}
