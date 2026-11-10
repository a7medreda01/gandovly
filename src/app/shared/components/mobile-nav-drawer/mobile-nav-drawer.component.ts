import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MobileNavService } from '../../../core/services/mobile-nav.service';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { StoreDialogDirective } from '../../directives/store-dialog.directive';

@Component({
  selector: 'app-mobile-nav-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ImageUrlPipe, StoreDialogDirective],
  templateUrl: './mobile-nav-drawer.component.html',
  styleUrl: './mobile-nav-drawer.component.scss'
})
export class MobileNavDrawerComponent {
  readonly navService = inject(MobileNavService);
  readonly settingsService = inject(SettingsService);
  readonly authService = inject(AuthService);
  readonly languageService = inject(LanguageService);
  readonly wishlistService = inject(WishlistService);

  close() {
    this.navService.close();
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

