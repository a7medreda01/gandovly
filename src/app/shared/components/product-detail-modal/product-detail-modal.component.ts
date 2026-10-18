import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModifierOption, PreparationOption, Product } from '../../../core/models/models';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUrlPipe],
  templateUrl: './product-detail-modal.component.html',
  styleUrl: './product-detail-modal.component.scss'
})
export class ProductDetailModalComponent implements OnInit {
  @Input({ required: true }) product!: Product;
  @Output() closeModal = new EventEmitter<void>();

  private readonly cartService = inject(CartService);
  private readonly toast = inject(NotificationService);

  // Order mode for weighed items: 'pieces' or 'weight'
  orderMode: 'pieces' | 'weight' = 'pieces';
  piecesCount: number = 1;
  customWeightGrams: number = 500;

  selectedPrepOption: PreparationOption | null = null;
  selectedModifiers: ModifierOption[] = [];
  specialInstructions: string = '';
  activeImageIndex: number = 0;

  ngOnInit() {
    // Default preparation selection
    if (this.product.preparationGroups && this.product.preparationGroups.length > 0) {
      const firstGroup = this.product.preparationGroups[0];
      if (firstGroup.options && firstGroup.options.length > 0) {
        this.selectedPrepOption = firstGroup.options[0];
      }
    }

    if (this.isWeighedProduct) {
      if (this.product.allowOrderByPieces && !this.product.allowOrderByWeight) {
        this.orderMode = 'pieces';
      } else if (!this.product.allowOrderByPieces && this.product.allowOrderByWeight) {
        this.orderMode = 'weight';
      } else if (!this.product.allowOrderByPieces) {
        this.orderMode = 'weight';
      } else {
        // Both are allowed: default to pieces for whole fish, or weight for shrimp/calamari/etc.
        const isFish = this.product.nameAr.includes('سمك') || this.product.nameAr.includes('بلطي') || this.product.nameAr.includes('بوري') || this.product.nameAr.includes('دنيس') || this.product.nameAr.includes('قاروص');
        this.orderMode = isFish ? 'pieces' : 'weight';
      }

      const avg = this.product.averageUnitWeightGrams || 500;
      this.customWeightGrams = avg;
    }
  }

  get isWeighedProduct(): boolean {
    return this.product.pricingType === 'ByWeight' || (this.product.pricingType as any) === 1 || (this.product.pricingType as any) === 'WeightedByKilo';
  }

  get galleryImages(): string[] {
    const list: string[] = [];
    if (this.product.images && this.product.images.length > 0) {
      const sorted = [...this.product.images].sort((a, b) => {
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
      if (this.product.imageUrl) list.push(this.product.imageUrl);
      if (this.product.secondaryImageUrl) {
        const parts = this.product.secondaryImageUrl.split(';').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          if (!list.includes(part)) {
            list.push(part);
          }
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

  nextImage(e?: Event) {
    if (e) e.stopPropagation();
    const total = this.galleryImages.length;
    if (total > 1) {
      this.activeImageIndex = (this.activeImageIndex + 1) % total;
    }
  }

  prevImage(e?: Event) {
    if (e) e.stopPropagation();
    const total = this.galleryImages.length;
    if (total > 1) {
      this.activeImageIndex = (this.activeImageIndex - 1 + total) % total;
    }
  }

  get calculatedEstimatedWeightGrams(): number {
    if (this.product.pricingType !== 'ByWeight') return 0;
    if (this.orderMode === 'weight') return this.customWeightGrams;
    const avg = this.product.averageUnitWeightGrams || 500;
    return this.piecesCount * avg;
  }

  get calculatedEstimatedTotal(): number {
    let total = 0;

    if (this.product.pricingType === 'ByWeight') {
      const pricePerKg = this.product.pricePerKg || this.product.pricePerUnit;
      const weightInKg = this.calculatedEstimatedWeightGrams / 1000;
      total = weightInKg * pricePerKg;

      const units = this.orderMode === 'pieces' ? this.piecesCount : Math.max(1, Math.round(this.customWeightGrams / (this.product.averageUnitWeightGrams || 500)));

      if (this.selectedPrepOption) {
        if (this.selectedPrepOption.pricingType === 'FinalPrice') {
          total = this.selectedPrepOption.price * units;
        } else {
          total += this.selectedPrepOption.price * units;
        }
      }

      if (this.selectedModifiers.length > 0) {
        const modSum = this.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
        total += modSum * units;
      }
    } else {
      total = this.product.pricePerUnit * this.piecesCount;

      if (this.selectedPrepOption) {
        if (this.selectedPrepOption.pricingType === 'FinalPrice') {
          total = this.selectedPrepOption.price * this.piecesCount;
        } else {
          total += this.selectedPrepOption.price * this.piecesCount;
        }
      }

      if (this.selectedModifiers.length > 0) {
        const modSum = this.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
        total += modSum * this.piecesCount;
      }
    }

    return Math.round(total * 100) / 100;
  }

  setOrderMode(mode: 'pieces' | 'weight') {
    this.orderMode = mode;
  }

  changePieces(delta: number) {
    const next = this.piecesCount + delta;
    if (next >= 1 && next <= 50) {
      this.piecesCount = next;
    }
  }

  changeWeight(deltaGrams: number) {
    const next = this.customWeightGrams + deltaGrams;
    if (next >= 250 && next <= 20000) {
      this.customWeightGrams = next;
    }
  }

  selectPrep(option: PreparationOption) {
    this.selectedPrepOption = option;
  }

  toggleModifier(mod: ModifierOption) {
    const exists = this.selectedModifiers.some(m => m.id === mod.id);
    if (exists) {
      this.selectedModifiers = this.selectedModifiers.filter(m => m.id !== mod.id);
    } else {
      this.selectedModifiers = [...this.selectedModifiers, mod];
    }
  }

  isModifierSelected(modId: number): boolean {
    return this.selectedModifiers.some(m => m.id === modId);
  }

  isSuccess = false;

  onAddToCart() {
    if (this.isSuccess) return;
    this.isSuccess = true;

    const qty = this.orderMode === 'pieces'
      ? this.piecesCount
      : Math.max(1, Math.round(this.customWeightGrams / (this.product.averageUnitWeightGrams || 500)));

    const customGrams = this.orderMode === 'weight'
      ? this.customWeightGrams
      : (this.product.pricingType === 'ByWeight' ? this.piecesCount * (this.product.averageUnitWeightGrams || 500) : undefined);

    this.cartService.addItem(
      this.product,
      qty,
      this.selectedPrepOption ?? undefined,
      this.selectedModifiers,
      customGrams,
      this.specialInstructions,
      this.orderMode
    );

    this.toast.success(
      `تمت إضافة (${this.product.nameAr}) إلى السلة بنجاح 🛒`,
      'عرض السلة',
      () => this.cartService.openDrawer()
    );

    setTimeout(() => {
      this.dismissModal();
    }, 350);
  }

  isCopied = false;
  private copyTimeout: any;

  async onShareProduct(event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (typeof window === 'undefined') return;

    const shareUrl = `${window.location.origin}/menu?product=${this.product.id}`;
    const shareTitle = `${this.product.nameAr} - أسماك جندوفلي`;
    const shareText = `شاهد تفاصيل واطلب (${this.product.nameAr}) من منيو أسماك جندوفلي 🐟✨\n${shareUrl}`;

    // Native Web Share API (Mobile browsers & supported desktop)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        this.triggerCopiedState();
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: Clipboard copy
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      this.triggerCopiedState();
      this.toast.success(`تم نسخ رابط (${this.product.nameAr}) بنجاح! 📋`);
    } catch {
      this.toast.info(`رابط الصنف: ${shareUrl}`);
    }
  }

  private triggerCopiedState() {
    this.isCopied = true;
    if (this.copyTimeout) clearTimeout(this.copyTimeout);
    this.copyTimeout = setTimeout(() => {
      this.isCopied = false;
    }, 2500);
  }

  // ===== SWIPE DOWN TO DISMISS (OPTIMIZED & ULTRA RESPONSIVE) =====
  touchStartY = 0;
  touchCurrentY = 0;
  private touchStartTime = 0;
  isDragging = false;
  dragTranslateY = 0;
  isClosing = false;

  get backdropOpacity(): number {
    if (this.isClosing) return 0;
    if (this.isDragging && this.dragTranslateY > 0) {
      return Math.max(0.15, 1 - (this.dragTranslateY / 320));
    }
    return 1;
  }

  get modalTransform(): string | null {
    if (this.isClosing) return null;
    if (this.dragTranslateY > 0) {
      return `translate3d(0, ${this.dragTranslateY}px, 0)`;
    }
    return null;
  }

  get modalTransition(): string {
    if (this.isDragging) return 'none';
    if (this.isClosing) return 'transform 0.14s cubic-bezier(0.25, 1, 0.5, 1)';
    return 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)';
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.touchStartY = event.touches[0].clientY;
      this.touchCurrentY = this.touchStartY;
      this.touchStartTime = performance.now();
      this.isDragging = true;
    }
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.touchCurrentY = event.touches[0].clientY;
    const deltaY = this.touchCurrentY - this.touchStartY;
    if (deltaY > 0) {
      this.dragTranslateY = deltaY;
      if (event.cancelable && deltaY > 6) {
        event.preventDefault();
      }
    } else {
      this.dragTranslateY = 0;
    }
  }

  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    const deltaY = this.touchCurrentY - this.touchStartY;
    const deltaTime = performance.now() - this.touchStartTime;
    const velocityY = deltaY / Math.max(1, deltaTime);

    // Fast flick or pulled down more than 35px
    if (deltaY > 35 || (deltaY > 15 && velocityY > 0.3)) {
      this.dismissModal();
    } else {
      this.dragTranslateY = 0;
    }
  }

  onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    if (event.button !== 0) return;
    this.touchStartY = event.clientY;
    this.touchCurrentY = this.touchStartY;
    this.touchStartTime = performance.now();
    this.isDragging = true;
    (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    if (!this.isDragging) return;
    this.touchCurrentY = event.clientY;
    const deltaY = this.touchCurrentY - this.touchStartY;
    this.dragTranslateY = deltaY > 0 ? deltaY : 0;
  }

  onPointerUp(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    if (!this.isDragging) return;
    this.isDragging = false;
    (event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId);
    const deltaY = this.touchCurrentY - this.touchStartY;
    const deltaTime = performance.now() - this.touchStartTime;
    const velocityY = deltaY / Math.max(1, deltaTime);

    if (deltaY > 35 || (deltaY > 15 && velocityY > 0.3)) {
      this.dismissModal();
    } else {
      this.dragTranslateY = 0;
    }
  }

  dismissModal() {
    if (this.isClosing) return;
    this.isClosing = true;
    setTimeout(() => {
      this.closeModal.emit();
    }, 110);
  }

  onClose() {
    this.dismissModal();
  }
}
