import { CartItem } from '../../../core/models/models';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { SettingsService } from '../../../core/services/settings.service';
import { LanguageService } from '../../../core/services/language.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { StoreDialogDirective } from '../../directives/store-dialog.directive';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, ImageUrlPipe, StoreDialogDirective],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss'
})
export class CartDrawerComponent {
  readonly cartService = inject(CartService);
  readonly settingsService = inject(SettingsService);
  readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);

  displayName(item: CartItem): string {
    const name = this.languageService.getLocalizedName(item.product);
    const suffix = item.selectedVariant ? ' — ' + item.selectedVariant.color + ' / ' + item.selectedVariant.size : '';
    return suffix && name.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
  }

  formatWeight(grams?: number | null): string {
    if (!grams || grams <= 0) return this.languageService.text('0 جم', '0 g');
    if (grams >= 1000) {
      const kg = grams / 1000;
      const unit = this.languageService.text('كجم', 'kg');
      return Number.isInteger(kg) ? `${kg} ${unit}` : `${kg.toFixed(1)} ${unit}`;
    }
    return `${grams} ${this.languageService.text('جم', 'g')}`;
  }

  // ===== SMOOTH iOS FINGER DRAG GESTURE =====
  touchStartX = 0;
  touchCurrentX = 0;
  touchStartY = 0;
  touchCurrentY = 0;
  private touchStartTime = 0;
  private bodyDragCandidate = false;
  isDragging = false;
  dragTranslateY = 0;
  isClosing = false;

  get backdropOpacity(): number {
    if (this.isClosing) return 0;
    if (this.dragTranslateY > 0) {
      return Math.max(0.12, 1 - (this.dragTranslateY / 340));
    }
    return 1;
  }

  get drawerTransform(): string | null {
    if (this.isClosing) return null;
    if (this.dragTranslateY !== 0) {
      return `translate3d(0, ${this.dragTranslateY}px, 0)`;
    }
    return null;
  }

  get drawerTransition(): string {
    if (this.isDragging) return 'none';
    if (this.isClosing) return 'transform 0.18s cubic-bezier(0.32, 0.72, 0, 1)';
    return 'transform 0.24s cubic-bezier(0.22, 1.08, 0.36, 1)';
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  onTouchStart(event: TouchEvent) {
    if (!this.isMobileViewport() || event.touches.length !== 1) return;
    if ((event.target as HTMLElement)?.closest('button, a, input, select, textarea')) return;
    this.touchStartX = event.touches[0].clientX;
    this.touchCurrentX = this.touchStartX;
    this.touchStartY = event.touches[0].clientY;
    this.touchCurrentY = this.touchStartY;
    this.touchStartTime = performance.now();
    this.isDragging = true;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.touchCurrentX = event.touches[0].clientX;
    this.touchCurrentY = event.touches[0].clientY;
    const deltaY = this.touchCurrentY - this.touchStartY;

    if (deltaY > 0) {
      this.dragTranslateY = deltaY;
      if (event.cancelable && deltaY > 4) event.preventDefault();
    } else {
      this.dragTranslateY = Math.max(-22, deltaY * 0.22);
      if (event.cancelable && deltaY < -4) event.preventDefault();
    }
  }

  onBodyTouchStart(event: TouchEvent, scrollEl: HTMLElement) {
    if (!this.isMobileViewport() || event.touches.length !== 1) return;
    this.bodyDragCandidate = scrollEl.scrollTop <= 1;
    if (this.bodyDragCandidate) {
      this.touchStartX = event.touches[0].clientX;
      this.touchCurrentX = this.touchStartX;
      this.touchStartY = event.touches[0].clientY;
      this.touchCurrentY = this.touchStartY;
      this.touchStartTime = performance.now();
    }
  }

  onBodyTouchMove(event: TouchEvent, scrollEl: HTMLElement) {
    if (!this.bodyDragCandidate || event.touches.length !== 1) return;
    if (!this.isDragging && scrollEl.scrollTop > 1) {
      this.bodyDragCandidate = false;
      return;
    }
    this.touchCurrentX = event.touches[0].clientX;
    this.touchCurrentY = event.touches[0].clientY;
    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;

    if (!this.isDragging) {
      if (deltaY > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
        this.isDragging = true;
        this.touchStartY = this.touchCurrentY - 8;
      } else if (deltaY < -6) {
        this.bodyDragCandidate = false;
        return;
      } else {
        return;
      }
    }

    const activeDeltaY = this.touchCurrentY - this.touchStartY;
    if (activeDeltaY > 0) {
      this.dragTranslateY = activeDeltaY;
      if (event.cancelable) event.preventDefault();
    } else {
      this.dragTranslateY = Math.max(-18, activeDeltaY * 0.2);
    }
  }

  onTouchEnd() {
    this.bodyDragCandidate = false;
    if (!this.isDragging) return;
    this.isDragging = false;
    const deltaTime = performance.now() - this.touchStartTime;
    const velocityY = this.dragTranslateY / Math.max(1, deltaTime);

    if (this.dragTranslateY > 80 || (this.dragTranslateY > 32 && velocityY > 0.35)) {
      this.dismissDrawer();
    } else {
      this.dragTranslateY = 0;
    }
  }

  dismissDrawer() {
    if (this.isClosing) return;
    if (!this.isMobileViewport()) {
      this.dragTranslateY = 0;
      this.cartService.closeDrawer();
      return;
    }
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.dragTranslateY = 0;
      this.cartService.closeDrawer();
    }, 160);
  }

  goToMenu() {
    this.isClosing = false;
    this.dragTranslateY = 0;
    this.cartService.closeDrawer();
    this.router.navigate(['/menu']);
  }

  onCheckout() {
    this.isClosing = false;
    this.dragTranslateY = 0;
    this.cartService.closeDrawer();
    this.router.navigate(['/checkout']);
  }
}
