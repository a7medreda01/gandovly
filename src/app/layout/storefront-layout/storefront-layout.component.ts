import { MarketingPixelsService } from '../../core/services/marketing-pixels.service';
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
      @if(pixels.configured()){@if(pixels.consent()===null){<aside class="marketing-consent" aria-label="تفضيلات التتبع"><p>نستخدم أدوات قياس من منصات التواصل لتحسين الإعلانات وقياس الزيارات والطلبات. هل توافق على تشغيلها؟</p><button type="button" (click)="pixels.choose('accepted')">أوافق</button><button type="button" (click)="pixels.choose('rejected')">لا أوافق</button></aside>}@else{<button type="button" class="marketing-preferences" (click)="pixels.preferences()">تفضيلات التتبع</button>}}
    </div>
  `,
  styles: [`
    .marketing-consent{position:fixed;z-index:1200;bottom:90px;inset-inline:16px;max-width:560px;margin:auto;padding:18px;background:var(--card-bg,#fff);color:var(--text-main,#123);border:1px solid var(--border-color,#ddd);border-radius:16px;box-shadow:0 8px 40px #1233}.marketing-consent p{line-height:1.8;font-size:14px}.marketing-consent button{min-height:44px;padding:8px 20px;margin:4px;border:1px solid var(--primary-color);border-radius:10px;background:transparent;color:inherit;font:inherit}.marketing-preferences{position:fixed;bottom:10px;inset-inline-start:10px;z-index:990;font:inherit;font-size:11px;border:1px solid rgba(255,255,255,0.18);border-radius:6px;background:rgba(0,0,0,0.55);color:#fff;padding:2px 8px;opacity:0.55;transition:opacity .2s;text-decoration:none}.marketing-preferences:hover{opacity:1}
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
  readonly pixels=inject(MarketingPixelsService);
  readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  get skipLinkHref() { return this.router.url.split('#')[0] + '#store-main'; }
}
