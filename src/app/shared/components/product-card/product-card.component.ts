import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../../core/models/models';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { SettingsService } from '../../../core/services/settings.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, ImageUrlPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  readonly languageService = inject(LanguageService);

  @Input({ required: true }) product!: Product;
  @Output() selectProduct = new EventEmitter<Product>();

  imgError = false;
  isHovered = false;
  isFavorite = false;

  get currencySymbol(): string {
    return this.settingsService.settings()?.currencySymbol || 'ج.م';
  }

  get isWeightBased(): boolean {
    if (!this.product) return false;
    return this.product.pricingType === 'ByWeight' || (this.product.pricingType as any) === 1 || (this.product.pricingType as any) === 'WeightedByKilo';
  }

  get displayPrice(): number {
    if (!this.product) return 0;
    if (this.isWeightBased && this.product.pricePerKg != null && this.product.pricePerKg > 0) {
      return this.product.pricePerKg;
    }
    return this.product.pricePerUnit || 0;
  }

  get hasDiscount(): boolean {
    return !!(this.product?.originalPrice && this.product.originalPrice > this.displayPrice);
  }

  get discountPercent(): number {
    if (!this.hasDiscount || !this.product.originalPrice) return 0;
    return Math.round(((this.product.originalPrice - this.displayPrice) / this.product.originalPrice) * 100);
  }

  get secondaryImage(): string | undefined {
    if (this.product?.images && this.product.images.length > 1) {
      const nonPrimary = this.product.images.find(img => !img.isPrimary);
      if (nonPrimary?.imageUrl) return nonPrimary.imageUrl;
      return this.product.images[1]?.imageUrl;
    }
    if (!this.product?.secondaryImageUrl) return undefined;
    const first = this.product.secondaryImageUrl.split(';')[0]?.trim();
    return first || undefined;
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    this.isFavorite = !this.isFavorite;
  }

  onImageError(event: Event) {
    const image = event.target as HTMLImageElement;
    if (!image.src.endsWith('/assets/images/branding/product-placeholder.svg')) image.src = '/assets/images/branding/product-placeholder.svg';
  }

  onSelect() {
    if (this.settingsService.settings()?.productDetailViewMode === 'page') {
      this.router.navigate(['/product', this.product.id]);
    } else {
      this.selectProduct.emit(this.product);
    }
  }
}
