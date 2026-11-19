import { LanguageService } from '../../../../../core/services/language.service';
import { ImageRevealDirective } from '../../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../../shared/directives/scroll-animate.directive';
import { HomeSkeletonComponent } from '../../home-skeleton.component';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification.service';
import { Component, DestroyRef, inject, signal, computed , ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../../../core/services/api.service';
import { SettingsService } from '../../../../../core/services/settings.service';
import { CatalogService } from '../../../../../core/services/catalog.service';
import { HomeSection } from '../../../../../core/models/store-layout';
import { Product } from '../../../../../core/models/models';
import { ImageUrlPipe } from '../../../../../shared/pipes/image-url.pipe';
import { ProductCardComponent } from '../../../../../shared/components/product-card/product-card.component';
import { ProductDetailModalComponent } from '../../../../../shared/components/product-detail-modal/product-detail-modal.component';
import { HomeSectionsComponent } from '../../home-sections.component';

import { SectionHeroComponent } from '../../sections/section-hero.component';
import { SectionProductsComponent } from '../../sections/section-products.component';
import { SectionBannerComponent } from '../../sections/section-banner.component';
import { SectionFeaturesComponent } from '../../sections/section-features.component';
import { SectionBrandsComponent } from '../../sections/section-brands.component';
import { SectionCategoriesComponent } from '../../sections/section-categories.component';
import { SectionProductCarouselComponent } from '../../sections/section-product-carousel.component';
import { SectionTestimonialsComponent } from '../../sections/section-testimonials.component';
import { SectionHeroSliderComponent } from '../../sections/section-hero-slider.component';
import { SectionCategoriesGridComponent } from '../../sections/section-categories-grid.component';
import { SectionCountdownComponent } from '../../sections/section-countdown.component';
import { SectionNewsletterComponent } from '../../sections/section-newsletter.component';
import { SectionStatsComponent } from '../../sections/section-stats.component';
import { SectionCtaFullComponent } from '../../sections/section-cta-full.component';
import { SectionVideoComponent } from '../../sections/section-video.component';
import { SectionMarkdownComponent } from '../../sections/section-markdown.component';

@Component({
  selector: 'app-editorial-home-theme',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, ImageUrlPipe, ProductCardComponent, ProductDetailModalComponent,
    HomeSkeletonComponent, ImageRevealDirective, ScrollAnimateDirective,
    SectionHeroComponent, SectionProductsComponent, SectionBannerComponent,
    SectionFeaturesComponent, SectionBrandsComponent, SectionCategoriesComponent,
    SectionProductCarouselComponent, SectionTestimonialsComponent,
    SectionHeroSliderComponent, SectionCategoriesGridComponent,
    SectionCountdownComponent, SectionNewsletterComponent, SectionStatsComponent,
    SectionCtaFullComponent, SectionVideoComponent, SectionMarkdownComponent
  ],
  templateUrl: './editorial-home-theme.component.html',
  styleUrls: ['../../home-sections.component.scss', './editorial-home-theme.component.scss']
})
export class EditorialHomeThemeComponent extends HomeSectionsComponent {
  private readonly themeDestroyRef = inject(DestroyRef);
  override ngOnInit() {
    this.catalog.loadCategories().pipe(takeUntilDestroyed(this.themeDestroyRef)).subscribe();
    super.ngOnInit();
  }
}
