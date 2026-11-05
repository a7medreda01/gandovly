import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
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
      <a class="store-skip-link" [href]="skipLinkHref">تخطي إلى المحتوى</a>
      <app-header></app-header>
      <main class="main-content" id="store-main" tabindex="-1">
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
      overflow-x: clip;
      background: var(--footer-bg, #081827);
    }
    .main-content {
      flex: 1 0 auto;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      overflow-x: clip;
      background: var(--surface-color, #ffffff);
    }
  `]
})
export class StorefrontLayoutComponent {
  readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  get skipLinkHref() { return this.router.url.split('#')[0] + '#store-main'; }
}
