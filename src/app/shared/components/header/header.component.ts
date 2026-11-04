import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { WishlistService } from '../../../core/services/wishlist.service';

import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ImageUrlPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  readonly settingsService = inject(SettingsService);
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  readonly languageService = inject(LanguageService);
  readonly wishlistService = inject(WishlistService);

  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  get isKitchenAllowed(): boolean {
    const role = this.authService.currentAdmin()?.role;
    return role === 'SuperAdmin' || role === 'Manager' || role === 'KitchenStaff';
  }

  get isAdminAllowed(): boolean {
    const role = this.authService.currentAdmin()?.role;
    return role === 'SuperAdmin' || role === 'Manager';
  }
}
