import { MarketingPixelsService } from './marketing-pixels.service';
import { Injectable, computed, signal, effect, inject } from '@angular/core';
import { customerSessionKey } from './tenant-session';
import { CartItem, ModifierOption, PreparationOption, Product, ProductVariant } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly pixels=inject(MarketingPixelsService);
  items = signal<CartItem[]>([]);
  isDrawerOpen = signal<boolean>(false);
  cartBumped = signal<boolean>(false);
  private bumpTimeout: any;

  constructor() {
    if (typeof window === 'undefined') return;
    const key = customerSessionKey('store_cart_v1');
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (saved?.version === 1 && Date.now() - saved.savedAt < 7 * 86400000 && Array.isArray(saved.items)) {
        this.items.set(saved.items.slice(0, 100).filter((item: CartItem) =>
          typeof item?.id === 'string' && Number.isInteger(item.product?.id) && typeof item.product?.nameAr === 'string' &&
          Number.isInteger(item.quantityUnits) && item.quantityUnits >= 1 && item.quantityUnits <= 100 &&
          Number.isFinite(item.estimatedLineTotal) && item.estimatedLineTotal >= 0 && Number.isFinite(item.estimatedUnitPrice) &&
          Array.isArray(item.selectedModifiers)));
      }
    } catch { /* Unavailable or corrupt storage must not prevent shopping. */ }
    effect(() => {
      const items = this.items();
      try { if (items.length) localStorage.setItem(key, JSON.stringify({ version: 1, savedAt: Date.now(), items })); else localStorage.removeItem(key); }
      catch { /* Private browsing and storage limits keep the cart in memory. */ }
    });
  }

  triggerCartBump() {
    this.cartBumped.set(true);
    if (this.bumpTimeout) {
      clearTimeout(this.bumpTimeout);
    }
    this.bumpTimeout = setTimeout(() => {
      this.cartBumped.set(false);
    }, 900);
  }

  // Computed totals
  totalItemsCount = computed(() => {
    return this.items().reduce((sum, item) => sum + item.quantityUnits, 0);
  });

  estimatedSubtotal = computed(() => {
    return this.items().reduce((sum, item) => sum + item.estimatedLineTotal, 0);
  });

  totalEstimatedWeightGrams = computed(() => {
    return this.items().reduce((sum, item) => sum + (item.estimatedWeightGrams || 0), 0);
  });

  hasWeightedItems = computed(() => {
    return this.items().some(
      item => item.product?.pricingType === 'ByWeight' || (item.estimatedWeightGrams != null && item.estimatedWeightGrams > 0)
    );
  });

  openDrawer() {
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
  }

  toggleDrawer() {
    this.isDrawerOpen.update(v => !v);
  }

  addItem(
    product: Product,
    quantityUnits: number,
    prepOption?: PreparationOption,
    modifiers: ModifierOption[] = [],
    customWeightGrams?: number,
    specialInstructions?: string,
    orderMode?: 'pieces' | 'weight',
    pipeMeters?: number,
    variant?: ProductVariant,
    booking?: {start:string;end:string;blocks:number}
  ) {
    if(product.variants?.length&&!variant)throw new Error('اختر اللون والمقاس.');
    if(variant){product={...product,variants:[variant],pricePerUnit:variant.price??product.pricePerUnit,nameAr:product.nameAr+' — '+variant.color+' / '+variant.size,imageUrl:variant.images?.[0]||product.imageUrl};}
    if(booking)product={...product,pricePerUnit:product.pricePerUnit*booking.blocks};
    let estimatedWeight: number | undefined;
    let lineTotal = 0;
    let estimatedUnitPrice = 0;

    const resolvedOrderMode: 'pieces' | 'weight' = orderMode ||
      (product.pricingType === 'ByWeight'
        ? (customWeightGrams && customWeightGrams > 0 && !product.allowOrderByPieces ? 'weight' : (customWeightGrams ? 'weight' : 'pieces'))
        : 'pieces');

    if (product.pricingType === 'ByWeight') {
      const pricePerKg = product.pricePerKg ?? product.pricePerUnit;
      const avgUnitWeight = product.averageUnitWeightGrams ?? 500;

      estimatedWeight = customWeightGrams && customWeightGrams > 0
        ? customWeightGrams
        : Math.max(1, quantityUnits) * avgUnitWeight;

      const fishBaseCost = (estimatedWeight / 1000) * pricePerKg;
      estimatedUnitPrice = pricePerKg;
      lineTotal = fishBaseCost;
    } else {
      estimatedUnitPrice = product.pricePerUnit;
      lineTotal = product.pricePerUnit * Math.max(1, quantityUnits);
    }

    // Prep Option
    if (prepOption) {
      if (prepOption.pricingType === 'FinalPrice') {
        lineTotal = prepOption.price * Math.max(1, quantityUnits);
      } else {
        lineTotal += prepOption.price * Math.max(1, quantityUnits);
      }
    }

    // Modifiers
    if (modifiers && modifiers.length > 0) {
      const modSum = modifiers.reduce((acc, m) => acc + m.price, 0);
      lineTotal += modSum * Math.max(1, quantityUnits);
    }

    const newItem: CartItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      product,
      quantityUnits: Math.max(1, quantityUnits),
      customWeightGrams,
      orderMode: resolvedOrderMode,
      selectedPrepOption: prepOption,
      selectedVariant: variant,
      bookingStartUtc:booking?.start,bookingEndUtc:booking?.end,
      selectedModifiers: modifiers,
      pipeMeters,
      specialInstructions,
      estimatedWeightGrams: estimatedWeight,
      estimatedUnitPrice,
      estimatedLineTotal: Math.round(lineTotal * 100) / 100
    };

    this.items.update(list => [...list, newItem]);
    this.pixels.track('AddToCart',{ids:[String(product.id)],value:newItem.estimatedLineTotal,quantity:quantityUnits});
    this.triggerCartBump();
  }

  updateQuantity(itemId: string, newQty: number) {
    if (newQty <= 0) {
      this.removeItem(itemId);
      return;
    }

    this.items.update(list =>
      list.map(item => {
        if (item.id !== itemId) return item;

        const updated = { ...item, quantityUnits: newQty };
        let lineTotal = 0;

        if (item.product.pricingType === 'ByWeight') {
          const pricePerKg = item.product.pricePerKg ?? item.product.pricePerUnit;
          const avgUnitWeight = item.product.averageUnitWeightGrams ?? 500;
          // Scale weight dynamically according to new fish count
          const estWeight = newQty * avgUnitWeight;
          updated.customWeightGrams = estWeight;
          updated.estimatedWeightGrams = estWeight;
          lineTotal = (estWeight / 1000) * pricePerKg;
        } else {
          lineTotal = item.product.pricePerUnit * newQty;
        }

        if (item.selectedPrepOption) {
          if (item.selectedPrepOption.pricingType === 'FinalPrice') {
            lineTotal = item.selectedPrepOption.price * newQty;
          } else {
            lineTotal += item.selectedPrepOption.price * newQty;
          }
        }

        if (item.selectedModifiers && item.selectedModifiers.length > 0) {
          const modSum = item.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
          lineTotal += modSum * newQty;
        }

        updated.estimatedLineTotal = Math.round(lineTotal * 100) / 100;
        return updated;
      })
    );
  }

  updateWeight(itemId: string, newWeightGrams: number) {
    if (newWeightGrams <= 0) {
      this.removeItem(itemId);
      return;
    }

    this.items.update(list =>
      list.map(item => {
        if (item.id !== itemId) return item;

        const updated = { ...item };
        const pricePerKg = item.product.pricePerKg ?? item.product.pricePerUnit;
        const avgUnitWeight = item.product.averageUnitWeightGrams ?? 500;

        let pieces = item.quantityUnits;
        if (item.product.allowOrderByPieces) {
          pieces = Math.max(1, Math.round(newWeightGrams / avgUnitWeight));
        }

        updated.quantityUnits = pieces;
        updated.customWeightGrams = newWeightGrams;
        updated.estimatedWeightGrams = newWeightGrams;

        const fishBaseCost = (newWeightGrams / 1000) * pricePerKg;
        let lineTotal = fishBaseCost;

        if (item.selectedPrepOption) {
          if (item.selectedPrepOption.pricingType === 'FinalPrice') {
            lineTotal = item.selectedPrepOption.price * pieces;
          } else {
            lineTotal += item.selectedPrepOption.price * pieces;
          }
        }

        if (item.selectedModifiers && item.selectedModifiers.length > 0) {
          const modSum = item.selectedModifiers.reduce((acc, m) => acc + m.price, 0);
          lineTotal += modSum * pieces;
        }

        updated.estimatedLineTotal = Math.round(lineTotal * 100) / 100;
        return updated;
      })
    );
  }

  adjustWeight(itemId: string, direction: number) {
    const item = this.items().find(i => i.id === itemId);
    if (!item) return;

    // الزيادة أو النقصان بمقدار الوزن التقريبي للوحدة الواحدة
    const fishUnitWeight = (item.product.averageUnitWeightGrams && item.product.averageUnitWeightGrams > 0)
      ? item.product.averageUnitWeightGrams
      : 250;

    const currentWeight = item.estimatedWeightGrams || item.customWeightGrams || fishUnitWeight;
    const deltaGrams = direction > 0 ? fishUnitWeight : -fishUnitWeight;
    const newWeight = currentWeight + deltaGrams;

    if (newWeight <= 0) {
      this.removeItem(itemId);
      return;
    }

    const minWeight = fishUnitWeight;
    const clampedWeight = Math.max(minWeight, newWeight);
    this.updateWeight(itemId, clampedWeight);
  }

  removeItem(itemId: string) {
    this.items.update(list => list.filter(i => i.id !== itemId));
  }

  clearCart() {
    this.items.set([]);
  }
}
