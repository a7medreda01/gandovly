import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, QueryList,
  ViewChild, ViewChildren, ViewEncapsulation, computed, inject, signal
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
 * Uses native CSS scroll snap for pixel-perfect card alignment (no half-cut cards),
 * robust autoplay with fallback frame decoding (no black screens),
 * and desktop/mobile fallback so videos play everywhere.
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
      margin-bottom: 1.25rem;
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

    /* Track with CSS Scroll Snap: Guarantee no cards cut in half */
    .vcar-track {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      border: none !important;
      padding: 0.5rem 0.25rem 1rem;
      touch-action: pan-x pan-y;
    }
    .vcar-track::-webkit-scrollbar {
      display: none;
    }

    /* Video Card - No border, clean modern shadow, exact snapping */
    .vcar-card {
      position: relative;
      flex: 0 0 calc(50% - 0.5rem);
      min-width: calc(50% - 0.5rem);
      max-width: calc(50% - 0.5rem);
      scroll-snap-align: start;
      scroll-snap-stop: always;
      border-radius: 1.25rem;
      overflow: hidden;
      background: #0f172a;
      border: none !important;
      outline: none !important;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      aspect-ratio: var(--vcar-aspect, 9 / 16);
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
    }
    .vcar-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 32px rgba(15, 23, 42, 0.16);
    }
    @media (max-width: 480px) {
      .vcar-card {
        flex: 0 0 calc(50% - 0.5rem);
        min-width: calc(50% - 0.5rem);
        max-width: calc(50% - 0.5rem);
      }
    }
    @media (min-width: 768px) {
      .vcar-card {
        flex: 0 0 calc(33.333% - 0.67rem);
        min-width: calc(33.333% - 0.67rem);
        max-width: calc(33.333% - 0.67rem);
      }
    }
    @media (min-width: 1024px) {
      .vcar-card {
        flex: 0 0 calc(25% - 0.75rem);
        min-width: calc(25% - 0.75rem);
        max-width: calc(25% - 0.75rem);
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
      background: rgba(15, 23, 42, 0.65);
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
      background: rgba(15, 23, 42, 0.85);
    }

    /* Floating Play/Pause Indicator */
    .vcar-play-badge {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      pointer-events: none;
      z-index: 3;
      transition: opacity 0.2s ease;
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

  <div class="vcar-track" #trackRef (scroll)="onScroll()">
    @for (v of validVideos(); track $index) {
      <div class="vcar-card" (click)="onCardClick($index, $event)">
        <video #videoEl
          [src]="getVideoSrc(v)"
          [poster]="v.posterUrl ? (v.posterUrl | imageUrl:'banner') : null"
          playsinline webkit-playsinline
          [muted]="true"
          [attr.muted]="''"
          autoplay loop preload="auto"
          (loadedmetadata)="onMetadataLoaded(videoEl, $index)"
          (play)="onVideoPlay($index)"
          (pause)="onVideoPause($index)"
          (error)="onVideoError($event, $index)">
        </video>

        <!-- Floating Sound Toggle Button -->
        <button type="button" class="vcar-card-sound"
          [attr.aria-label]="isCardMuted($index) ? lang.text('تشغيل الصوت', 'Unmute') : lang.text('كتم الصوت', 'Mute')"
          (click)="toggleSound($index, $event)">
          <i class="bi" [class.bi-volume-mute-fill]="isCardMuted($index)" [class.bi-volume-up-fill]="!isCardMuted($index)"></i>
        </button>

        <!-- Play/Pause indicator when video is paused -->
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
  @ViewChild('trackRef') trackRef?: ElementRef<HTMLElement>;
  @ViewChildren('videoEl') videoEls!: QueryList<ElementRef<HTMLVideoElement>>;

  readonly lang = inject(LanguageService);

  readonly currentIndex = signal(0);
  readonly mutedMap = signal<Record<number, boolean>>({});
  readonly pausedMap = signal<Record<number, boolean>>({});

  private autoplayTimer: any = null;
  private isPaused = false;
  private unlockListener?: () => void;

  validVideos = computed(() => {
    return (this.s?.videos || []).filter(v => !!(v.url || v.mobileUrl));
  });

  title() { return this.lang.text(this.s?.title, this.s?.titleEn); }
  subtitle() { return this.lang.text(this.s?.subtitle, this.s?.subtitleEn); }
  eyebrow() { return this.lang.text(this.s?.eyebrow, this.s?.eyebrowEn); }
  cardTitle(v: HomeSectionVideo) { return this.lang.text(v.title || '', v.titleEn || ''); }

  aspectCss(a: string) { return (a || '9/16').replace('/', ' / '); }

  linkPath(link: string) { return (link || '').split('?')[0] || '/menu'; }
  linkQuery(link: string) {
    const q = (link || '').split('?')[1];
    if (!q) return null;
    const out: Record<string, string> = {};
    new URLSearchParams(q).forEach((v, k) => out[k] = v);
    return out;
  }

  /**
   * Robust URL resolution:
   * 1. If mobile and mobileUrl is set, use mobileUrl; otherwise fallback to url.
   * 2. If desktop and url is set, use url; otherwise fallback to mobileUrl.
   * If only ONE of them is uploaded, it is automatically used everywhere!
   */
  getVideoSrc(v: HomeSectionVideo): string {
    if (!v) return '';
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    let url = isMobile
      ? (v.mobileUrl?.trim() || v.url?.trim() || '')
      : (v.url?.trim() || v.mobileUrl?.trim() || '');

    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
  }

  isCardMuted(index: number): boolean {
    const map = this.mutedMap();
    return map[index] !== undefined ? map[index] : true;
  }

  isCardPaused(index: number): boolean {
    return !!this.pausedMap()[index];
  }

  onVideoPlay(index: number) {
    this.pausedMap.update(p => ({ ...p, [index]: false }));
  }

  onVideoPause(index: number) {
    this.pausedMap.update(p => ({ ...p, [index]: true }));
  }

  onMetadataLoaded(video: HTMLVideoElement, index: number) {
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    // Attempt muted autoplay
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.pausedMap.update(p => ({ ...p, [index]: false }));
      }).catch(() => {
        // Autoplay was blocked by browser MEI policy:
        // Seek slightly to force the browser to render the first video frame (prevents black box)
        try {
          if (video.currentTime === 0) {
            video.currentTime = 0.05;
          }
        } catch (_) {}
        this.pausedMap.update(p => ({ ...p, [index]: true }));
      });
    }
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
    console.warn(`[VideoCarousel] Video #${index} failed:`, event);
  }

  ngOnInit() {
    this.startAutoplay();
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;

    // Start all videos muted immediately
    setTimeout(() => {
      this.playAllVideos();
    }, 150);

    // Global one-time interaction listener to unblock autoplay on any user interaction
    const unlock = () => {
      this.playAllVideos();
      window.removeEventListener('click', unlock);
      window.removeEventListener('scroll', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    this.unlockListener = unlock;
    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('scroll', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  ngOnDestroy() {
    this.stopAutoplay();
    if (typeof window !== 'undefined' && this.unlockListener) {
      window.removeEventListener('click', this.unlockListener);
      window.removeEventListener('scroll', this.unlockListener);
      window.removeEventListener('touchstart', this.unlockListener);
    }
  }

  private playAllVideos() {
    this.videoEls?.forEach((vRef, idx) => {
      const el = vRef.nativeElement;
      if (el) {
        el.muted = true;
        el.defaultMuted = true;
        el.play()?.then(() => {
          this.pausedMap.update(p => ({ ...p, [idx]: false }));
        }).catch(() => {
          try {
            if (el.currentTime === 0) el.currentTime = 0.05;
          } catch (_) {}
        });
      }
    });
  }

  get isRtl(): boolean {
    return typeof document !== 'undefined' ? document.dir === 'rtl' : true;
  }

  onScroll() {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    const cards = track.querySelectorAll('.vcar-card');
    if (!cards.length) return;
    const cardEl = cards[0] as HTMLElement;
    const step = cardEl.offsetWidth + 16;
    if (step <= 0) return;
    const scrollLeft = Math.abs(track.scrollLeft);
    const index = Math.round(scrollLeft / step);
    this.currentIndex.set(Math.min(index, this.validVideos().length - 1));
  }

  scrollByStep(direction: number) {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    const cards = track.querySelectorAll('.vcar-card');
    if (!cards.length) return;
    const cardEl = cards[0] as HTMLElement;
    const step = cardEl.offsetWidth + 16; // card width + gap
    // In RTL, standard scrollLeft can be negative or positive depending on browser.
    // Modern smooth scrollBy in RTL works with direction * step * (isRtl ? -1 : 1)
    const sign = this.isRtl ? -1 : 1;
    track.scrollBy({ left: direction * step * sign, behavior: 'smooth' });
  }

  next() {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const currentScroll = Math.abs(track.scrollLeft);
    if (currentScroll >= maxScroll - 25) {
      // Wrap around smoothly to start
      track.scrollTo({ left: 0, behavior: 'smooth' });
      this.currentIndex.set(0);
    } else {
      this.scrollByStep(1);
    }
  }

  prev() {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    const currentScroll = Math.abs(track.scrollLeft);
    if (currentScroll <= 25) {
      // Wrap to end
      const maxScroll = track.scrollWidth - track.clientWidth;
      const sign = this.isRtl ? -1 : 1;
      track.scrollTo({ left: maxScroll * sign, behavior: 'smooth' });
    } else {
      this.scrollByStep(-1);
    }
  }

  goTo(i: number) {
    const track = this.trackRef?.nativeElement;
    if (!track) return;
    const cards = track.querySelectorAll('.vcar-card');
    if (!cards.length || !cards[i]) return;
    const card = cards[i] as HTMLElement;
    card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    this.currentIndex.set(i);
  }

  dotArray(): any[] {
    return Array.from({ length: this.validVideos().length });
  }

  startAutoplay() {
    this.stopAutoplay();
    if (typeof window === 'undefined') return;
    this.autoplayTimer = setInterval(() => {
      if (!this.isPaused && this.validVideos().length > 1) {
        this.next();
      }
    }, 4500);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  pauseAutoplay() { this.isPaused = true; }
  resumeAutoplay() { this.isPaused = false; }
}
