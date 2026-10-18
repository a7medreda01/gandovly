import { Injectable, computed, signal } from '@angular/core';
import { CartItem, ModifierOption, PreparationOption, Product } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  items = signal<CartItem[]>([]);
  isDrawerOpen = signal<boolean>(false);
  cartBumped = signal<boolean>(false);
  private bumpTimeout: any;

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
    orderMode?: 'pieces' | 'weight'
  ) {
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
      selectedModifiers: modifiers,
      specialInstructions,
      estimatedWeightGrams: estimatedWeight,
      estimatedUnitPrice,
      estimatedLineTotal: Math.round(lineTotal * 100) / 100
    };

    this.items.update(list => [...list, newItem]);
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

    // الزيادة أو النقصان بمقدار الوزن التقريبي للسمكة الواحدة
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
