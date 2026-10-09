import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, ImageUrlPipe],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss'
})
export class CartDrawerComponent {
  readonly cartService = inject(CartService);
  readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);

  formatWeight(grams?: number | null): string {
    if (!grams || grams <= 0) return '0 جم';
    if (grams >= 1000) {
      const kg = grams / 1000;
      return Number.isInteger(kg) ? `${kg} كجم` : `${kg.toFixed(1)} كجم`;
    }
    return `${grams} جم`;
  }

  goToMenu() {
    this.cartService.closeDrawer();
    this.router.navigate(['/menu']);
  }

  onCheckout() {
    this.cartService.closeDrawer();
    this.router.navigate(['/checkout']);
  }
}
