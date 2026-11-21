import { ImageRevealDirective } from '../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../shared/directives/scroll-animate.directive';
import { HomeSkeletonComponent } from './home-skeleton.component';
import { NotificationService } from '../../../core/services/notification.service';
import { HomeSectionsComponent } from './home-sections.component';
import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule, Router } from '@angular/router';
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
  selector: 'app-home-content',
  standalone: true,
  imports: [ImageRevealDirective, ScrollAnimateDirective, HomeSkeletonComponent, HomeSectionsComponent, CommonModule, RouterLink, RouterModule, FormsModule, ProductCardComponent, ProductCardSkeletonComponent, ProductDetailModalComponent, ImageUrlPipe],
  templateUrl: './home-content.component.html',
  styleUrl: './home-content.component.scss'
})
export class HomeContentComponent implements OnInit, OnDestroy {
  readonly settingsService = inject(SettingsService);
  readonly catalogService = inject(CatalogService);
  readonly authService = inject(AuthService);
  readonly languageService = inject(LanguageService);
  private readonly router = inject(Router);

  readonly activeThemeBanner = computed(() => {
    const s = this.settingsService.settings();
    const layout = s.storeLayout;
    const theme = layout?.homeTheme || 'classic';
    const tb = layout?.themeBanners?.[theme];

    if (theme === 'cards') {
      return {
        desktopUrl: tb?.desktopUrl || s.heroBannerDesktopUrl || '',
        mobileUrl: tb?.mobileUrl || s.heroBannerMobileUrl || '',
        title: tb?.title || s.restaurantName || '',
        titleEn: tb?.titleEn || layout?.homeTitleEn || '',
        subtitle: tb?.subtitle || s.description || '',
        subtitleEn: tb?.subtitleEn || layout?.homeSubtitleEn || '',
        buttonText: tb?.buttonText || 'تسوق الآن',
        buttonTextEn: tb?.buttonTextEn || layout?.homeButtonTextEn || 'Shop now',
        buttonLink: tb?.buttonLink || '/menu'
      };
    }

    if (tb && (tb.desktopUrl || tb.title)) {
      return {
        desktopUrl: tb.desktopUrl || s.heroBannerDesktopUrl || '',
        mobileUrl: tb.mobileUrl || s.heroBannerMobileUrl || '',
        title: tb.title || s.restaurantName || '',
        titleEn: tb.titleEn || layout?.homeTitleEn || '',
        subtitle: tb.subtitle || s.description || '',
        subtitleEn: tb.subtitleEn || layout?.homeSubtitleEn || '',
        buttonText: tb.buttonText || 'تسوق الآن',
        buttonTextEn: tb.buttonTextEn || layout?.homeButtonTextEn || 'Shop now',
        buttonLink: tb.buttonLink || '/menu'
      };
    }

    const presets: Record<string, any> = {
      classic: {
        desktopUrl: s.heroBannerDesktopUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: s.heroBannerMobileUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=768&q=80',
        title: s.restaurantName || 'تسوق كافة احتياجاتك اليومية بأفضل الأسعار',
        titleEn: layout?.homeTitleEn || 'Shop your daily essentials at the best prices',
        subtitle: s.description || 'أفضل جودة، منتجات طازجة، وتوصيل سريع حتى باب بيتك',
        subtitleEn: layout?.homeSubtitleEn || 'Fresh products, top quality, fast delivery to your door',
        buttonText: 'تسوق العروض',
        buttonTextEn: 'Shop Deals',
        buttonLink: '/menu'
      },
      editorial: {
        desktopUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=768&q=80',
        title: 'الأناقة تبدأ من التفاصيل: تصاميم عصرية تجمع الجودة العالية',
        titleEn: 'Elegance starts in the details: Modern living curated with passion',
        subtitle: 'تصاميم استثنائية تناسب ذوقك وتمنح منزلك لمسة من الفخامة والراحة',
        subtitleEn: 'Exceptional craftsmanship bringing comfort and timeless luxury to your space',
        buttonText: 'اكتشف التشكيلة',
        buttonTextEn: 'Explore Collection',
        buttonLink: '/menu'
      },
      discovery: {
        desktopUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1920&q=80',
        mobileUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=768&q=80',
        title: 'اكتشف أحدث المنتجات والتقنيات الذكية',
        titleEn: 'Discover cutting-edge products and smart innovations',
        subtitle: 'آلاف المنتجات بين يديك مع عروض يومية متجددة وضمان معتمد',
        subtitleEn: 'Thousands of products with daily exclusive deals',
        buttonText: 'ابدأ الاكتشاف',
        buttonTextEn: 'Start Discovery',
        buttonLink: '/menu'
      }
    };

    return presets[theme] || {
      desktopUrl: s.heroBannerDesktopUrl || '',
      mobileUrl: s.heroBannerMobileUrl || '',
      title: s.restaurantName || '',
      titleEn: layout?.homeTitleEn || '',
      subtitle: s.description || '',
      subtitleEn: layout?.homeSubtitleEn || '',
      buttonText: 'تسوق الآن',
      buttonTextEn: 'Shop now',
      buttonLink: '/menu'
    };
  });


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
  private productDetailRequest?: Subscription;
  private readonly productNotice = inject(NotificationService);
  readonly loadingProductDetail = signal(false);
  private searchSubscription?: Subscription;

  readonly loadingSettings = signal(true);
  readonly loadingCategories = signal(true);

  ngOnInit() {
    this.settingsService.loadSettings().subscribe(settings => {
      this.loadingSettings.set(false);
      if (!this.settingsService.isStoreUnavailable() && !settings?.storeLayout?.useCustomHome) {
        this.fetchFeaturedProducts();
      }
    });
    if (!this.settingsService.isStoreUnavailable()) {
      this.catalogService.loadCategories().subscribe({
        next: () => this.loadingCategories.set(false),
        error: () => this.loadingCategories.set(false)
      });
    }

    // Debounce search
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.fetchFeaturedProducts();
    });

  }

  onSearchInput(val: string) {
    const clean = val || '';
    this.searchQuery.set(clean);
    this.searchSubject.next(clean);
  }

  onSearchChange(val: string) {
    this.onSearchInput(val);
  }

  goSearch(directQuery?: string) {
    const q = (directQuery !== undefined ? directQuery : this.searchQuery()).trim();
    this.router.navigate(['/menu'], {
      queryParams: { search: q || null },
      queryParamsHandling: ''
    });
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
      cardsOnly: true,
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
    if (product) {
      this.selectedProductForModal.set(product);
      this.loadingProductDetail.set(false);
    } else {
      this.loadingProductDetail.set(true);
    }
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
  }

  get featuredProducts(): Product[] {
    return this.products();
  }
  ngOnDestroy() { this.productDetailRequest?.unsubscribe(); this.productsRequest?.unsubscribe(); this.searchSubscription?.unsubscribe(); }
}
