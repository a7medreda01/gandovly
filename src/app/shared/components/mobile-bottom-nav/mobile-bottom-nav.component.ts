import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { CartService } from '../../../core/services/cart.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-mobile-bottom-nav', standalone: true, imports: [RouterModule],
  template: `
    @if (!focusedPage()) {
      <nav class="store-bottom-nav" aria-label="التنقل في المتجر">
        <a routerLink="/" routerLinkActive="active" ariaCurrentWhenActive="page" [routerLinkActiveOptions]="{exact: true}"><i class="bi bi-house-door" aria-hidden="true"></i><span>الرئيسية</span></a>
        <a routerLink="/menu" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="bi bi-grid" aria-hidden="true"></i><span>{{ settings.settings().labelProducts || 'المنتجات' }}</span></a>
        <button type="button" (click)="cart.toggleDrawer()" [attr.aria-label]="'السلة، ' + cart.totalItemsCount() + ' منتج'"><span class="cart-icon"><i class="bi bi-bag" aria-hidden="true"></i>@if(cart.totalItemsCount() && settings.settings().showCartBadge !== false) { <b>{{cart.totalItemsCount()}}</b> }</span><span>{{ settings.settings().labelCart || 'السلة' }}</span></button>
        <a routerLink="/account" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="bi bi-person" aria-hidden="true"></i><span>{{ settings.settings().labelOrders || 'حسابي' }}</span></a>
      </nav>
    }
  `,
  styles: [`
    :host { display: none; }
    @media(max-width: 767px) {
      :host { display: block; }
      .store-bottom-nav { position: fixed; z-index: 1040; inset-inline: 12px; bottom: max(10px, env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); min-height: 58px; padding: 4px; border: 1px solid var(--border-color, #dfe5ec); border-radius: var(--radius-bottom-nav, 28px); background: var(--navbar-bg, #fff); color: var(--navbar-text, #586879); box-shadow: var(--shadow-card); }
      a, button { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px; min-height: 48px; min-width: 0; padding: 4px 2px; border: 0; background: none; border-radius: var(--radius-control, 12px); color: inherit; text-decoration: none; font-size: .8rem; font-weight: 600; line-height: 1.3; }
      a.active { background: color-mix(in srgb,var(--primary-color,#124b89) 12%,var(--navbar-bg,#fff)); color: var(--primary-color,#124b89); }
      i { font-size: 21px; line-height: 1; }
      .cart-icon { position: relative; }
      b { position: absolute; top: -8px; inset-inline-end: -13px; min-width: 18px; height: 18px; padding-inline: 4px; border-radius: 10px; background: #b91c32; color: #fff; font-size: 10px; line-height: 18px; border: 1px solid #fff; }
    }
  `]
})
export class MobileBottomNavComponent {
  readonly cart = inject(CartService);
  readonly settings = inject(SettingsService);
  private readonly router = inject(Router);
  readonly currentUrl = signal(this.router.url);
  readonly focusedPage = computed(() => /^\/product(\/|\?|$)/.test(this.currentUrl()));
  constructor() {
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd), takeUntilDestroyed()).subscribe(event => this.currentUrl.set(event.urlAfterRedirects));
  }
}
