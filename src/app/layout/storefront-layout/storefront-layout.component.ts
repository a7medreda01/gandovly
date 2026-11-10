import { MarketingPixelsService } from '../../core/services/marketing-pixels.service';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CartDrawerComponent } from '../../shared/components/cart-drawer/cart-drawer.component';
import { MobileNavDrawerComponent } from '../../shared/components/mobile-nav-drawer/mobile-nav-drawer.component';
import { MobileBottomNavComponent } from '../../shared/components/mobile-bottom-nav/mobile-bottom-nav.component';
import { WhatsAppFabComponent } from '../../shared/components/whatsapp-fab/whatsapp-fab.component';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, HeaderComponent, FooterComponent, CartDrawerComponent, MobileNavDrawerComponent, MobileBottomNavComponent, WhatsAppFabComponent],
  template: `
    @if (settingsService.isStoreUnavailable()) {
      <div class="store-unavailable-container" dir="rtl">
        <div class="store-unavailable-card">
          <div class="status-icon-wrap" [class.suspended]="settingsService.storeUnavailableReason() === 'suspended'">
            @if (settingsService.storeUnavailableReason() === 'suspended') {
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="10" y1="15" x2="10" y2="9"></line>
                <line x1="14" y1="15" x2="14" y2="9"></line>
              </svg>
            } @else {
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            }
          </div>

          <div class="badge-pill" [class.suspended]="settingsService.storeUnavailableReason() === 'suspended'">
            {{ settingsService.storeUnavailableReason() === 'suspended' ? 'متجر موقوف مؤقتاً' : 'متجر غير متوفر' }}
          </div>

          <h1 class="unavailable-title">
            {{ settingsService.storeUnavailableReason() === 'suspended' ? 'المتجر غير متاح حالياً' : 'تعذر العثور على هذا المتجر' }}
          </h1>

          @if (settingsService.storeUnavailableName()) {
            <p class="store-identity">متجر: <strong>{{ settingsService.storeUnavailableName() }}</strong></p>
          }

          <p class="unavailable-desc">
            {{ settingsService.storeUnavailableMessage() || 'هذا المتجر غير متاح للزيارة حالياً.' }}
          </p>

          <div class="unavailable-notice">
            @if (settingsService.storeUnavailableReason() === 'suspended') {
              <p>تم إيقاف هذا المتجر مؤقتاً من قِبل إدارة منصة مي كارت. إذا كنت صاحب هذا المتجر، يرجى تسجيل الدخول للوحة التحكم أو التواصل مع إدارة المنصة للمساعدة.</p>
            } @else {
              <p>عذراً، هذا المتجر غير موجود أو قد تم حذفه نهائياً أو تغيير رابطه. يرجى التأكد من صحة الرابط والانتقال لمنصة مي كارت.</p>
            }
          </div>

          <div class="actions-group">
            <a href="https://mecart.app" class="btn-main">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              الانتقال إلى منصة مي كارت
            </a>
            @if (settingsService.storeUnavailableReason() === 'suspended') {
              <a href="https://mecart.app/admin/login" class="btn-secondary">
                تسجيل دخول صاحب المتجر
              </a>
            }
          </div>

          <div class="support-footer">
            <span>تحتاج إلى مساعدة؟</span>
            <a href="https://wa.me/201148472670" target="_blank" rel="noopener">تواصل مع الدعم الفني عبر واتساب</a>
          </div>
        </div>
      </div>
    } @else {
      <div class="storefront-wrapper" [style.background]="settingsService.settings().footerBgColor || 'var(--footer-bg, #081827)'">
        <a class="store-skip-link" [href]="skipLinkHref">تخطي إلى المحتوى</a>
        <app-header></app-header>
        <main class="main-content" id="store-main" tabindex="-1">
          <router-outlet></router-outlet>
        </main>
        <app-footer></app-footer>
        <app-cart-drawer></app-cart-drawer>
        <app-mobile-nav-drawer></app-mobile-nav-drawer>
        <app-whatsapp-fab></app-whatsapp-fab>
        <app-mobile-bottom-nav></app-mobile-bottom-nav>
        @if(pixels.configured()){@if(pixels.consent()===null){<aside class="marketing-consent" aria-label="تفضيلات التتبع"><p>نستخدم أدوات قياس من منصات التواصل لتحسين الإعلانات وقياس الزيارات والطلبات. هل توافق على تشغيلها؟</p><button type="button" (click)="pixels.choose('accepted')">أوافق</button><button type="button" (click)="pixels.choose('rejected')">لا أوافق</button></aside>}@else{<button type="button" class="marketing-preferences" (click)="pixels.preferences()">تفضيلات التتبع</button>}}
      </div>
    }
  `,
  styles: [`
    .store-unavailable-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      min-height: 100dvh;
      padding: 24px 16px;
      background: #f8fafc;
      font-family: inherit;
      color: #1e293b;
    }
    .store-unavailable-card {
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 40px 32px;
      text-align: center;
      box-shadow: 0 20px 45px -15px rgba(15, 23, 42, 0.08);
    }
    .status-icon-wrap {
      width: 72px;
      height: 72px;
      margin: 0 auto 20px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fef2f2;
      color: #ef4444;
      border: 1px solid #fee2e2;
    }
    .status-icon-wrap.suspended {
      background: #fffbeb;
      color: #d97706;
      border-color: #fef3c7;
    }
    .badge-pill {
      display: inline-block;
      font-size: 13px;
      font-weight: 700;
      padding: 4px 14px;
      border-radius: 999px;
      background: #fee2e2;
      color: #b91c1c;
      margin-bottom: 14px;
    }
    .badge-pill.suspended {
      background: #fef3c7;
      color: #b45309;
    }
    .unavailable-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 10px;
      line-height: 1.3;
    }
    .store-identity {
      font-size: 15px;
      color: #475569;
      margin: 0 0 12px;
    }
    .unavailable-desc {
      font-size: 16px;
      font-weight: 600;
      color: #334155;
      margin: 0 0 16px;
      line-height: 1.6;
    }
    .unavailable-notice {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 18px;
      font-size: 14px;
      color: #64748b;
      line-height: 1.7;
      margin-bottom: 24px;
      text-align: right;
    }
    .unavailable-notice p {
      margin: 0;
    }
    .actions-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
    }
    .btn-main {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 48px;
      padding: 12px 24px;
      background: #0a3d62;
      color: #ffffff;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      text-decoration: none;
      transition: background 0.2s, transform 0.1s;
    }
    .btn-main:hover {
      background: #072a44;
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 46px;
      padding: 10px 20px;
      background: #f1f5f9;
      color: #1e293b;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    .support-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      color: #64748b;
      border-top: 1px solid #f1f5f9;
      padding-top: 16px;
    }
    .support-footer a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }
    .support-footer a:hover {
      text-decoration: underline;
    }
    @media (max-width: 480px) {
      .store-unavailable-card {
        padding: 28px 20px;
        border-radius: 20px;
      }
      .unavailable-title {
        font-size: 20px;
      }
    }
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
