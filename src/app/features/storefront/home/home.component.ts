import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../../../shared/components/product-card-skeleton/product-card-skeleton.component';
import { ProductDetailModalComponent } from '../../../shared/components/product-detail-modal/product-detail-modal.component';
import { Product } from '../../../core/models/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
  readonly languageService = inject(LanguageService);

  @ViewChild('catScrollContainer') catScrollContainer?: ElementRef<HTMLDivElement>;

  selectedProductForModal = signal<Product | null>(null);
  selectedCategoryId = signal<number | null>(null);
  searchQuery = signal<string>('');
  private searchSubject = new Subject<string>();

  products = signal<Product[]>([]);
  isLoadingProducts = signal<boolean>(true);

  ngOnInit() {
    this.settingsService.loadSettings().subscribe();
    this.catalogService.loadCategories().subscribe();

    // Debounce search
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.fetchFeaturedProducts();
    });

    this.fetchFeaturedProducts();
  }

  onSearchChange(val: string) {
    this.searchSubject.next(val);
  }

  selectCategory(id: number | null) {
    this.selectedCategoryId.set(id);
    this.fetchFeaturedProducts();
  }

  scrollCategories(offset: number) {
    if (this.catScrollContainer?.nativeElement) {
      this.catScrollContainer.nativeElement.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  fetchFeaturedProducts() {
    this.isLoadingProducts.set(true);
    this.catalogService.getProducts({
      categoryId: this.selectedCategoryId(),
      search: this.searchQuery(),
      page: 1,
      pageSize: 12
    }).subscribe({
      next: (res) => {
        this.products.set(res?.items || []);
        this.isLoadingProducts.set(false);
      },
      error: () => {
        this.products.set([]);
        this.isLoadingProducts.set(false);
      }
    });
  }

  openProductModal(product: Product) {
    this.selectedProductForModal.set(product);
  }

  closeProductModal() {
    this.selectedProductForModal.set(null);
  }

  get featuredProducts(): Product[] {
    return this.products();
  }
}
