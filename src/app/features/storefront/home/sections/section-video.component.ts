import { Component, Input, inject, computed , ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Video Section
 * Video presentation block supporting YouTube/Vimeo embeds or direct MP4 video
 */
@Component({
  selector: 'app-section-video',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  styles: [`
    .video-section {
      padding: 2.5rem 0;
      text-align: center;
    }
    .video-header {
      margin-bottom: 2rem;
    }
    .video-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-color, #0f172a);
      margin: 0;
    }
    .video-frame-wrap {
      max-width: 900px;
      margin: 0 auto;
      border-radius: 1.5rem;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      aspect-ratio: 16 / 9;
      background: #000000;
      position: relative;
    }
    .video-frame-wrap iframe,
    .video-frame-wrap video {
      width: 100%;
      height: 100%;
      border: 0;
    }
  `],
  template: `
<section class="video-section container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false">
  <div class="video-header">
    <h2 class="video-title">{{ title() }}</h2>
    @if (subtitle()) {
      <p class="text-muted mt-2">{{ subtitle() }}</p>
    }
  </div>

  <div class="video-frame-wrap">
    @if (safeEmbedUrl()) {
      <iframe [src]="safeEmbedUrl()!"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    } @else {
      <video controls [poster]="s.imageUrl || ''">
        <source [src]="s.videoUrl || s.link" type="video/mp4">
        {{ lang.text('متصفحك لا يدعم تشغيل الفيديو', 'Your browser does not support HTML5 video') }}
      </video>
    }
  </div>
</section>
`
})
export class SectionVideoComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  private sanitizer = inject(DomSanitizer);

  title() { return this.lang.text(this.s.title || 'شاهد منتجاتنا قيد الاستخدام', this.s.titleEn || 'See Our Products In Action'); }
  subtitle() { return this.lang.text(this.s.subtitle, this.s.subtitleEn); }

  safeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const raw = this.s.videoUrl || this.s.link || '';
    if (!raw) return null;

    // Convert youtube watch/share link to embed URL
    if (raw.includes('youtube.com/watch') || raw.includes('youtu.be/')) {
      const match = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match && match[1]) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${match[1]}`);
      }
    }
    // Vimeo embed
    if (raw.includes('vimeo.com/')) {
      const match = raw.match(/vimeo\.com\/(\d+)/);
      if (match && match[1]) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${match[1]}`);
      }
    }
    return null;
  });
}
