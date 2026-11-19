import { Component, inject, signal, HostListener, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-whatsapp-fab',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (settings().showPhoneFab && callPhone) {
      <a [href]="'tel:' + callPhone" class="whatsapp-fab phone-fab"
        [class.above-whatsapp]="isWhatsappVisible"
        [class.is-visible]="isFabScrolled()"
        [class.no-bottom-nav]="isBottomNavDisabled"
        [class.pos-left]="settings().fabPosition === 'bottom-left'"
        [class.pos-right]="settings().fabPosition !== 'bottom-left'"
        title="اتصل بالمتجر" aria-label="اتصل بالمتجر"><i class="bi bi-telephone-fill"></i></a>
    }
    @if (isWhatsappVisible) {
      <a
        [href]="whatsappUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="whatsapp-fab flex-center"
        [class.is-visible]="isFabScrolled()"
        [class.no-bottom-nav]="isBottomNavDisabled"
        [class.pos-left]="settings().fabPosition === 'bottom-left'"
        [class.pos-right]="settings().fabPosition !== 'bottom-left'"
        title="تواصل معنا عبر واتساب"
        aria-label="تواصل معنا عبر واتساب"
      >
        <i class="bi bi-whatsapp"></i>
        <span class="fab-pulse"></span>
      </a>
    }
  `,
  styles: [`
    .whatsapp-fab {
      position: fixed;
      bottom: calc(96px + env(safe-area-inset-bottom));
      z-index: 1045;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #25D366;
      color: #fff;
      box-shadow: 0 8px 24px rgba(37, 211, 102, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      text-decoration: none;
      opacity: 0;
      pointer-events: none;
      transform: translateY(24px) scale(0.85);
      transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 0.25s ease,
                  bottom 0.25s ease;
      cursor: pointer;

      &.is-visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0) scale(1);
      }

      &.no-bottom-nav {
        bottom: calc(24px + env(safe-area-inset-bottom));
      }

      &.pos-right {
        right: 18px;
      }

      &.pos-left {
        left: 18px;
      }

      &:hover {
        transform: translateY(-3px) scale(1.08);
        box-shadow: 0 12px 28px rgba(37, 211, 102, 0.55);
        color: #fff;
      }

      &:active {
        transform: scale(0.95);
      }

      .fab-pulse {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: inherit;
        opacity: 0.6;
        animation: pulse-ring 2s infinite ease-out;
        z-index: -1;
      }
    }

    .phone-fab {
      background: var(--primary-color, #0a3d62);
      box-shadow: 0 8px 24px rgba(10, 61, 98, 0.4);

      &.above-whatsapp {
        bottom: calc(158px + env(safe-area-inset-bottom));

        &.no-bottom-nav {
          bottom: calc(86px + env(safe-area-inset-bottom));
        }
      }
    }

    @media (min-width: 992px) {
      .whatsapp-fab {
        bottom: 30px;
        width: 58px;
        height: 58px;
        font-size: 1.95rem;

        &.no-bottom-nav {
          bottom: 30px;
        }
      }

      .phone-fab.above-whatsapp {
        bottom: 100px;

        &.no-bottom-nav {
          bottom: 100px;
        }
      }
    }

    @keyframes pulse-ring {
      0% {
        transform: scale(0.95);
        opacity: 0.7;
      }
      70% {
        transform: scale(1.4);
        opacity: 0;
      }
      100% {
        transform: scale(1.4);
        opacity: 0;
      }
    }
  `]
})
export class WhatsAppFabComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  settings = this.settingsService.settings;
  readonly isFabScrolled = signal(false);

  ngOnInit() {
    this.checkScroll();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.checkScroll();
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.checkScroll();
  }

  private checkScroll() {
    if (!isPlatformBrowser(this.platformId)) return;
    const url = this.router.url.split('?')[0];
    const isHome = url === '/' || url === '';

    if (isHome) {
      // Appear after scrolling past first screen height (hero banner)
      const threshold = Math.max(window.innerHeight * 0.75, 400);
      this.isFabScrolled.set(window.scrollY >= threshold);
    } else {
      // On internal pages, appear smoothly after modest scroll (120px)
      this.isFabScrolled.set(window.scrollY > 120);
    }
  }

  get isBottomNavDisabled(): boolean {
    const s = this.settings();
    return s.showMobileBottomNav === false || s.storeLayout?.showMobileBottomNav === false;
  }

  get whatsappUrl(): string {
    const phone = this.targetPhone;
    if (!phone) return '#';
    const layout = this.settings().storeLayout;
    const msg = this.languageService.currentLang() === 'en' && layout?.whatsappDefaultMessageEn
      ? layout?.whatsappDefaultMessageEn
      : (layout?.whatsappDefaultMessage || '');
    return msg
      ? 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg)
      : 'https://wa.me/' + phone;
  }

  get callPhone(): string {
    const raw = (this.settings().phone || '').trim();
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (raw.startsWith('+')) return '+' + digits;
    if (digits.startsWith('00')) return '+' + digits.slice(2);
    const country = (this.settings().phoneCountryCode || '').replace(/[^0-9]/g, '');
    return digits.startsWith('0') && country ? '+' + country + digits.replace(/^0+/, '') : digits;
  }

  get targetPhone(): string {
    const raw = (this.settings().whatsapp || this.settings().phone || '').trim();
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.startsWith('01') && digits.length === 11) {
      return '2' + digits;
    }
    return digits;
  }

  get isWhatsappVisible(): boolean {
    const s = this.settings();
    const enabled = s.showWhatsAppFab !== false;
    return enabled && !!this.targetPhone;
  }
}

