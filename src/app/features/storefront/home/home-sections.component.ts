import { LanguageService } from '../../../core/services/language.service';
import { ImageRevealDirective } from '../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../shared/directives/scroll-animate.directive';
import { HomeSkeletonComponent } from './home-skeleton.component';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { Component, DestroyRef, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../core/services/api.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { HomeSection } from '../../../core/models/store-layout';
import { Product } from '../../../core/models/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { ProductDetailModalComponent } from '../../../shared/components/product-detail-modal/product-detail-modal.component';
import { SectionHeroComponent } from './sections/section-hero.component';
import { SectionProductsComponent } from './sections/section-products.component';
import { SectionBannerComponent } from './sections/section-banner.component';
import { SectionFeaturesComponent } from './sections/section-features.component';
import { SectionBrandsComponent } from './sections/section-brands.component';
import { SectionCategoriesComponent } from './sections/section-categories.component';
import { SectionProductCarouselComponent } from './sections/section-product-carousel.component';
import { SectionTestimonialsComponent } from './sections/section-testimonials.component';
import { SectionHeroSliderComponent } from './sections/section-hero-slider.component';
import { SectionCategoriesGridComponent } from './sections/section-categories-grid.component';
import { SectionCountdownComponent } from './sections/section-countdown.component';
import { SectionNewsletterComponent } from './sections/section-newsletter.component';
import { SectionStatsComponent } from './sections/section-stats.component';
import { SectionCtaFullComponent } from './sections/section-cta-full.component';
import { SectionVideoComponent } from './sections/section-video.component';
import { SectionMarkdownComponent } from './sections/section-markdown.component';

@Component({
  selector: 'app-home-sections',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    ImageRevealDirective, ScrollAnimateDirective, HomeSkeletonComponent,
    CommonModule, FormsModule, RouterLink, ImageUrlPipe, ProductCardComponent,
    ProductDetailModalComponent,
    SectionHeroComponent, SectionProductsComponent, SectionBannerComponent,
    SectionFeaturesComponent, SectionBrandsComponent, SectionCategoriesComponent,
    SectionProductCarouselComponent, SectionTestimonialsComponent,
    SectionHeroSliderComponent, SectionCategoriesGridComponent,
    SectionCountdownComponent, SectionNewsletterComponent, SectionStatsComponent,
    SectionCtaFullComponent, SectionVideoComponent, SectionMarkdownComponent
  ],
  templateUrl: './home-sections.component.html',
  styleUrl: './home-sections.component.scss'
})
export class HomeSectionsComponent {
  readonly language = inject(LanguageService);
  readonly settings = inject(SettingsService);
  readonly catalog = inject(CatalogService);
  private toast = inject(NotificationService);
  private productRequest?: Subscription;
  loadingProduct = signal(false);
  private router = inject(Router);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  sections = signal<{
    config: HomeSection;
    products: Product[];
  }[]>([]);

  readonly firstProductSectionId = computed(() => {
    return this.sections().find(s => s.config.kind === 'products' && s.products.length > 0)?.config.id;
  });

  readonly showHomeSearch = computed(() => {
    const cfg = this.settings.settings();
    return cfg.showSearchBar !== false && cfg.storeLayout?.showHomeSearch !== false;
  });

  readonly isFirstSectionHero = computed(() => {
    const s = this.sections();
    return s.length > 0 && (s[0].config.kind === 'hero_slider' || s[0].config.kind === 'hero');
  });

  loading = signal(true);
  error = signal(false);
  selected = signal<Product | null>(null);
  search = '';

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(false);
    this.api.get<any>('storefront/home').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: r => {
        const rows = r.sections || [];
        const cfg = this.settings.settings();

        // Only override single hero if theme banners configured, leave hero_slider to its own slides
        const hero = rows.find((row: any) => row.config.kind === 'hero');
        if (hero && cfg.showHeroBanner) {
          const theme = cfg.storeLayout?.homeTheme || 'classic';
          const tb = cfg.storeLayout?.themeBanners?.[theme];
          if (tb?.desktopUrl) hero.config.imageUrl = tb.desktopUrl;
          else if (theme === 'cards' && cfg.heroBannerDesktopUrl) hero.config.imageUrl = cfg.heroBannerDesktopUrl;

          if (tb?.mobileUrl) hero.config.mobileImageUrl = tb.mobileUrl;
          else if (theme === 'cards' && cfg.heroBannerMobileUrl) hero.config.mobileImageUrl = cfg.heroBannerMobileUrl;

          if (tb?.title) hero.config.title = tb.title;
          if (tb?.titleEn) hero.config.titleEn = tb.titleEn;
          if (tb?.subtitle) hero.config.subtitle = tb.subtitle;
          if (tb?.subtitleEn) hero.config.subtitleEn = tb.subtitleEn;
          if (tb?.buttonText) hero.config.buttonText = tb.buttonText;
          if (tb?.buttonTextEn) hero.config.buttonTextEn = tb.buttonTextEn;
          if (tb?.buttonLink) hero.config.link = tb.buttonLink;
        }

        this.sections.set(cfg.showHeroBanner === false ? rows.filter((row: any) => row.config.kind !== 'hero') : rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  open(product: Product) {
    if (product) {
      this.selected.set(product);
      this.loadingProduct.set(false);
    } else {
      this.loadingProduct.set(true);
    }
    this.productRequest?.unsubscribe();
    this.productRequest = this.catalog.getProductById(product.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => {
        this.loadingProduct.set(false);
        if (p) this.selected.set(p);
      },
      error: () => {
        this.loadingProduct.set(false);
        if (!this.selected()) this.toast.error('تعذر تحميل تفاصيل المنتج');
      }
    });
  }

  goSearch() {
    this.router.navigate(['/menu'], {
      queryParams: { search: this.search.trim() || null, page: null, category: null, sort: null },
      queryParamsHandling: 'merge'
    });
  }

  colorFor(s: HomeSection) {
    if (s.textColor) return s.textColor;
    if (s.layout === 'overlay' && (s.kind === 'hero' || s.kind === 'banner')) return '#ffffff';
    if (!s.backgroundColor) return null;
    const c = s.backgroundColor.slice(1);
    const brightness = (parseInt(c.slice(0, 2), 16) * 299 + parseInt(c.slice(2, 4), 16) * 587 + parseInt(c.slice(4, 6), 16) * 114) / 1000;
    return brightness < 140 ? '#ffffff' : '#152138';
  }

  buttonBgColor(s: HomeSection): string {
    if (s.textColor) return s.textColor;
    return this.colorFor(s) || 'var(--btn-primary-bg, var(--primary-color))';
  }

  buttonTextColor(s: HomeSection): string {
    const bg = this.buttonBgColor(s);
    if (!bg || bg.startsWith('var(')) return 'var(--btn-primary-text, #ffffff)';
    const clean = bg.replace('#', '').trim();
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return ((r * 299 + g * 587 + b * 114) / 1000) > 180 ? '#152138' : '#ffffff';
    }
    return '#ffffff';
  }

  path(s: { link: string }) {
    return s.link.split('?')[0] || '/menu';
  }

  query(s: Partial<HomeSection> & { link: string }) {
    const q: any = { page: null, search: null, product: null, category: null, sort: null, ...Object.fromEntries(new URLSearchParams(s.link.split('?')[1] || '')) };
    if (this.path(s) === '/menu') {
      if (s.source === 'category') q.category = s.categoryId;
      if (['latest', 'offers', 'bestsellers'].includes(s.source || '') && !q.sort) q.sort = s.source;
    }
    return q;
  }
}
