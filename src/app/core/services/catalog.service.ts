import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { MenuCategory, Product } from '../models/models';
import { tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly api = inject(ApiService);

  categories = signal<MenuCategory[]>([]);
  isLoading = signal<boolean>(false);
  selectedCategoryId = signal<number | null>(null);

  /** Always fetches fresh data from API — no in-memory caching.
   *  A cache-busting `_t` param ensures CDN/browser cache is bypassed after admin updates. */
  loadMenu() {
    this.isLoading.set(true);
    // Cache-busting: round to nearest 5-minute window so CDN can still cache for short periods
    // but users will see updates within 5 minutes of an admin change.
    const bust = Math.floor(Date.now() / (5 * 60 * 1000));
    return this.api.get<MenuCategory[]>(`storefront/menu`, { _t: bust }).pipe(
      tap(cats => {
        if (cats && cats.length > 0) {
          this.categories.set(cats);
          if (this.selectedCategoryId() === null) {
            this.selectedCategoryId.set(cats[0].id);
          }
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        console.error('Error loading menu categories', err);
        this.isLoading.set(false);
        return of(this.categories());
      })
    );
  }

  /** Invalidates the in-memory cache so the next navigation triggers a fresh fetch. */
  invalidateMenu() {
    this.categories.set([]);
    this.selectedCategoryId.set(null);
  }

  getProductById(id: number) {
    const bust = Date.now();
    return this.api.get<Product>(`storefront/products/${id}`, { _t: bust });
  }
}
