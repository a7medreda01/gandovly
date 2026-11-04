import { Component, HostListener, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartService } from '../../../core/services/cart.service';
import { SettingsService } from '../../../core/services/settings.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-mobile-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (!isCheckoutPage()) {
      <nav
        class="ios-dock-nav d-md-none"
        [class.dock-shrunk]="isScrollingDown"
        aria-label="شريط التنقل السفلي"
      >
        <div class="dock-glass-capsule">
          <!-- Home -->
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="dock-tab">
            <div class="tab-icon">
              <i class="bi bi-house-door-fill"></i>
            </div>
            <span class="tab-label">الرئيسية</span>
          </a>

          <!-- Products / Categories -->
          <a routerLink="/menu" routerLinkActive="active" class="dock-tab">
            <div class="tab-icon">
              <i class="bi bi-grid-fill"></i>
            </div>
            <span class="tab-label">{{ settingsService.settings().labelProducts || 'المنتجات' }}</span>
          </a>

          <!-- Cart (Center Highlight) -->
          <button 
            type="button" 
            class="dock-tab cart-tab" 
            [class.has-items]="cartService.totalItemsCount() > 0"
            [class.cart-bump]="cartService.cartBumped()"
            (click)="cartService.toggleDrawer()" 
            title="سلة الطلبات"
          >
            <div class="tab-icon cart-icon-box">
              <i class="bi bi-bag-check-fill"></i>
              @if (cartService.totalItemsCount() > 0) {
                <span class="cart-bubble">{{ cartService.totalItemsCount() }}</span>
              }
            </div>
            <span class="tab-label">{{ settingsService.settings().labelCart || 'السلة' }}</span>
          </button>

          <!-- Account & Orders -->
          <a routerLink="/account" routerLinkActive="active" class="dock-tab">
            <div class="tab-icon">
              <i class="bi bi-person-circle"></i>
            </div>
            <span class="tab-label">{{ settingsService.settings().labelOrders || 'طلباتي' }}</span>
          </a>
        </div>
      </nav>
    }
  `,
  styles: [`
    .ios-dock-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1040;
      padding: 4px 10px 8px;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      &.dock-shrunk {
        padding: 2px 14px 4px;
        transform: translateY(4px) scale(0.96);
        opacity: 0.92;

        .dock-glass-capsule {
          padding: 2px 4px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.75);
        }

        .tab-label {
          display: none;
        }

        .tab-icon {
          font-size: 1rem;
          margin-bottom: 0;
        }
      }
    }

    .dock-glass-capsule {
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(24px) saturate(200%);
      -webkit-backdrop-filter: blur(24px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 6px 24px rgba(10, 25, 41, 0.1), 0 1px 4px rgba(0, 0, 0, 0.04);
      border-radius: 26px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 4px 6px;
      max-width: 320px;
      margin: 0 auto;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .dock-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #64748b;
      background: transparent;
      border: none;
      padding: 2px 4px;
      border-radius: 14px;
      transition: all 0.2s ease;
      cursor: pointer;
      flex: 1;
      position: relative;

      .tab-icon {
        font-size: 1.05rem;
        line-height: 1;
        margin-bottom: 1px;
        transition: transform 0.2s ease, color 0.2s ease;
      }

      .tab-label {
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: -0.2px;
        line-height: 1.2;
        transition: color 0.2s ease;
      }

      &:active {
        transform: scale(0.9);
      }

      &.active {
        color: var(--primary-color, #00875a);

        .tab-icon {
          transform: translateY(-1px) scale(1.06);
          color: var(--primary-color, #00875a);
        }

        .tab-label {
          color: var(--primary-color, #00875a);
          font-weight: 800;
        }
      }

      &.wishlist-tab {
        &.active, &:has(.bi-heart-fill) {
          color: #EF4444;
          .tab-icon { color: #EF4444; }
          .tab-label { color: #EF4444; font-weight: 800; }
        }
        .wishlist-bubble {
          background: #EF4444;
        }
      }
    }

    .cart-tab {
      .cart-icon-box {
        position: relative;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1px;
      }

      &.has-items {
        .cart-icon-box {
          background: var(--primary-color, #00875a);
          color: #ffffff;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
          transform: none;

          i {
            color: #ffffff !important;
            font-size: 0.92rem;
          }
        }

        .tab-label {
          color: var(--primary-color, #00875a);
          font-weight: 800;
          transform: none;
        }
      }

      &.cart-bump {
        .cart-icon-box {
          animation: cartWiggle 0.85s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .cart-bubble {
          animation: badgePop 0.85s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
      }

      .cart-bubble {
        position: absolute;
        top: -4px;
        right: -5px;
        background: #e63946;
        color: #ffffff;
        font-size: 0.62rem;
        font-weight: 900;
        min-width: 16px;
        height: 16px;
        line-height: 16px;
        border-radius: 8px;
        text-align: center;
        padding: 0 3px;
        box-shadow: 0 2px 6px rgba(230, 57, 70, 0.45);
        border: 1.5px solid #ffffff;
        animation: pulseBubble 2.2s infinite ease-in-out;
      }
    }

    @keyframes cartWiggle {
      0% { transform: scale(1); }
      20% { transform: scale(1.22) rotate(-6deg); }
      40% { transform: scale(1.15) rotate(5deg); }
      60% { transform: scale(1.08) rotate(-3deg); }
      80% { transform: scale(1.03) rotate(1deg); }
      100% { transform: scale(1) rotate(0); }
    }

    @keyframes badgePop {
      0% { transform: scale(0.4); }
      60% { transform: scale(1.4); }
      100% { transform: scale(1); }
    }

    @keyframes pulseBubble {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
  `]
})
export class MobileBottomNavComponent {
  private router = inject(Router);
  readonly cartService = inject(CartService);
  readonly settingsService = inject(SettingsService);
  readonly wishlistService = inject(WishlistService);
  private lastScrollY = 0;
  isScrollingDown = false;
  currentUrl = signal<string>(typeof window !== 'undefined' ? window.location.pathname : this.router.url);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
    });
  }

  isCheckoutPage = computed(() => {
    const url = this.currentUrl().toLowerCase();
    return url.includes('checkout');
  });

  @HostListener('window:scroll')
  onWindowScroll() {
    if (typeof window === 'undefined') return;
    const currentScrollY = window.scrollY;

    // Detect scroll down vs up with threshold
    if (currentScrollY > this.lastScrollY + 8 && currentScrollY > 60) {
      this.isScrollingDown = true;
    } else if (currentScrollY < this.lastScrollY - 8) {
      this.isScrollingDown = false;
    }

    this.lastScrollY = currentScrollY;
  }
}
