import { SettingsService } from '../../../core/services/settings.service';
import { LanguageService } from '../../../core/services/language.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../../../shared/components/product-card-skeleton/product-card-skeleton.component';
import { ProductDetailModalComponent } from '../../../shared/components/product-detail-modal/product-detail-modal.component';
import { Product, MenuCategory } from '../../../core/models/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink,CommonModule, FormsModule, ProductCardComponent, ProductCardSkeletonComponent, ProductDetailModalComponent, ImageUrlPipe],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly catalogService = inject(CatalogService);
  readonly settingsService = inject(SettingsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('catScrollContainer') catScrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('scrollSentinel') scrollSentinel?: ElementRef<HTMLDivElement>;
  @ViewChild('menuSearchInput') menuSearchInput?: ElementRef<HTMLInputElement>;

  readonly searchTerm = signal<string>('');
  readonly isLiveSearching = signal<boolean>(false);
  private readonly searchSubject = new Subject<string>();

  selectedCatId = signal<number | null>(null);
  selectedProductForModal = signal<Product | null>(null);

  // Pagination & Infinite Scroll Signals
  products = signal<Product[]>([]);
  totalCount = signal<number>(0);
  pageIndex = signal<number>(1);
  sortBy="";
  pageSize = signal<number>(16);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(true);
  isLoadingMore = signal<boolean>(false);
  loadError = signal(false);
  private productsRequest?: Subscription;
  private productDetailRequest?: Subscription;
  private readonly productNotice = inject(NotificationService);
  readonly loadingProductDetail = signal(false);
  private searchSubscription?: Subscription;
  private routeSubscription?: Subscription;

  private observer?: IntersectionObserver;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Initialize search term immediately from snapshot so it renders filled on initial page load!
    const initSearch = this.route.snapshot.queryParams['search'] || '';
    if (initSearch) {
      this.searchTerm.set(initSearch);
    }

    // Debounce search input for instant live search (like navbar)
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(280),
      distinctUntilChanged()
    ).subscribe(term => {
      this.isLiveSearching.set(false);
      this.pageIndex.set(1);
      const clean = (term || '').trim();
      const currentParam = this.route.snapshot.queryParams['search'] || '';
      if (currentParam === clean) {
        this.fetchProducts(true);
      } else {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            search: clean ? clean : null,
            page: null
          },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    });

    // 1. Load Categories from backend
    this.catalogService.loadCategories().subscribe();

    // 2. Read query params independently
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      this.selectedCatId.set(params['category'] ? +params['category'] : null);
      if (params['page']) {
        this.pageIndex.set(+params['page'] || 1);
      }
      const q = params['search'] || '';
      if (this.searchTerm() !== q) {
        this.searchTerm.set(q);
      }
      if (this.menuSearchInput?.nativeElement && this.menuSearchInput.nativeElement.value !== q) {
        this.menuSearchInput.nativeElement.value = q;
      }
      this.sortBy = params['sort'] || '';

      // Open modal if product query param is provided
      if (params['product']) {
        const prodId = +params['product'];
        this.catalogService.getProductById(prodId).subscribe(p => {
          if (p) this.selectedProductForModal.set(p);
        });
      }

      this.fetchProducts(true);
    });
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
    if (this.menuSearchInput?.nativeElement && this.searchTerm()) {
      this.menuSearchInput.nativeElement.value = this.searchTerm();
    }
  }

  ngOnDestroy() { this.productDetailRequest?.unsubscribe();
    this.productsRequest?.unsubscribe(); this.searchSubscription?.unsubscribe(); this.routeSubscription?.unsubscribe();
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    this.observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first && first.isIntersecting) {
        this.loadNextPage();
      }
    }, {
      rootMargin: '400px 0px',
      threshold: 0.05
    });

    if (this.scrollSentinel?.nativeElement) {
      this.observer.observe(this.scrollSentinel.nativeElement);
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (typeof window === 'undefined') return;
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 500;
    if (scrollPosition >= threshold) {
      this.loadNextPage();
    }
  }

  scrollCategories(offset: number) {
    if (this.catScrollContainer?.nativeElement) {
      this.catScrollContainer.nativeElement.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  onSearchInput(val: string) {
    const clean = val || '';
    this.searchTerm.set(clean);
    this.isLiveSearching.set(true);
    this.searchSubject.next(clean);
  }

  onSearchChange(term: string) {
    this.onSearchInput(term);
  }

  clearSearch() {
    this.searchTerm.set('');
    if (this.menuSearchInput?.nativeElement) {
      this.menuSearchInput.nativeElement.value = '';
    }
    this.isLiveSearching.set(false);
    this.pageIndex.set(1);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: null,
        page: null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  selectCategory(id: number | null) {
    this.selectedCatId.set(id);
    this.pageIndex.set(1);
    this.updateQueryParams();

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, left: 0, behavior: 'smooth' });
    }
  }

  fetchProducts(reset: boolean = false) {
    this.productsRequest?.unsubscribe();
    this.loadError.set(false);
    if (reset) {
      this.isLoading.set(true);
      this.pageIndex.set(1);
    }

    this.productsRequest = this.catalogService.getProducts({
      cardsOnly: true,
      categoryId: this.selectedCatId(),
      search: this.searchTerm(),
      page: this.pageIndex(),
      sortBy: this.sortBy,
      pageSize: this.pageSize()
    }).subscribe({
      next: (res) => {
        if (res) {
          if (reset || this.pageIndex() === 1) {
            this.products.set(res.items || []);
          } else {
            this.products.update(curr => [...curr, ...(res.items || [])]);
          }
          this.totalCount.set(res.totalCount || 0);
          this.pageIndex.set(res.pageIndex || 1);
          this.pageSize.set(res.pageSize || 16);
          this.totalPages.set(res.totalPages || 1);
        } else {
          if (reset) this.products.set([]);
          this.totalCount.set(0);
          this.totalPages.set(1);
        }
        this.isLoading.set(false);
        this.isLoadingMore.set(false);

        // Re-attach observer to sentinel
        setTimeout(() => {
          if (this.observer && this.scrollSentinel?.nativeElement) {
            this.observer.unobserve(this.scrollSentinel.nativeElement);
            this.observer.observe(this.scrollSentinel.nativeElement);
          }
        }, 100);
      },
      error: (err) => {
        this.loadError.set(true);
        if (!reset) this.pageIndex.update(page => Math.max(1, page - 1));
        console.error('Error fetching paged products', err);
        if (reset) this.products.set([]);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  loadNextPage() {
    if (this.loadError()) return;
    if (this.isLoading() || this.isLoadingMore()) return;
    if (this.pageIndex() >= this.totalPages()) return;

    this.isLoadingMore.set(true);
    const nextPage = this.pageIndex() + 1;
    this.pageIndex.set(nextPage);
    this.fetchProducts(false);
  }

  private updateQueryParams() {
    const term = this.searchTerm().trim();
    const current = this.route.snapshot.queryParamMap;
    if ((current.get('category') || '') === (this.selectedCatId()?.toString() || '') && (current.get('search') || '') === term) {
      this.fetchProducts(true); return;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.selectedCatId(),
        page: null,
        search: term ? term : null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  readonly language = inject(LanguageService);

  get selectedCategoryName(): string {
    const catId = this.selectedCatId();
    if (catId === null) return 'جميع المنتجات والأصناف';
    const cat = this.catalogService.categories().find(c => c.id === catId);
    return cat ? this.language.getLocalizedName(cat) : this.language.text('الأصناف', 'Products');
  }

  openProductModal(product: Product) {
    if (!product) return;
    if (this.settingsService.settings()?.productDetailViewMode === 'page') {
      this.router.navigate(['/product', product.id]);
      return;
    }
    this.selectedProductForModal.set(product);
    this.loadingProductDetail.set(false);
    this.productDetailRequest?.unsubscribe();
    this.productDetailRequest = this.catalogService.getProductById(product.id).subscribe({
      next: details => {
        this.loadingProductDetail.set(false);
        if (details) {
          this.selectedProductForModal.set(details);
        }
      },
      error: () => {
        this.loadingProductDetail.set(false);
        if (!this.selectedProductForModal()) {
          this.productNotice.error('تعذر تحميل تفاصيل المنتج. حاول مرة أخرى.');
        }
      }
    });
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
