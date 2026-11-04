import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { MenuCategory, Product, PagedResult } from '../models/models';
import { tap, catchError, of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly api = inject(ApiService);

  categories = signal<MenuCategory[]>([]);
  isLoading = signal<boolean>(false);
  selectedCategoryId = signal<number | null>(null);

  /** Loads all active categories */
  loadCategories(): Observable<MenuCategory[]> {
    return this.api.get<MenuCategory[]>('storefront/categories').pipe(
      tap(cats => {
        if (cats && cats.length > 0) {
          this.categories.set(cats);
        }
      }),
      catchError(err => {
        console.error('Error loading categories', err);
        return of(this.categories());
      })
    );
  }

  /** Server-side paged products with search and category filtering */
  getProducts(params?: {
    categoryId?: number | null;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
  }): Observable<PagedResult<Product>> {
    const p: Record<string, any> = {};
    if (params?.categoryId) p['categoryId'] = params.categoryId;
    if (params?.search && params.search.trim()) p['search'] = params.search.trim();
    if (params?.page) p['page'] = params.page;
    if (params?.pageSize) p['pageSize'] = params.pageSize;
    if (params?.sortBy) p['sortBy'] = params.sortBy;

    return this.api.get<PagedResult<Product>>('storefront/products', p);
  }

  /** Fetches full menu (backward compatibility) */
  loadMenu() {
    this.isLoading.set(true);
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

  invalidateMenu() {
    this.categories.set([]);
    this.selectedCategoryId.set(null);
  }

  getProductById(id: number) {
    const bust = Date.now();
    return this.api.get<Product>(`storefront/products/${id}`, { _t: bust });
  }
}
