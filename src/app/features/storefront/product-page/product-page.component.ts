import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Product, PreparationOption, ModifierOption } from '../../../core/models/models';
import { CatalogService } from '../../../core/services/catalog.service';
import { CartService } from '../../../core/services/cart.service';
import { SettingsService } from '../../../core/services/settings.service';
import { LanguageService } from '../../../core/services/language.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductDetailModalComponent } from '../../../shared/components/product-detail-modal/product-detail-modal.component';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ImageUrlPipe, ProductCardComponent, ProductDetailModalComponent],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss'
})
export class ProductPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  readonly settingsService = inject(SettingsService);
  readonly languageService = inject(LanguageService);
  readonly wishlistService = inject(WishlistService);
  private readonly toast = inject(NotificationService);

  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  selectedRelatedProduct = signal<Product | null>(null);
  isLoading = signal<boolean>(true);
  isSuccess = signal<boolean>(false);
  isCopied = signal<boolean>(false);

  // Gallery
  activeImageIndex = 0;

  // Weighed items
  orderMode: 'pieces' | 'weight' = 'pieces';
  piecesCount: number = 1;
  customWeightGrams: number = 500;

  // Modifiers & Options
  selectedPrepOption: PreparationOption | null = null;
  selectedModifiersByGroup: { [groupId: number]: ModifierOption | null } = {};
  multiSelectedModifiers: ModifierOption[] = [];
  specialInstructions: string = '';

  // Swipe gesture state
  touchStartX = 0;
  touchCurrentX = 0;

  get currencySymbol(): string {
    return this.settingsService.settings()?.currencySymbol || 'ج.م';
  }

  get isWeighedProduct(): boolean {
    const p = this.product();
    if (!p) return false;
    return p.pricingType === 'ByWeight' || (p.pricingType as any) === 1 || (p.pricingType as any) === 'WeightedByKilo';
  }

  get galleryImages(): string[] {
    const p = this.product();
    if (!p) return [];
    const list: string[] = [];
    if (p.images && p.images.length > 0) {
      const sorted = [...p.images].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.displayOrder - b.displayOrder;
      });
      for (const img of sorted) {
        if (img.imageUrl && !list.includes(img.imageUrl)) {
          list.push(img.imageUrl);
        }
      }
    } else {
      if (p.imageUrl) list.push(p.imageUrl);
      if (p.secondaryImageUrl) {
        const parts = p.secondaryImageUrl.split(';').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          if (!list.includes(part)) list.push(part);
        }
      }
    }
    if (list.length === 0) list.push('/assets/images/products/platter-double.jpg');
    return list;
  }

  get currentImageUrl(): string {
    const imgs = this.galleryImages;
    return imgs[this.activeImageIndex] || imgs[0];
  }

  nextImage() {
    const total = this.galleryImages.length;
    if (total > 1) {
      this.activeImageIndex = (this.activeImageIndex + 1) % total;
    }
  }

  prevImage() {
    const total = this.galleryImages.length;
    if (total > 1) {
      this.activeImageIndex = (this.activeImageIndex - 1 + total) % total;
    }
  }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX;
      this.touchCurrentX = this.touchStartX;
    }
  }

  onTouchMove(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.touchCurrentX = e.touches[0].clientX;
    }
  }

  onTouchEnd() {
    const deltaX = this.touchCurrentX - this.touchStartX;
    if (Math.abs(deltaX) > 35 && this.galleryImages.length > 1) {
      if (deltaX < -35) {
        this.nextImage();
      } else {
        this.prevImage();
      }
    }
  }

  get calculatedEstimatedWeightGrams(): number {
    const p = this.product();
    if (!p || p.pricingType !== 'ByWeight') return 0;
    if (this.orderMode === 'weight') return this.customWeightGrams;
    const avg = p.averageUnitWeightGrams || 500;
    return this.piecesCount * avg;
  }

  get calculatedEstimatedTotal(): number {
    const p = this.product();
    if (!p) return 0;

    let total = 0;
    if (this.isWeighedProduct) {
      const pricePerKg = p.pricePerKg || p.pricePerUnit;
      if (this.orderMode === 'weight') {
        total = (this.customWeightGrams / 1000) * pricePerKg;
      } else {
        const avg = p.averageUnitWeightGrams || 500;
        const totalWeightKg = (this.piecesCount * avg) / 1000;
        total = totalWeightKg * pricePerKg;
      }
    } else {
      total = this.piecesCount * p.pricePerUnit;
    }

    if (this.selectedPrepOption && this.selectedPrepOption.price) {
      total += this.selectedPrepOption.price * this.piecesCount;
    }

    for (const key of Object.keys(this.selectedModifiersByGroup)) {
      const opt = this.selectedModifiersByGroup[Number(key)];
      if (opt && opt.price) {
        total += opt.price * this.piecesCount;
      }
    }

    for (const opt of this.multiSelectedModifiers) {
      if (opt.price) {
        total += opt.price * this.piecesCount;
      }
    }

    return Math.round(total * 100) / 100;
  }

  get parsedKeySpecs(): { label: string; value: string; icon?: string }[] {
    const p = this.product();
    if (!p) return [];
    const items: { label: string; value: string; icon?: string }[] = [];

    if (p.brand) {
      items.push({ label: 'الماركة', value: p.brand, icon: 'bi-award-fill' });
    }

    if (p.specificationsJson) {
      try {
        const specs = JSON.parse(p.specificationsJson);
        const map: { [k: string]: { label: string; icon: string } } = {
          origin: { label: 'بلد المنشأ', icon: 'bi-geo-alt-fill' },
          origin_ar: { label: 'بلد المنشأ', icon: 'bi-geo-alt-fill' },
          weight: { label: 'الوزن / الحجم', icon: 'bi-speedometer' },
          size: { label: 'الحجم', icon: 'bi-box' },
          storage: { label: 'طريقة الحفظ', icon: 'bi-thermometer-half' },
          calories: { label: 'السعرات', icon: 'bi-fire' },
          ingredients: { label: 'المكونات', icon: 'bi-list-ul' },
          flavor: { label: 'النكهة', icon: 'bi-stars' }
        };
        for (const [k, meta] of Object.entries(map)) {
          if (specs[k] && !items.some(i => i.label === meta.label)) {
            items.push({ label: meta.label, value: String(specs[k]), icon: meta.icon });
          }
        }
      } catch {}
    }
    return items;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: number): void {
    this.isLoading.set(true);
    this.activeImageIndex = 0;
    this.piecesCount = 1;
    this.catalogService.getProductById(id).subscribe({
      next: prod => {
        this.product.set(prod);
        this.initProductState(prod);
        this.isLoading.set(false);
        this.loadRelated(prod);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('لم نتمكن من العثور على الصنف المطلوب');
      }
    });
  }

  private initProductState(p: Product): void {
    if (this.isWeighedProduct) {
      if (p.allowOrderByPieces && !p.allowOrderByWeight) {
        this.orderMode = 'pieces';
      } else if (!p.allowOrderByPieces && p.allowOrderByWeight) {
        this.orderMode = 'weight';
      } else {
        this.orderMode = 'pieces';
      }
      this.customWeightGrams = p.averageUnitWeightGrams || 500;
    }

    if (p.preparationGroups && p.preparationGroups.length > 0) {
      const g = p.preparationGroups[0];
      if (g.options && g.options.length > 0) {
        this.selectedPrepOption = g.options[0];
      }
    }
  }

  private loadRelated(p: Product): void {
    if (p.categoryId) {
      this.catalogService.getProducts({ categoryId: p.categoryId, pageSize: 6 }).subscribe({
        next: res => {
          const list = (res.items || []).filter(item => item.id !== p.id).slice(0, 4);
          this.relatedProducts.set(list);
        }
      });
    }
  }

  setOrderMode(mode: 'pieces' | 'weight') {
    this.orderMode = mode;
  }

  changePieces(delta: number) {
    const next = this.piecesCount + delta;
    if (next >= 1) this.piecesCount = next;
  }

  changeWeight(delta: number) {
    const next = this.customWeightGrams + delta;
    if (next >= 250) this.customWeightGrams = next;
  }

  selectPrep(opt: PreparationOption) {
    this.selectedPrepOption = opt;
  }

  selectSingleModifier(groupId: number, opt: ModifierOption) {
    if (this.selectedModifiersByGroup[groupId]?.id === opt.id) {
      this.selectedModifiersByGroup[groupId] = null;
    } else {
      this.selectedModifiersByGroup[groupId] = opt;
    }
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    const res = this.wishlistService.toggle(p.id);
    if (res === 'added') {
      this.toast.success('تمت إضافة الصنف للمفضلة ❤️');
    } else {
      this.toast.info('تمت إزالة الصنف من المفضلة');
    }
  }

  onShareProduct(): void {
    const p = this.product();
    if (!p) return;
    const url = window.location.href;
    const shareData = {
      title: p.nameAr,
      text: `${p.nameAr} - متوفر الآن على متجرنا!`,
      url: url
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.isCopied.set(true);
        this.toast.success('تم نسخ رابط الصنف إلى الحافظة بنجاح!');
        setTimeout(() => this.isCopied.set(false), 2500);
      });
    }
  }

  onAddToCart(): void {
    const p = this.product();
    if (!p) return;

    this.isSuccess.set(true);

    const mods: ModifierOption[] = [...this.multiSelectedModifiers];
    for (const key of Object.keys(this.selectedModifiersByGroup)) {
      const opt = this.selectedModifiersByGroup[Number(key)];
      if (opt && !mods.some(m => m.id === opt.id)) mods.push(opt);
    }

    const qty = this.isWeighedProduct && this.orderMode === 'weight' ? 1 : this.piecesCount;
    const customGrams = this.isWeighedProduct ? this.calculatedEstimatedWeightGrams : undefined;

    this.cartService.addItem(
      p,
      qty,
      this.selectedPrepOption ?? undefined,
      mods,
      customGrams,
      this.specialInstructions,
      this.isWeighedProduct ? this.orderMode : 'pieces'
    );

    this.toast.success(`تمت إضافة "${p.nameAr}" إلى السلة 🛒`);

    setTimeout(() => {
      this.isSuccess.set(false);
    }, 1200);
  }

  openRelatedProduct(product: Product): void {
    if (this.settingsService.settings()?.productDetailViewMode === 'page') {
      this.router.navigate(['/product', product.id]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.selectedRelatedProduct.set(product);
    }
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/menu']);
    }
  }
}
