import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly STORAGE_KEY = 'mecart_wishlist';

  items = signal<number[]>(this.loadFromStorage());

  count = computed(() => this.items().length);

  hasItems = computed(() => this.items().length > 0);

  isInWishlist(productId: number): boolean {
    return this.items().includes(productId);
  }

  toggle(productId: number): 'added' | 'removed' {
    const current = this.items();
    if (current.includes(productId)) {
      this.items.set(current.filter(id => id !== productId));
      this.saveToStorage();
      return 'removed';
    } else {
      this.items.set([...current, productId]);
      this.saveToStorage();
      return 'added';
    }
  }

  remove(productId: number): void {
    this.items.set(this.items().filter(id => id !== productId));
    this.saveToStorage();
  }

  clear(): void {
    this.items.set([]);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  private loadFromStorage(): number[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
    } catch (e) {
      console.warn('Could not save wishlist to localStorage', e);
    }
  }
}

