import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-mobile-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
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

        <!-- Menu / Categories -->
        <a routerLink="/menu" routerLinkActive="active" class="dock-tab">
          <div class="tab-icon">
            <i class="bi bi-grid-fill"></i>
          </div>
          <span class="tab-label">المنيو</span>
        </a>

        <!-- Cart (Center Highlight) -->
        <button type="button" class="dock-tab cart-tab" (click)="cartService.toggleDrawer()" title="سلة الطلبات">
          <div class="tab-icon cart-icon-box">
            <i class="bi bi-bag-check-fill"></i>
            @if (cartService.totalItemsCount() > 0) {
              <span class="cart-bubble">{{ cartService.totalItemsCount() }}</span>
            }
          </div>
          <span class="tab-label">السلة</span>
        </button>

        <!-- Account & Orders -->
        <a routerLink="/account" routerLinkActive="active" class="dock-tab">
          <div class="tab-icon">
            <i class="bi bi-person-circle"></i>
          </div>
          <span class="tab-label">طلباتي</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .ios-dock-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1040;
      padding: 6px 12px 10px;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      &.dock-shrunk {
        padding: 4px 16px 6px;
        transform: translateY(4px) scale(0.95);
        opacity: 0.92;

        .dock-glass-capsule {
          padding: 3px 6px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.72);
        }

        .tab-label {
          display: none;
        }

        .tab-icon {
          font-size: 1.15rem;
          margin-bottom: 0;
        }
      }
    }

    .dock-glass-capsule {
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(28px) saturate(210%);
      -webkit-backdrop-filter: blur(28px) saturate(210%);
      border: 1px solid rgba(255, 255, 255, 0.85);
      box-shadow: 0 8px 32px rgba(10, 25, 41, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
      border-radius: 30px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 6px 8px;
      max-width: 400px;
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
      padding: 4px 8px;
      border-radius: 18px;
      transition: all 0.2s ease;
      cursor: pointer;
      flex: 1;
      position: relative;

      .tab-icon {
        font-size: 1.18rem;
        line-height: 1;
        margin-bottom: 2px;
        transition: transform 0.2s ease, color 0.2s ease;
      }

      .tab-label {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: -0.2px;
        transition: color 0.2s ease;
      }

      &:active {
        transform: scale(0.9);
      }

      &.active {
        color: #00875a;

        .tab-icon {
          transform: translateY(-1px) scale(1.08);
          color: #00875a;
        }

        .tab-label {
          color: #00875a;
          font-weight: 800;
        }
      }
    }

    .cart-tab {
      .cart-icon-box {
        position: relative;
      }

      .cart-bubble {
        position: absolute;
        top: -6px;
        right: -9px;
        background: #e63946;
        color: #ffffff;
        font-size: 0.62rem;
        font-weight: 800;
        min-width: 16px;
        height: 16px;
        line-height: 16px;
        border-radius: 50%;
        text-align: center;
        padding: 0 3px;
        box-shadow: 0 2px 6px rgba(230, 57, 70, 0.4);
        border: 1.5px solid #ffffff;
        animation: pulseBubble 2s infinite;
      }
    }

    @keyframes pulseBubble {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
  `]
})
export class MobileBottomNavComponent {
  private lastScrollY = 0;
  isScrollingDown = false;

  constructor(public cartService: CartService) {}

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
