import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models/models';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, ImageUrlPipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() selectProduct = new EventEmitter<Product>();

  imgError = false;
  isHovered = false;
  isFavorite = false;

  get isWeightBased(): boolean {
    if (!this.product) return false;
    if (this.product.pricingType === 'FixedPerUnit' || (this.product.pricingType as any) === 0) {
      return false;
    }
    return (
      this.product.pricingType === 'ByWeight' ||
      (this.product.pricingType as any) === 1 ||
      (this.product.pricingType as any) === 'WeightedByKilo'
    );
  }

  get displayPrice(): number {
    if (!this.product) return 0;
    if (this.isWeightBased && this.product.pricePerKg != null && this.product.pricePerKg > 0) {
      return this.product.pricePerKg;
    }
    return this.product.pricePerUnit || 0;
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

  onSelect() {
    this.selectProduct.emit(this.product);
  }
}
