import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-whatsapp-fab',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible) {
      <a
        [href]="'https://wa.me/' + targetPhone"
        target="_blank"
        rel="noopener noreferrer"
        class="whatsapp-fab flex-center"
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
      bottom: 96px;
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
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;

      &.pos-right {
        right: 18px;
      }

      &.pos-left {
        left: 18px;
      }

      &:hover {
        transform: scale(1.1) translateY(-2px);
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

    @media (min-width: 992px) {
      .whatsapp-fab {
        bottom: 30px;
        width: 58px;
        height: 58px;
        font-size: 1.95rem;
      }
    }
  `]
})
export class WhatsAppFabComponent {
  private settingsService = inject(SettingsService);
  settings = this.settingsService.settings;

  get targetPhone(): string {
    const raw = (this.settings().whatsapp || this.settings().phone || '').trim();
    const digits = raw.replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.startsWith('01') && digits.length === 11) {
      return '2' + digits;
    }
    return digits;
  }

  get isVisible(): boolean {
    const s = this.settings();
    const enabled = s.showWhatsAppFab !== false;
    return enabled && !!this.targetPhone;
  }
}

