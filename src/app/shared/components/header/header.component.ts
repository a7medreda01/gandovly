import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

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

  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
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
