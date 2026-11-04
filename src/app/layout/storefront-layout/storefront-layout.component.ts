import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CartDrawerComponent } from '../../shared/components/cart-drawer/cart-drawer.component';
import { MobileBottomNavComponent } from '../../shared/components/mobile-bottom-nav/mobile-bottom-nav.component';
import { WhatsAppFabComponent } from '../../shared/components/whatsapp-fab/whatsapp-fab.component';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, HeaderComponent, FooterComponent, CartDrawerComponent, MobileBottomNavComponent, WhatsAppFabComponent],
  template: `
    <div class="storefront-wrapper" [style.background]="settingsService.settings().footerBgColor || 'var(--footer-bg, #081827)'">
      <!-- Mecart Platform Ambient Banner -->
      <aside class="mecart-platform-top-strip">
        <div class="strip-content">
          <div class="strip-brand">
            <span class="live-pulse"></span>
            <span>متجر تجريبي حي يعمل عبر منصة <strong>MeCart.app</strong> &bull; إحدى مشاريع <strong>RunX Tech</strong></span>
          </div>
          <div class="strip-links">
            <a routerLink="/" class="strip-btn back-btn"><i class="bi bi-arrow-right"></i> بوابة المنصة الرئيسية</a>
            <a routerLink="/admin/stores" class="strip-btn create-btn"><i class="bi bi-plus-circle"></i> أنشئ متجرك</a>
          </div>
        </div>
      </aside>

      <app-header></app-header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <app-cart-drawer></app-cart-drawer>
      <app-whatsapp-fab></app-whatsapp-fab>
      <app-mobile-bottom-nav></app-mobile-bottom-nav>
    </div>
  `,
  styles: [`
    .storefront-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      background: var(--footer-bg, #081827);
    }
    .mecart-platform-top-strip {
      background: #090d16;
      border-bottom: 1px solid rgba(16, 185, 129, 0.25);
      color: #94a3b8;
      font-size: 0.8rem;
      padding: 0.35rem 1rem;
      direction: rtl;
      text-align: right;

      .strip-content {
        max-width: 1240px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .strip-brand {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #cbd5e1;

        strong {
          color: #34d399;
        }

        .live-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }
      }

      .strip-links {
        display: flex;
        align-items: center;
        gap: 0.6rem;

        .strip-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.65rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.76rem;
          transition: all 0.2s ease;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;

          &:hover {
            background: rgba(255, 255, 255, 0.16);
            color: #fff;
          }
        }

        .create-btn {
          background: #10b981;
          color: #fff;

          &:hover {
            background: #059669;
          }
        }
      }
    }
    .main-content {
      flex: 1 0 auto;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
      background: var(--surface-color, #ffffff);
    }
  `]
})
export class StorefrontLayoutComponent {
  readonly settingsService = inject(SettingsService);
}
