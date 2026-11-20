import { Component, Input, inject, signal, OnInit, OnDestroy , ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Flash Sale Countdown Section
 * Shows real countdown days/hours/minutes/seconds for limited-time offers with CTA
 */
@Component({
  selector: 'app-section-countdown',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollAnimateDirective],
  styles: [`
    .countdown-section {
      padding: 2.5rem 1.5rem;
      border-radius: 1.5rem;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: var(--cd-text, #ffffff);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .countdown-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(239, 68, 68, 0.16);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #ef4444;
      padding: 0.35rem 1rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .countdown-title {
      font-size: 1.85rem;
      font-weight: 800;
      margin: 0 0 0.5rem;
      color: var(--cd-text, #ffffff);
    }
    .countdown-subtitle {
      color: color-mix(in srgb, var(--cd-text, #ffffff) 76%, transparent);
      font-size: 0.95rem;
      max-width: 500px;
      margin: 0 auto 1.75rem;
    }
    .timer-boxes {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 1.75rem;
    }
    .timer-box {
      background: color-mix(in srgb, var(--cd-text, #ffffff) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--cd-text, #ffffff) 18%, transparent);
      border-radius: 1rem;
      min-width: 65px;
      padding: 0.75rem 0.5rem;
      backdrop-filter: blur(8px);
    }
    .timer-num {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--cd-text, #ffffff);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .timer-label {
      font-size: 0.7rem;
      color: color-mix(in srgb, var(--cd-text, #ffffff) 68%, transparent);
      text-transform: uppercase;
      margin-top: 0.35rem;
      display: block;
    }
    .btn-countdown-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--btn-primary-bg, var(--primary-color, #ef4444));
      color: var(--btn-primary-text, #ffffff);
      padding: 0.75rem 2rem;
      border-radius: 9999px;
      font-weight: 700;
      text-decoration: none;
      transition: transform 0.2s, filter 0.2s;
    }
    .btn-countdown-cta:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
  `],
  template: `
<section class="countdown-section container"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null"
  [style.color]="effectiveTextColor()"
  [style.--cd-text]="effectiveTextColor()">
  <div class="countdown-badge">
    <i class="bi bi-lightning-charge-fill"></i>
    <span>{{ eyebrow() }}</span>
  </div>

  <h2 class="countdown-title">{{ title() }}</h2>
  @if (subtitle()) {
    <p class="countdown-subtitle">{{ subtitle() }}</p>
  }

  <div class="timer-boxes" dir="ltr">
    <div class="timer-box">
      <div class="timer-num">{{ days() }}</div>
      <span class="timer-label">{{ lang.text('يوم', 'Days') }}</span>
    </div>
    <div class="timer-box">
      <div class="timer-num">{{ hours() }}</div>
      <span class="timer-label">{{ lang.text('ساعة', 'Hours') }}</span>
    </div>
    <div class="timer-box">
      <div class="timer-num">{{ minutes() }}</div>
      <span class="timer-label">{{ lang.text('دقيقة', 'Mins') }}</span>
    </div>
    <div class="timer-box">
      <div class="timer-num">{{ seconds() }}</div>
      <span class="timer-label">{{ lang.text('ثانية', 'Secs') }}</span>
    </div>
  </div>

  <div>
    <a class="btn-countdown-cta" [routerLink]="s.link || '/menu'">
      <span>{{ buttonText() }}</span>
      <i class="bi bi-arrow-left"></i>
    </a>
  </div>
</section>
`
})
export class SectionCountdownComponent implements OnInit, OnDestroy {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);

  days = signal('00');
  hours = signal('00');
  minutes = signal('00');
  seconds = signal('00');
  private timerId: any;

  title() { return this.lang.text(this.s.title || 'عرض خاص لفترة محدودة', this.s.titleEn || 'Limited Time Offer'); }
  subtitle() { return this.lang.text(this.s.subtitle || 'سارع بالاستفادة من الخصومات قبل انتهاء الوقت', this.s.subtitleEn || 'Grab exclusive deals before time runs out'); }
  eyebrow() { return this.lang.text(this.s.eyebrow || 'عرض فلاش', this.s.eyebrowEn || 'FLASH SALE'); }
  buttonText() { return this.lang.text(this.s.buttonText || 'تسوق العرض الآن', this.s.buttonTextEn || 'Shop the Deal'); }
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

  ngOnInit() {
    this.updateTime();
    this.timerId = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  }

  private updateTime() {
    // Default to 48 hours from today or s.countdownTarget
    const target = this.s.countdownTarget ? new Date(this.s.countdownTarget).getTime() : (Date.now() + 48 * 3600 * 1000);
    const diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    this.days.set(String(d).padStart(2, '0'));
    this.hours.set(String(h).padStart(2, '0'));
    this.minutes.set(String(m).padStart(2, '0'));
    this.seconds.set(String(s).padStart(2, '0'));
  }
}
