import {
  AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, ViewEncapsulation,
  computed, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HomeSection, HomeSectionVideo } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

/**
 * Video Carousel Section
 * Lightweight multi-video player: only the active clip is loaded, clips auto-advance
 * when they end, playback pauses when the section leaves the viewport.
 */
@Component({
  selector: 'app-section-video-carousel',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollAnimateDirective, ImageUrlPipe],
  styles: [`
    .vcar-section { padding: 2.5rem 0; background: var(--vcar-bg, transparent); color: var(--vcar-text, var(--text-main, #0f172a)); }
    .vcar-section.is-full { padding-inline: 0; }
    .vcar-header { text-align: center; margin-bottom: 1.5rem; padding-inline: 1rem; }
    .vcar-eyebrow { display: inline-block; font-size: .78rem; font-weight: 800; letter-spacing: .04em; color: var(--primary-color); margin-bottom: .4rem; }
    .vcar-title { font-size: clamp(1.4rem, 2.6vw, 1.95rem); font-weight: 800; margin: 0; color: inherit; }
    .vcar-sub { margin: .5rem auto 0; max-width: 640px; opacity: .75; font-size: .95rem; }

    .vcar-stage {
      position: relative; width: 100%; margin: 0 auto; overflow: hidden;
      aspect-ratio: var(--vcar-aspect, 16 / 9);
      border-radius: var(--radius-card, 20px);
      background: #000; box-shadow: 0 12px 32px rgba(15, 23, 42, .14);
      max-height: 82vh; touch-action: pan-y;
    }
    .vcar-section:not(.is-full) .vcar-stage.is-portrait { max-width: 460px; }
    .vcar-section.is-full .vcar-stage { border-radius: 0; box-shadow: none; }
    @media (max-width: 767px) {
      .vcar-stage { aspect-ratio: var(--vcar-aspect-m, var(--vcar-aspect, 16 / 9)); }
      .vcar-section:not(.is-full) .vcar-stage.is-portrait-m { max-width: 100%; }
    }

    .vcar-video {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: var(--vcar-fit, cover); background: #000;
      opacity: 0; transition: opacity .45s ease;
    }
    .vcar-video.is-ready { opacity: 1; }
    .vcar-poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: var(--vcar-fit, cover); }

    .vcar-shade { position: absolute; inset: auto 0 0 0; height: 45%; pointer-events: none;
      background: linear-gradient(to top, rgba(0,0,0,.55), transparent); }

    .vcar-progress { position: absolute; top: 12px; inset-inline: 14px; display: flex; gap: 5px; z-index: 3; }
    .vcar-bar { flex: 1; height: 3px; border-radius: 3px; background: rgba(255,255,255,.35); overflow: hidden; border: 0; padding: 0; cursor: pointer; }
    .vcar-bar > span { display: block; height: 100%; width: 0; background: #fff; transition: width .2s linear; }
    .vcar-bar.done > span { width: 100%; }

    .vcar-caption { position: absolute; inset-inline: 16px; bottom: 16px; z-index: 3; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; color: #fff; }
    .vcar-caption h3 { margin: 0; font-size: clamp(1rem, 2vw, 1.3rem); font-weight: 800; text-shadow: 0 2px 8px rgba(0,0,0,.35); }
    .vcar-cta { flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px;
      background: var(--btn-primary-bg, var(--primary-color)); color: var(--btn-primary-text, #fff); font-weight: 800; font-size: .85rem; text-decoration: none; }

    .vcar-ctrl { position: absolute; z-index: 4; width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(255,255,255,.4);
      background: rgba(15,23,42,.35); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); color: #fff;
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .15s ease, background .15s ease; }
    .vcar-ctrl:hover { background: rgba(15,23,42,.55); }
    .vcar-ctrl:active { transform: scale(.92); }
    .vcar-prev, .vcar-next { top: 50%; margin-top: -19px; opacity: 0; transition: opacity .2s ease; }
    .vcar-stage:hover .vcar-prev, .vcar-stage:hover .vcar-next { opacity: 1; }
    .vcar-prev { inset-inline-start: 12px; }
    .vcar-next { inset-inline-end: 12px; }
    .vcar-mute { top: 26px; inset-inline-end: 14px; }
    .vcar-play { top: 26px; inset-inline-end: 60px; }
    @media (hover: none) { .vcar-prev, .vcar-next { opacity: 1; width: 34px; height: 34px; margin-top: -17px; } }

    .vcar-thumbs { display: flex; justify-content: center; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
    .vcar-dot { width: 8px; height: 8px; border-radius: 999px; border: 0; padding: 0; background: color-mix(in srgb, currentColor 25%, transparent); cursor: pointer; transition: width .2s ease, background .2s ease; }
    .vcar-dot.active { width: 22px; background: var(--primary-color); }
    .vcar-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,.7); font-size: .9rem; }
  `],
  template: `
@if (videos().length) {
<section class="vcar-section"
  [class.is-full]="s.videoWidth === 'full'"
  [style.--vcar-bg]="s.backgroundColor || null"
  [style.--vcar-text]="s.textColor || null"
  [style.--vcar-aspect]="aspectCss(s.videoAspect || '16/9')"
  [style.--vcar-aspect-m]="s.videoMobileAspect ? aspectCss(s.videoMobileAspect) : null"
  [style.--vcar-fit]="s.videoFit || 'cover'"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false">
  <div [class.container]="s.videoWidth !== 'full'">
    @if (title() || subtitle() || eyebrow()) {
      <div class="vcar-header">
        @if (eyebrow()) { <span class="vcar-eyebrow">{{ eyebrow() }}</span> }
        @if (title()) { <h2 class="vcar-title">{{ title() }}</h2> }
        @if (subtitle()) { <p class="vcar-sub">{{ subtitle() }}</p> }
      </div>
    }

    <div class="vcar-stage" #stage
      [class.is-portrait]="isPortrait(s.videoAspect)"
      [class.is-portrait-m]="isPortrait(s.videoMobileAspect)"
      (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)">
      @if (current().posterUrl && !ready()) {
        <img class="vcar-poster" [src]="current().posterUrl! | imageUrl:'banner'" alt="" loading="lazy" decoding="async">
      }
      <video #player class="vcar-video" [class.is-ready]="ready()"
        playsinline webkit-playsinline preload="metadata"
        [muted]="muted()" [controls]="!!s.videoShowControls"
        [loop]="videos().length === 1 && s.videoLoop !== false"
        [attr.poster]="current().posterUrl ? (current().posterUrl! | imageUrl:'banner') : null"
        (loadeddata)="onLoaded()" (ended)="onEnded()" (timeupdate)="onTime()"
        (play)="playing.set(true)" (pause)="playing.set(false)"></video>
      <div class="vcar-shade"></div>

      @if (videos().length > 1) {
        <div class="vcar-progress" role="tablist">
          @for (v of videos(); track $index) {
            <button type="button" class="vcar-bar" [class.done]="$index < index()"
              [attr.aria-label]="lang.text('فيديو ', 'Video ') + ($index + 1)" (click)="go($index)">
              <span [style.width.%]="$index === index() ? progress() : null"></span>
            </button>
          }
        </div>
        <button type="button" class="vcar-ctrl vcar-prev" [attr.aria-label]="lang.text('السابق', 'Previous')" (click)="prev()">
          <i class="bi" [class.bi-chevron-right]="lang.isRtl()" [class.bi-chevron-left]="!lang.isRtl()"></i>
        </button>
        <button type="button" class="vcar-ctrl vcar-next" [attr.aria-label]="lang.text('التالي', 'Next')" (click)="next()">
          <i class="bi" [class.bi-chevron-left]="lang.isRtl()" [class.bi-chevron-right]="!lang.isRtl()"></i>
        </button>
      }

      @if (!s.videoShowControls) {
        <button type="button" class="vcar-ctrl vcar-mute" [attr.aria-label]="muted() ? lang.text('تشغيل الصوت', 'Unmute') : lang.text('كتم الصوت', 'Mute')" (click)="toggleMute()">
          <i class="bi" [class.bi-volume-mute-fill]="muted()" [class.bi-volume-up-fill]="!muted()"></i>
        </button>
        <button type="button" class="vcar-ctrl vcar-play" [attr.aria-label]="playing() ? lang.text('إيقاف مؤقت', 'Pause') : lang.text('تشغيل', 'Play')" (click)="togglePlay()">
          <i class="bi" [class.bi-pause-fill]="playing()" [class.bi-play-fill]="!playing()"></i>
        </button>
      }

      @if (captionTitle() || current().link) {
        <div class="vcar-caption">
          <h3>{{ captionTitle() }}</h3>
          @if (current().link) {
            <a class="vcar-cta" [routerLink]="linkPath(current().link!)" [queryParams]="linkQuery(current().link!)">
              {{ lang.text(s.buttonText || 'تسوق الآن', s.buttonTextEn || 'Shop now') }}
            </a>
          }
        </div>
      }
    </div>
  </div>
</section>
}
`
})
export class SectionVideoCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  @ViewChild('player') playerRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('stage') stageRef?: ElementRef<HTMLElement>;
  readonly lang = inject(LanguageService);

  readonly index = signal(0);
  readonly progress = signal(0);
  readonly ready = signal(false);
  readonly playing = signal(false);
  readonly muted = signal(true);
  private visible = false;
  private userPaused = false;
  private observer?: IntersectionObserver;
  private mql?: MediaQueryList;
  private touchX = 0;

  videos = () => (this.s?.videos || []).filter(v => !!(v.url || v.mobileUrl));
  current = (): HomeSectionVideo => this.videos()[this.index()] || { url: '' };

  title() { return this.lang.text(this.s.title, this.s.titleEn); }
  subtitle() { return this.lang.text(this.s.subtitle, this.s.subtitleEn); }
  eyebrow() { return this.lang.text(this.s.eyebrow, this.s.eyebrowEn); }
  captionTitle() { const c = this.current(); return this.lang.text(c.title || '', c.titleEn || ''); }

  aspectCss(a: string) { return a.replace('/', ' / '); }
  isPortrait(a?: string) { return a === '9/16' || a === '4/5'; }

  linkPath(link: string) { return link.split('?')[0]; }
  linkQuery(link: string) {
    const q = link.split('?')[1]; if (!q) return null;
    const out: Record<string, string> = {};
    new URLSearchParams(q).forEach((v, k) => out[k] = v);
    return out;
  }

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;
    this.muted.set(this.s.videoMuted !== false);
    this.mql = window.matchMedia('(max-width: 767px)');
    this.mql.addEventListener?.('change', this.onBreakpoint);
    const stage = this.stageRef?.nativeElement;
    if (stage && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(entries => {
        this.visible = entries[0]?.isIntersecting ?? false;
        if (this.visible) {
          if (!this.playerRef?.nativeElement.currentSrc) this.load(); else if (!this.userPaused) this.play();
        } else {
          this.playerRef?.nativeElement.pause();
        }
      }, { threshold: 0.35 });
      this.observer.observe(stage);
    } else {
      this.visible = true;
      this.load();
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.mql?.removeEventListener?.('change', this.onBreakpoint);
    const el = this.playerRef?.nativeElement;
    if (el) { el.pause(); el.removeAttribute('src'); el.load(); }
  }

  private onBreakpoint = () => this.load();

  private srcFor(v: HomeSectionVideo) {
    const mobile = this.mql?.matches;
    return (mobile ? (v.mobileUrl || v.url) : (v.url || v.mobileUrl)) || '';
  }

  private load() {
    const el = this.playerRef?.nativeElement;
    const v = this.current();
    if (!el || !v) return;
    this.ready.set(false);
    this.progress.set(0);
    el.src = this.srcFor(v);
    el.load();
    if (this.visible && !this.userPaused) this.play();
  }

  private play() {
    const el = this.playerRef?.nativeElement;
    if (!el) return;
    el.muted = this.muted();
    el.play()?.catch(() => {
      // Browsers block autoplay with sound: fall back to muted autoplay.
      if (!el.muted) { this.muted.set(true); el.muted = true; el.play()?.catch(() => {}); }
    });
  }

  onLoaded() { this.ready.set(true); }

  onTime() {
    const el = this.playerRef?.nativeElement;
    if (el && el.duration) this.progress.set(Math.min(100, (el.currentTime / el.duration) * 100));
  }

  onEnded() {
    const total = this.videos().length;
    if (total <= 1) return;
    if (this.index() === total - 1 && this.s.videoLoop === false) { this.progress.set(100); return; }
    this.next();
  }

  go(i: number) {
    const total = this.videos().length;
    if (!total) return;
    this.index.set((i + total) % total);
    this.userPaused = false;
    this.load();
  }
  next() { this.go(this.index() + 1); }
  prev() { this.go(this.index() - 1); }

  toggleMute() {
    const el = this.playerRef?.nativeElement;
    this.muted.set(!this.muted());
    if (el) el.muted = this.muted();
  }

  togglePlay() {
    const el = this.playerRef?.nativeElement;
    if (!el) return;
    if (el.paused) { this.userPaused = false; this.play(); } else { this.userPaused = true; el.pause(); }
  }

  onTouchStart(e: TouchEvent) { this.touchX = e.touches[0]?.clientX ?? 0; }
  onTouchEnd(e: TouchEvent) {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - this.touchX;
    if (Math.abs(dx) < 45 || this.videos().length < 2) return;
    const forward = this.lang.isRtl() ? dx > 0 : dx < 0;
    forward ? this.next() : this.prev();
  }
}
