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
 * Modern High-Performance Video Carousel Section
 *
 * 1. Background Instant Preloading (Mobile & Desktop):
 *    - Immediately on page load, initiates background fetch() pre-buffering into in-memory Blob URLs.
 *    - Off-screen muted warming: activates hardware video pipelines without waiting for user to scroll.
 *    - By the time the user scrolls down, the video is ALREADY buffered and plays 0ms instantaneously!
 *
 * 2. Smart Sound Policy (User's Exact Specification):
 *    - Muted everywhere while user is above/away from section: ZERO sound leakage.
 *    - When user scrolls into section: exactly ONE video (active front/center card) plays with sound
 *      if s.videoMuted === false (unchecked "بدء التشغيل بدون صوت").
 *    - Audio seamlessly follows the active card on scroll, next/prev, or touch swipe.
 *    - When scrolled away, all videos immediately mute.
 *
 * 3. Mobile Zero-Black-Frame & Native Play Button Elimination:
 *    - Completely suppresses native mobile browser play button overlays via CSS & active buffering.
 *    - Elegant custom glassmorphic play badge if user explicitly pauses a card.
 *    - Touch swipe tracking with RTL awareness.
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

    /* Wrap & Track - Smooth transform */
    .vcar-wrap {
      position: relative;
      overflow: hidden;
      border-radius: 1.25rem;
      border: none !important;
      padding: 0.5rem 0.25rem 1rem;
      user-select: none;
      -webkit-user-select: none;
    }
    .vcar-track {
      display: flex;
      gap: 1rem;
      transition: transform 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
      will-change: transform;
      border: none !important;
    }
    .vcar-track.is-dragging {
      transition: none;
    }

    /* Video Card - Clean modern card */
    .vcar-card {
      position: relative;
      flex: 0 0 calc(50% - 0.5rem);
      min-width: calc(50% - 0.5rem);
      border-radius: 1.25rem;
      overflow: hidden;
      background: #0f172a;
      border: none !important;
      outline: none !important;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      aspect-ratio: var(--vcar-aspect, 9 / 16);
      cursor: pointer;
    }
    .vcar-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
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
      outline: none !important;
    }

    /* Completely suppress native iOS / Android media control overlays */
    .vcar-card video::-webkit-media-controls,
    .vcar-card video::-webkit-media-controls-enclosure,
    .vcar-card video::-webkit-media-controls-panel,
    .vcar-card video::-webkit-media-controls-start-playback-button,
    .vcar-card video::-webkit-media-controls-play-button {
      display: none !important;
      -webkit-appearance: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }

    /* Shimmer placeholder while card video is buffering */
    .vcar-card.is-loading::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
      animation: vcarShimmer 1.8s infinite;
      pointer-events: none;
      z-index: 1;
    }
    @keyframes vcarShimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    /* Custom Glassmorphic Play Icon (shown only when user explicitly pauses card) */
    .vcar-play-badge {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      pointer-events: none;
      z-index: 4;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
      transition: transform 0.2s ease, opacity 0.2s ease;
    }

    /* Floating Sound Button */
    .vcar-card-sound {
      position: absolute;
      top: 12px;
      inset-inline-end: 12px;
      z-index: 5;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.95rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .vcar-card-sound:hover {
      transform: scale(1.1);
      background: rgba(15, 23, 42, 0.9);
    }
    .vcar-card-sound.has-sound {
      background: var(--btn-primary-bg, var(--primary-color, #c88a2c));
      color: #ffffff;
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

    /* Controls */
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
<section #sectionRef class="vcar-section container"
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
    <div class="vcar-track" #trackRef
      [class.is-dragging]="isDragging()"
      [style.transform]="trackTransform()">
      @for (v of validVideos(); track $index) {
        <div class="vcar-card"
          [class.is-loading]="!readyCards().has($index)"
          (click)="onCardClick($index, $event)">
          <video #videoEl
            [src]="getDisplayVideoSrc(v, $index)"
            [poster]="v.posterUrl ? (v.posterUrl | imageUrl:'banner') : null"
            muted
            [muted]="true"
            playsinline
            webkit-playsinline
            loop
            preload="auto"
            (loadedmetadata)="onMetaLoaded(videoEl, $index)"
            (canplay)="onVideoCanPlay(videoEl, $index)"
            (error)="onVideoError($event, $index)">
          </video>

          <!-- Custom subtle play icon when paused by user click -->
          @if (pausedCards().has($index)) {
            <div class="vcar-play-badge">
              <i class="bi bi-play-fill"></i>
            </div>
          }

          <!-- Floating Sound Toggle Button -->
          <button type="button" class="vcar-card-sound"
            [class.has-sound]="isCardActiveSound($index)"
            [attr.aria-label]="isCardActiveSound($index) ? lang.text('كتم الصوت', 'Mute') : lang.text('تشغيل الصوت', 'Unmute')"
            (click)="toggleSound($index, $event)">
            <i class="bi" [class.bi-volume-up-fill]="isCardActiveSound($index)" [class.bi-volume-mute-fill]="!isCardActiveSound($index)"></i>
          </button>

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

  @if (validVideos().length > visibleCardsCount()) {
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
  @ViewChild('sectionRef') sectionRef?: ElementRef<HTMLElement>;
  @ViewChild('trackRef') trackRef?: ElementRef<HTMLElement>;
  @ViewChildren('videoEl') videoEls!: QueryList<ElementRef<HTMLVideoElement>>;

  readonly lang = inject(LanguageService);

  readonly currentIndex = signal(0);
  readonly activeSoundIndex = signal<number>(-1);
  readonly isDragging = signal(false);
  readonly dragOffsetPx = signal(0);
  readonly readyCards = signal<Set<number>>(new Set());
  readonly pausedCards = signal<Set<number>>(new Set());
  readonly blobUrls = signal<Record<number, string>>({});

  private autoplayTimer: any = null;
  private isPaused = false;
  private isInView = false;
  private hasEnteredOnce = false;
  private observer?: IntersectionObserver;
  private gestureListener?: () => void;
  private touchStartX = 0;
  private touchStartY = 0;
  private hasSwiped = false;
  private userMutedAll = false;

  validVideos = computed(() => {
    return (this.s?.videos || []).filter(v => !!(v.url || v.mobileUrl));
  });

  /**
   * Sound policy:
   * Enabled on front/center card if s.videoMuted === false (unchecked "بدء التشغيل بدون صوت" in admin)
   * and user has not clicked mute.
   */
  get wantsSound(): boolean {
    return this.s?.videoMuted === false && !this.userMutedAll;
  }

  get isRtl(): boolean {
    return typeof document !== 'undefined' ? document.dir === 'rtl' : true;
  }

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
   * Returns in-memory blob URL if pre-buffered; otherwise returns streaming URL.
   */
  getDisplayVideoSrc(v: HomeSectionVideo, index: number): string {
    const blob = this.blobUrls()[index];
    if (blob) return blob;
    return this.getVideoSrc(v);
  }

  /**
   * Robust URL resolution with Cache-Busting parameter:
   * 1. If mobile and mobileUrl is set, use mobileUrl; otherwise fallback to desktop url.
   * 2. If desktop and desktop url is set, use url; otherwise fallback to mobileUrl.
   * If only ONE is uploaded, it is automatically used everywhere.
   */
  getVideoSrc(v: HomeSectionVideo): string {
    if (!v) return '';
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const desktopUrl = (v.url || '').trim();
    const mobileUrl = (v.mobileUrl || '').trim();

    let url = isMobile
      ? (mobileUrl || desktopUrl)
      : (desktopUrl || mobileUrl);

    if (!url) return '';
    const separator = url.includes('?') ? '&' : '?';
    const cleanUrl = url.includes('v=') ? url : `${url}${separator}v=stream`;

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
      return cleanUrl;
    }
    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  }

  visibleCardsCount(): number {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return 3;
    return 4;
  }

  maxIndex(): number {
    const total = this.validVideos().length;
    return Math.max(0, total - this.visibleCardsCount());
  }

  slideWidth(): number {
    const track = this.trackRef?.nativeElement;
    const card = track?.querySelector('.vcar-card') as HTMLElement;
    if (card && card.offsetWidth > 0) {
      return card.offsetWidth + 16;
    }
    if (typeof window === 'undefined') return 280;
    const w = window.innerWidth;
    if (w < 768) return ((w - 32) / 2);
    if (w < 1024) return 260 + 16;
    return 280 + 16;
  }

  trackTransform(): string {
    const step = this.slideWidth();
    const base = (this.isRtl ? 1 : -1) * (this.currentIndex() * step);
    const offset = this.dragOffsetPx();
    return `translateX(${base + offset}px)`;
  }

  isCardActiveSound(index: number): boolean {
    return this.activeSoundIndex() === index;
  }

  /**
   * Sound toggle button clicked directly by user
   */
  toggleSound(index: number, event: Event) {
    event.stopPropagation();
    const isCurrentlySound = this.isCardActiveSound(index);
    const videoArray = this.videoEls?.toArray() || [];

    if (isCurrentlySound) {
      this.userMutedAll = true;
      this.activeSoundIndex.set(-1);
      videoArray.forEach(vRef => {
        if (vRef.nativeElement) vRef.nativeElement.muted = true;
      });
    } else {
      this.userMutedAll = false;
      this.activeSoundIndex.set(index);
      videoArray.forEach((vRef, idx) => {
        const el = vRef.nativeElement;
        if (!el) return;
        if (idx === index) {
          el.muted = false;
          el.play()?.catch(() => {});
        } else {
          el.muted = true;
        }
      });
      if (index > this.maxIndex()) {
        this.currentIndex.set(this.maxIndex());
      } else {
        this.currentIndex.set(index);
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
      video.play()?.then(() => {
        this.pausedCards.update(s => {
          const n = new Set(s);
          n.delete(index);
          return n;
        });
      }).catch(() => {});
    } else {
      video.pause();
      this.pausedCards.update(s => new Set(s).add(index));
    }

    if (this.currentIndex() !== index && index <= this.maxIndex()) {
      this.goTo(index);
    }
  }

  onMetaLoaded(videoEl: HTMLVideoElement, index: number) {
    this.readyCards.update(set => new Set(set).add(index));
    // Warm up decoder quietly in the background without freezing seek
    if (videoEl && videoEl.paused) {
      videoEl.muted = true;
      videoEl.play()?.catch(() => {});
    }
  }

  onVideoCanPlay(videoEl: HTMLVideoElement, index: number) {
    this.readyCards.update(set => new Set(set).add(index));
    if (this.isInView) {
      if (index === this.currentIndex() && this.wantsSound) {
        this.applySoundToActiveCard();
      }
    }
  }

  onVideoError(event: any, index: number) {
    console.warn(`[VideoCarousel] Video #${index} error:`, event);
  }

  ngOnInit() {
    this.startBackgroundPreload();
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;

    // 1. Immediately warm all video elements with muted playback so mobile starts buffering frames
    this.videoEls.changes?.subscribe(() => this.warmAllVideos());
    this.warmAllVideos();

    // 2. IntersectionObserver: triggers audio and active focus ONLY when user reaches the section
    const sectionEl = this.sectionRef?.nativeElement;
    if (sectionEl && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          this.onSectionEnter();
        } else {
          this.onSectionLeave();
        }
      }, { threshold: 0.15 });
      this.observer.observe(sectionEl);
    } else {
      this.onSectionEnter();
    }

    // 3. User Gesture Audio Unlocker: Scrolling / touching screen unlocks mobile audio policy
    const gestureUnlock = () => {
      if (this.isInView && this.wantsSound && this.activeSoundIndex() === -1) {
        this.applySoundToActiveCard();
      }
    };
    this.gestureListener = gestureUnlock;
    window.addEventListener('click', gestureUnlock, { passive: true });
    window.addEventListener('touchstart', gestureUnlock, { passive: true });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.stopAutoplay();
    if (typeof window !== 'undefined' && this.gestureListener) {
      window.removeEventListener('click', this.gestureListener);
      window.removeEventListener('touchstart', this.gestureListener);
    }
    // Clean up created blob URLs
    Object.values(this.blobUrls()).forEach(url => {
      try { URL.revokeObjectURL(url); } catch (_) {}
    });
  }

  /**
   * Pre-fetches videos in the background using standard fetch() which mobile browsers
   * do NOT throttle or defer like off-screen <video> tags!
   */
  private startBackgroundPreload() {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    const vids = this.validVideos();
    if (!vids.length) return;

    // Load sequentially starting with active card 0, then 1, 2, 3...
    const fetchNext = (idx: number) => {
      if (idx >= vids.length) return;
      const v = vids[idx];
      const src = this.getVideoSrc(v);
      if (!src) {
        fetchNext(idx + 1);
        return;
      }

      fetch(src, { mode: 'cors' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then(blob => {
          if (blob && blob.size > 1000) {
            const blobUrl = URL.createObjectURL(blob);
            this.blobUrls.update(m => ({ ...m, [idx]: blobUrl }));

            // Swap video element src to in-memory blob for instantaneous seeking & replay
            const vRef = this.videoEls?.toArray()[idx]?.nativeElement;
            if (vRef && !vRef.src.startsWith('blob:')) {
              const curTime = vRef.currentTime;
              const wasPlaying = !vRef.paused;
              vRef.src = blobUrl;
              vRef.currentTime = curTime;
              if (wasPlaying) vRef.play().catch(() => {});
            }
          }
          fetchNext(idx + 1);
        })
        .catch(() => {
          // If fetch fails, streaming fallback handles it smoothly
          fetchNext(idx + 1);
        });
    };

    fetchNext(0);
  }

  /**
   * Pre-warms hardware decoders in muted mode so the first frames are buffered before scroll
   */
  private warmAllVideos() {
    this.videoEls?.forEach(vRef => {
      const el = vRef.nativeElement;
      if (el) {
        el.muted = true;
        el.playsInline = true;
        if (el.paused) {
          el.play()?.catch(() => {});
        }
      }
    });
  }

  /**
   * User reaches this section: Start audio on center video & resume full experience
   */
  private onSectionEnter() {
    this.isInView = true;
    this.warmAllVideos();

    // If entering for the first time, reset the active video so user sees it from start
    if (!this.hasEnteredOnce) {
      this.hasEnteredOnce = true;
      const activeVideo = this.videoEls?.toArray()[this.currentIndex()]?.nativeElement;
      if (activeVideo && activeVideo.currentTime > 0) {
        try { activeVideo.currentTime = 0; } catch (_) {}
      }
    }

    this.applySoundToActiveCard();
    this.startAutoplay();
  }

  /**
   * User leaves this section: Mute ALL videos immediately to prevent any sound bleed
   */
  private onSectionLeave() {
    this.isInView = false;
    this.stopAutoplay();
    this.activeSoundIndex.set(-1);
    this.videoEls?.forEach(vRef => {
      const el = vRef.nativeElement;
      if (el) {
        el.muted = true;
      }
    });
  }

  /**
   * Safely enables sound on EXACTLY ONE active front/center video.
   * All other videos are guaranteed to be muted.
   */
  private applySoundToActiveCard() {
    if (!this.isInView) return;
    const activeIdx = this.currentIndex();
    const videoArray = this.videoEls?.toArray() || [];
    const shouldUnmute = this.wantsSound;

    videoArray.forEach((vRef, idx) => {
      const el = vRef.nativeElement;
      if (!el) return;

      if (idx === activeIdx && shouldUnmute) {
        try {
          el.muted = false;
          if (el.paused) {
            const p = el.play();
            if (p !== undefined) {
              p.then(() => {
                this.activeSoundIndex.set(activeIdx);
              }).catch(() => {
                // Browser policy blocked unmuted playback without prior touch
                el.muted = true;
                this.activeSoundIndex.set(-1);
                el.play()?.catch(() => {});
              });
            } else {
              this.activeSoundIndex.set(activeIdx);
            }
          } else {
            this.activeSoundIndex.set(activeIdx);
          }
        } catch (_) {
          el.muted = true;
          this.activeSoundIndex.set(-1);
        }
      } else {
        el.muted = true;
      }
    });
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

  prev() {
    this.currentIndex.update(i => {
      if (i <= 0) return this.maxIndex();
      return i - 1;
    });
    this.applySoundToActiveCard();
  }

  next() {
    this.currentIndex.update(i => {
      if (i >= this.maxIndex()) return 0;
      return i + 1;
    });
    this.applySoundToActiveCard();
  }

  goTo(i: number) {
    this.currentIndex.set(Math.min(i, this.maxIndex()));
    this.applySoundToActiveCard();
  }

  dotArray(): any[] {
    const count = this.maxIndex() + 1;
    return Array.from({ length: Math.min(count, 8) });
  }

  startAutoplay() {
    this.stopAutoplay();
    if (typeof window === 'undefined') return;
    this.autoplayTimer = setInterval(() => {
      if (!this.isPaused && this.isInView && this.validVideos().length > this.visibleCardsCount()) {
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
