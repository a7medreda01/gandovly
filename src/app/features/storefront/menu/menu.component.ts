import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../../../shared/components/product-card-skeleton/product-card-skeleton.component';
import { ProductDetailModalComponent } from '../../../shared/components/product-detail-modal/product-detail-modal.component';
import { Product, MenuCategory } from '../../../core/models/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, ProductCardSkeletonComponent, ProductDetailModalComponent, ImageUrlPipe],
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
  pageSize = signal<number>(16);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(true);
  isLoadingMore = signal<boolean>(false);

  private observer?: IntersectionObserver;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(term => {
      this.pageIndex.set(1);
      this.fetchProducts(true);
    });

    // 1. Load Categories from backend
    this.catalogService.loadCategories().subscribe(() => {
      // 2. Read query params
      this.route.queryParams.subscribe(params => {
        if (params['category']) {
          this.selectedCatId.set(+params['category']);
        }
        if (params['page']) {
          this.pageIndex.set(+params['page'] || 1);
        }
        if (params['search']) {
          this.searchTerm = params['search'];
        }

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

  ngOnDestroy() {
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
    this.fetchProducts(true);
  }

  selectCategory(id: number | null) {
    this.selectedCatId.set(id);
    this.pageIndex.set(1);
    this.updateQueryParams();
    this.fetchProducts(true);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, left: 0, behavior: 'smooth' });
    }
  }

  fetchProducts(reset: boolean = false) {
    if (reset) {
      this.isLoading.set(true);
      this.pageIndex.set(1);
    }

    this.catalogService.getProducts({
      categoryId: this.selectedCatId(),
      search: this.searchTerm,
      page: this.pageIndex(),
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
        console.error('Error fetching paged products', err);
        if (reset) this.products.set([]);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  loadNextPage() {
    if (this.isLoading() || this.isLoadingMore()) return;
    if (this.pageIndex() >= this.totalPages()) return;

    this.isLoadingMore.set(true);
    const nextPage = this.pageIndex() + 1;
    this.pageIndex.set(nextPage);
    this.fetchProducts(false);
  }

  private updateQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.selectedCatId(),
        search: this.searchTerm.trim() ? this.searchTerm.trim() : null
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  get selectedCategoryName(): string {
    const catId = this.selectedCatId();
    if (catId === null) return 'جميع المنتجات والأصناف';
    const cat = this.catalogService.categories().find(c => c.id === catId);
    return cat ? cat.nameAr : 'الأصناف';
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
