import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../../../shared/components/product-card-skeleton/product-card-skeleton.component';
import { ProductDetailModalComponent } from '../../../shared/components/product-detail-modal/product-detail-modal.component';
import { Product } from '../../../core/models/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, ProductCardSkeletonComponent, ProductDetailModalComponent, ImageUrlPipe],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit {
  readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  searchTerm: string = '';
  selectedCatId: number | null = null;
  selectedProductForModal = signal<Product | null>(null);

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    this.catalogService.loadMenu().subscribe(() => {
      this.route.queryParams.subscribe(params => {
        if (params['category']) {
          this.selectedCatId = +params['category'];
        }
        if (params['product']) {
          const prodId = +params['product'];
          const allProducts: Product[] = (this.catalogService.categories() || []).flatMap(c => c.products || []);
          const found = allProducts.find(p => p.id === prodId);
          if (found) {
            this.selectedProductForModal.set(found);
          }
        }
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          }, 30);
        }
      });
    });
  }

  selectCategory(id: number | null) {
    this.selectedCatId = id;
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }

  get selectedCategoryName(): string {
    if (this.selectedCatId === null) return 'جميع الأصناف';
    const cat = this.catalogService.categories().find(c => c.id === this.selectedCatId);
    return cat ? cat.nameAr : 'الأصناف';
  }

  get filteredProducts(): Product[] {
    const cats = this.catalogService.categories();
    if (!cats) return [];

    let prods = cats.flatMap(c => c.products);

    if (this.selectedCatId !== null) {
      prods = prods.filter(p => p.categoryId === this.selectedCatId);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();

      // 1. Filter items that match in title or description
      prods = prods.filter(p =>
        p.nameAr.toLowerCase().includes(term) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term))
      );

      // 2. Prioritize matches in title (nameAr first, then nameEn, then description)
      prods.sort((a, b) => {
        const aName = a.nameAr.toLowerCase();
        const bName = b.nameAr.toLowerCase();
        const aNameEn = (a.nameEn || '').toLowerCase();
        const bNameEn = (b.nameEn || '').toLowerCase();

        const getScore = (name: string, nameEn: string): number => {
          if (name.startsWith(term)) return 1000;
          if (name.includes(term)) return 500;
          if (nameEn.startsWith(term)) return 200;
          if (nameEn.includes(term)) return 100;
          return 10; // only in description
        };

        const scoreA = getScore(aName, aNameEn);
        const scoreB = getScore(bName, bNameEn);

        if (scoreB !== scoreA) {
          return scoreB - scoreA; // higher score first
        }

        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      });
    }

    return prods;
  }

  openProductModal(product: Product) {
    this.selectedProductForModal.set(product);
  }

  closeProductModal() {
    this.selectedProductForModal.set(null);
    if (this.route.snapshot.queryParams['product']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { product: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }
}
