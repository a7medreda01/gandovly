import { Component, inject, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ImageUrlPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly router = inject(Router);
  readonly settingsService = inject(SettingsService);
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  readonly languageService = inject(LanguageService);
  readonly wishlistService = inject(WishlistService);
  readonly mobileNavService = inject(MobileNavService);

  readonly isScrolled = signal(false);

  @HostListener('window:scroll')
  onWindowScroll() {
    if (typeof window !== 'undefined') {
      this.isScrolled.set(window.scrollY > 40);
    }
  }

  readonly isTransparentHeroHeader = computed(() => {
    const url = this.router.url.split('?')[0];
    const isHome = url === '/' || url === '';
    if (!isHome) return false;

    const cfg = this.settingsService.settings();
    if (cfg.storeLayout?.useCustomHome) {
      const activeSections = cfg.storeLayout.sections?.filter(s => s.enabled);
      if (activeSections && activeSections.length > 0) {
        return activeSections[0].kind === 'hero_slider' || activeSections[0].kind === 'hero';
      }
    }
    return cfg.showHeroBanner !== false;
  });

  get isMobileMenuOpen(): boolean {
    return this.mobileNavService.isOpen();
  }

  get whatsappUrl() {
    return 'https://wa.me/' + (this.settingsService.settings().whatsapp || '').replace(/\D/g, '');
  }

  toggleMobileMenu() {
    this.mobileNavService.toggle();
  }

  closeMobileMenu() {
    this.mobileNavService.close();
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
