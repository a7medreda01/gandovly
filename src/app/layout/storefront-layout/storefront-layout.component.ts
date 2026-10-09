import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { CartDrawerComponent } from '../../shared/components/cart-drawer/cart-drawer.component';
import { MobileBottomNavComponent } from '../../shared/components/mobile-bottom-nav/mobile-bottom-nav.component';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, CartDrawerComponent, MobileBottomNavComponent],
  template: `
    <div class="storefront-wrapper">
      <app-header></app-header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <app-cart-drawer></app-cart-drawer>
      <app-mobile-bottom-nav></app-mobile-bottom-nav>
    </div>
  `,
  styles: [`
    .storefront-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
    }
    .main-content {
      flex: 1 0 auto;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class StorefrontLayoutComponent {}
