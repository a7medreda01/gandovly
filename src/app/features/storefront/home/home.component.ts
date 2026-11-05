import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
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
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FormsModule, ProductCardComponent, ProductCardSkeletonComponent, ProductDetailModalComponent, ImageUrlPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly settingsService = inject(SettingsService);
  readonly catalogService = inject(CatalogService);
  readonly authService = inject(AuthService);
  readonly languageService = inject(LanguageService);

  @ViewChild('catScrollContainer') catScrollContainer?: ElementRef<HTMLDivElement>;

  selectedProductForModal = signal<Product | null>(null);
  selectedCategoryId = signal<number | null>(null);
  selectedBusinessDomain = signal<string | null>(null);
  searchQuery = signal<string>('');
  private searchSubject = new Subject<string>();

  businessDomains = [
    { id: null, label: 'الكل (All)', icon: 'bi-grid-fill', color: '#10B981' },
    { id: 'Supermarket', label: 'سوبر ماركت وبقالة', icon: 'bi-basket2-fill', color: '#10B981' },
    { id: 'Restaurant', label: 'مطاعم ومأكولات', icon: 'bi-egg-fried', color: '#F59E0B' },
    { id: 'Pharmacy', label: 'صيدلية وتجميل', icon: 'bi-capsule', color: '#3B82F6' },
    { id: 'AutoParts', label: 'قطع غيار سيارات', icon: 'bi-gear-wide-connected', color: '#8B5CF6' },
    { id: 'Electronics', label: 'إلكترونيات وأجهزة', icon: 'bi-laptop', color: '#EC4899' },
    { id: 'GeneralRetail', label: 'أزياء وتجارة عامة', icon: 'bi-shop', color: '#6366F1' }
  ];

  products = signal<Product[]>([]);
  isLoadingProducts = signal<boolean>(true);
  loadError = signal(false);
  private productsRequest?: Subscription;
  private searchSubscription?: Subscription;

  ngOnInit() {
    this.settingsService.loadSettings().subscribe();
    this.catalogService.loadCategories().subscribe();

    // Debounce search
    this.searchSubscription = this.searchSubject.pipe(
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

  selectDomain(domain: string | null) {
    this.selectedBusinessDomain.set(domain);
    this.selectedCategoryId.set(null);
    this.fetchFeaturedProducts();
  }

  get displayedCategories() {
    const domain = this.selectedBusinessDomain();
    const all = this.catalogService.categories();
    if (!domain) return all;
    return all.filter(c => (c as any).domain === domain || (c as any).Domain === domain);
  }

  scrollCategories(offset: number) {
    if (this.catScrollContainer?.nativeElement) {
      this.catScrollContainer.nativeElement.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  fetchFeaturedProducts() {
    this.productsRequest?.unsubscribe();
    this.loadError.set(false);
    this.isLoadingProducts.set(true);
    this.productsRequest = this.catalogService.getProducts({
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
        this.loadError.set(true);
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
  ngOnDestroy() { this.productsRequest?.unsubscribe(); this.searchSubscription?.unsubscribe(); }
}
