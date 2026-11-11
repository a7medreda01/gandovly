import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { SettingsService } from '../../../core/services/settings.service';
import { LanguageService } from '../../../core/services/language.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductDetailModalComponent } from '../../../shared/components/product-detail-modal/product-detail-modal.component';
import { Product, PagedResult } from '../../../core/models/models';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, ProductDetailModalComponent],
  template: `
    <div class="wishlist-page container py-4">
      <!-- Breadcrumb / Header Card -->
      <div class="wishlist-header-card glass-panel flex-between mb-4">
        <div class="header-texts">
          <div class="title-row d-flex align-items-center gap-2">
            <div class="heart-icon-box flex-center">
              <i class="bi bi-heart-fill"></i>
            </div>
            <h1 class="page-title mb-0">
              {{ languageService.text(settingsService.settings().labelWishlist || 'قائمة المفضلة', 'Wishlist') }}
            </h1>
            <span class="count-badge">{{ wishlistService.count() }} {{ wishlistService.count() === 1 ? languageService.text('منتج', 'item') : languageService.text('منتجات', 'items') }}</span>
          </div>
          <p class="page-subtitle text-muted mb-0 mt-1">
            {{ languageService.text('الأصناف والمنتجات المحفوظة لتسهيل العودة إليها وطلبها لاحقاً', 'Saved products to easily find and order them later') }}
          </p>
        </div>

        @if (wishlistService.hasItems()) {
          <button type="button" class="btn-clear-wishlist flex-center" (click)="clearAll()" [title]="languageService.text('إفراغ المفضلة', 'Clear Wishlist')">
            <i class="bi bi-trash3 me-1"></i>
            <span>{{ languageService.text('مسح الكل', 'Clear All') }}</span>
          </button>
        }
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state text-center py-5">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <p class="text-muted fw-bold">{{ languageService.text('جاري تحميل أصناف المفضلة...', 'Loading wishlist items...') }}</p>
        </div>
      }

      <!-- Empty State -->
      @else if (!wishlistService.hasItems() || wishlistedProducts().length === 0) {
        <div class="empty-wishlist text-center py-5">
          <div class="empty-icon-wrap mb-3 flex-center">
            <i class="bi bi-heart"></i>
          </div>
          <h3 class="fw-bold mb-2">{{ languageService.text('قائمة المفضلة فارغة حالياً', 'Your wishlist is currently empty') }}</h3>
          <p class="text-muted mb-4 max-w-md mx-auto">
            {{ emptyWishlistDesc }}
          </p>
          <a routerLink="/menu" class="btn-browse-shop">
            <i class="bi bi-grid me-2"></i>
            <span>{{ languageService.text('تصفح المنتجات الآن', 'Browse Products Now') }}</span>
          </a>
        </div>
      }

      <!-- Products Grid -->
      @else {
        <div class="wishlist-grid">
          @for (prod of wishlistedProducts(); track prod.id) {
            <div class="wishlist-item-wrapper">
              <!-- Quick Direct Remove Button from Wishlist -->
              <button
                type="button"
                class="btn-quick-remove"
                (click)="removeFromWishlist(prod.id, $event)"
                title="إزالة من المفضلة"
                aria-label="إزالة من المفضلة"
              >
                <i class="bi bi-x-lg"></i>
              </button>

              <app-product-card
                [product]="prod"
                (selectProduct)="openProductDetail(prod)"
              ></app-product-card>
            </div>
          }
        </div>
      }

      <!-- Product Detail Modal -->
      @if (selectedProduct()) {
        <app-product-detail-modal
          [product]="selectedProduct()!"
          (closeModal)="selectedProduct.set(null)"
        ></app-product-detail-modal>
      }
    </div>
  `,
  styles: [`
    .wishlist-page {
      min-height: 65vh;
      padding-bottom: 2rem;
    }

    .wishlist-header-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 1rem 1.25rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      gap: 1rem;
      flex-wrap: nowrap;

      .heart-icon-box {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: #fee2e2;
        color: #ef4444;
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      .page-title {
        font-size: 1.35rem;
        font-weight: 900;
        color: #0f172a;
      }

      .count-badge {
        font-size: 0.8rem;
        font-weight: 800;
        background: #fee2e2;
        color: #ef4444;
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        line-height: 1.2;
      }

      .page-subtitle {
        font-size: 0.84rem;
        font-weight: 600;
        color: #64748b;
      }

      .btn-clear-wishlist {
        background: #fff1f2;
        color: #e11d48;
        border: 1px solid #fecdd3;
        font-size: 0.82rem;
        font-weight: 800;
        padding: 0.45rem 0.85rem;
        border-radius: 10px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: all 0.2s ease;

        &:hover {
          background: #e11d48;
          color: #ffffff;
          border-color: #e11d48;
        }
      }
    }

    .wishlist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .wishlist-item-wrapper {
      position: relative;
      transition: transform 0.2s ease;

      .btn-quick-remove {
        position: absolute;
        top: 8px;
        left: 8px;
        z-index: 15;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #fecdd3;
        color: #e11d48;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.78rem;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        transition: all 0.2s ease;

        &:hover {
          background: #e11d48;
          color: #ffffff;
          border-color: #e11d48;
          transform: scale(1.12);
        }
      }
    }

    .empty-wishlist {
      background: #ffffff;
      border-radius: 20px;
      border: 1.5px dashed #cbd5e1;
      padding: 3.5rem 1.5rem;

      .empty-icon-wrap {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        background: #fef2f2;
        color: #f87171;
        font-size: 2.5rem;
        margin: 0 auto;
      }

      .btn-browse-shop {
        display: inline-flex;
        align-items: center;
        background: var(--primary-color, #0284c7);
        color: #ffffff;
        font-size: 0.92rem;
        font-weight: 800;
        padding: 0.65rem 1.6rem;
        border-radius: 30px;
        text-decoration: none;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
        transition: all 0.2s ease;

        &:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
        }
      }
    }

    @media (max-width: 576px) {
      .wishlist-header-card {
        padding: 0.85rem 1rem;
        .page-title { font-size: 1.15rem; }
        .page-subtitle { font-size: 0.76rem; }
      }

      .wishlist-grid {
        grid-template-columns: repeat(var(--mobile-product-columns,2), minmax(0,1fr));
        gap: 0.75rem;
      }
    }
  `]
})
export class WishlistComponent implements OnInit {
  wishlistService = inject(WishlistService);
  catalogService = inject(CatalogService);
  settingsService = inject(SettingsService);
  languageService = inject(LanguageService);

  get emptyWishlistDesc(): string {
    return this.languageService.text(
      'لم تقم بحفظ أي منتجات بعد. تصفح تشكيلة منتجاتنا المتنوعة وأضف ما يعجبك للمفضلة بالضغط على علامة القلب!',
      'You have not saved any products yet. Browse our selection and add your favorites by tapping the heart icon!'
    );
  }

  allProducts = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  selectedProduct = signal<Product | null>(null);

  wishlistedProducts = computed(() => {
    const ids = this.wishlistService.items();
    return this.allProducts().filter(p => ids.includes(p.id));
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.catalogService.getProducts({ pageSize: 150 }).subscribe({
      next: (res: PagedResult<Product>) => {
        this.allProducts.set(res.items || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openProductDetail(product: Product): void {
    this.selectedProduct.set(product);
  }

  removeFromWishlist(id: number, e?: Event): void {
    if (e) e.stopPropagation();
    this.wishlistService.toggle(id);
  }

  clearAll(): void {
    if (confirm('هل أنت متأكد من مسح جميع الأصناف من المفضلة؟')) {
      this.wishlistService.clear();
    }
  }
}
