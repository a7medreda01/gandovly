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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @ViewChild('catScrollContainer') catScrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('scrollSentinel') scrollSentinel?: ElementRef<HTMLDivElement>;

  searchTerm: string = '';
  private searchSubject = new Subject<string>();

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

    // Debounce search input
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(term => {
      this.pageIndex.set(1);
      this.updateQueryParams();
    });

    // 1. Load Categories from backend
    this.catalogService.loadCategories().subscribe(() => {
      // 2. Read query params
      this.routeSubscription = this.route.queryParams.subscribe(params => {
        this.selectedCatId.set(params['category'] ? +params['category'] : null);
        if (params['page']) {
          this.pageIndex.set(+params['page'] || 1);
        }
        this.searchTerm = params['search'] || '';
        this.sortBy=params['sort']||'';

        // Open modal if product query param is provided
        if (params['product']) {
          const prodId = +params['product'];
          this.catalogService.getProductById(prodId).subscribe(p => {
            if (p) this.selectedProductForModal.set(p);
          });
        }

        this.fetchProducts(true);
      });
    });
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
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

  onSearchChange(term: string) {
    this.searchSubject.next(term);
  }

  clearSearch() {
    this.searchTerm = '';
    this.pageIndex.set(1);
    this.updateQueryParams();
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
      search: this.searchTerm,
      page: this.pageIndex(),
      sortBy:this.sortBy,
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
    const current = this.route.snapshot.queryParamMap;
    if ((current.get('category') || '') === (this.selectedCatId()?.toString() || '') && (current.get('search') || '') === this.searchTerm.trim()) {
      this.fetchProducts(true); return;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.selectedCatId(),
        page: null,
        search: this.searchTerm.trim() ? this.searchTerm.trim() : null
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
    this.productDetailRequest?.unsubscribe();
    this.loadingProductDetail.set(true);
    this.productDetailRequest = this.catalogService.getProductById(product.id).subscribe({
      next: details => {
        this.loadingProductDetail.set(false);
        this.selectedProductForModal.set(details);
      },
      error: () => {
        this.loadingProductDetail.set(false);
        this.productNotice.error('تعذر تحميل تفاصيل المنتج. حاول مرة أخرى.');
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
