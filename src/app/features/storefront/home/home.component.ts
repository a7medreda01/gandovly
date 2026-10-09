import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../../../shared/components/product-card-skeleton/product-card-skeleton.component';
import { ProductDetailModalComponent } from '../../../shared/components/product-detail-modal/product-detail-modal.component';
import { Product } from '../../../core/models/models';

import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule, ProductCardComponent, ProductCardSkeletonComponent, ProductDetailModalComponent, ImageUrlPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  readonly settingsService = inject(SettingsService);
  readonly catalogService = inject(CatalogService);
  readonly authService = inject(AuthService);

  selectedProductForModal = signal<Product | null>(null);
  selectedCategoryId = signal<number | null>(null);
  searchQuery = signal<string>('');

  ngOnInit() {
    this.settingsService.loadSettings().subscribe();
    this.catalogService.loadMenu().subscribe();
  }

  selectCategory(id: number | null) {
    this.selectedCategoryId.set(id);
  }

  openProductModal(product: Product) {
    this.selectedProductForModal.set(product);
  }

  closeProductModal() {
    this.selectedProductForModal.set(null);
  }

  filteredProducts = computed<Product[]>(() => {
    const cats = this.catalogService.categories();
    if (!cats || cats.length === 0) return [];

    let all = cats.flatMap(c => c.products);

    // Category filter
    const catId = this.selectedCategoryId();
    if (catId !== null) {
      all = all.filter(p => p.categoryId === catId);
    }

    // Search filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      all = all.filter(p =>
        p.nameAr.toLowerCase().includes(query) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return all;
  });

  get featuredProducts(): Product[] {
    return this.filteredProducts().slice(0, 12);
  }
}

