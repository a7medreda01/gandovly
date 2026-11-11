import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { SettingsService } from '../../../core/services/settings.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-mobile-bottom-nav', standalone: true, imports: [RouterModule],
  template: `

      <nav class="store-bottom-nav" [class.compact]="compact()" [style.grid-template-columns]="settings.settings().storeLayout?.onlineOrdering === false ? 'repeat(3,minmax(0,1fr))' : null" [attr.aria-label]="language.text('التنقل في المتجر', 'Store Navigation')">
        <a routerLink="/" routerLinkActive="active" ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{exact: true}"><i class="bi bi-house-door" aria-hidden="true"></i><span>{{ language.text('الرئيسية', 'Home') }}</span></a>
        <a routerLink="/menu" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="bi bi-grid" aria-hidden="true"></i><span>{{ language.text(settings.settings().labelProducts || 'المنتجات', 'Products') }}</span></a>
        @if(settings.settings().storeLayout?.onlineOrdering !== false){<button type="button" (click)="cart.toggleDrawer()" [attr.aria-label]="language.text('السلة، ' + cart.totalItemsCount() + ' منتج', 'Cart, ' + cart.totalItemsCount() + ' items')"><span class="cart-icon"><i class="bi bi-bag" aria-hidden="true"></i>@if(cart.totalItemsCount() && settings.settings().showCartBadge !== false) { <b>{{cart.totalItemsCount()}}</b> }</span><span>{{ language.text(settings.settings().labelCart || 'السلة', 'Cart') }}</span></button>}
        <a routerLink="/account" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="bi bi-person" aria-hidden="true"></i><span>{{ language.text(settings.settings().labelOrders || 'حسابي', 'Account') }}</span></a>
      </nav>
  `,
  styles: [`
    :host { display: none; }
    @media(max-width: 767px) {
      :host { display: block; }
      .store-bottom-nav { position: fixed; z-index: 1040; inset-inline: 12px; bottom: max(10px, env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); min-height: 54px; padding: 4px; border: 1px solid var(--border-color, #dfe5ec); border-radius: var(--radius-bottom-nav, 28px); background: color-mix(in srgb, var(--navbar-bg, #fff) 94%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); color: var(--navbar-text, #586879); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); }
      a, button { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px; min-height: 46px; min-width: 0; padding: 4px 2px; border: 0; background: none; border-radius: calc(var(--radius-bottom-nav, 28px) - 4px); color: inherit; text-decoration: none; font-size: .75rem; font-weight: 600; line-height: 1.3; transition: all 0.2s ease; }
      .store-bottom-nav { transition: padding .18s ease, min-height .18s ease; }
      .store-bottom-nav.compact { min-height: 48px; padding: 2px 4px; }
      .store-bottom-nav.compact a, .store-bottom-nav.compact button { min-height: 44px; gap: 2px; }
      .store-bottom-nav.compact i { font-size: 17px; }
      @media(prefers-reduced-motion:reduce) { .store-bottom-nav { transition: none; } }
      a.active { background: color-mix(in srgb,var(--primary-color,#684c3a) 14%,var(--navbar-bg,#fff)); color: var(--primary-color,#684c3a); font-weight: 700; }
      i { font-size: 19px; line-height: 1; }
      .cart-icon { position: relative; }
      b { position: absolute; top: -8px; inset-inline-end: -13px; min-width: 18px; height: 18px; padding-inline: 4px; border-radius: 10px; background: #b91c32; color: #fff; font-size: 10px; line-height: 18px; border: 1px solid #fff; }
    }
  `]
})
export class MobileBottomNavComponent {
  readonly compact = signal(false);
  private lastScrollY = 0;
  @HostListener('window:scroll') onScroll() {
    const y = window.scrollY;
    if (y < 32) this.compact.set(false);
    else if (y > this.lastScrollY + 4) this.compact.set(true);
    else if (y < this.lastScrollY - 4) this.compact.set(false);
    this.lastScrollY = y;
  }
  readonly cart = inject(CartService);
  readonly settings = inject(SettingsService);
  readonly language = inject(LanguageService);
}
