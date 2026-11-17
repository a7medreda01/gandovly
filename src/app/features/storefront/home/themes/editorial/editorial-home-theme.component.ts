import { LanguageService } from '../../../../../core/services/language.service';
import { ImageRevealDirective } from '../../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../../shared/directives/scroll-animate.directive';
import { HomeSkeletonComponent } from '../../home-skeleton.component';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../../../core/services/notification.service';
import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
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
@Component({selector: 'app-editorial-home-theme', standalone:true, imports:[CommonModule, FormsModule, RouterLink, ImageUrlPipe, ProductCardComponent, ProductDetailModalComponent, HomeSkeletonComponent, ImageRevealDirective, ScrollAnimateDirective], templateUrl:'./editorial-home-theme.component.html', styleUrls:['../../home-sections.component.scss','./editorial-home-theme.component.scss']})
export class EditorialHomeThemeComponent extends HomeSectionsComponent {
  private readonly themeDestroyRef = inject(DestroyRef);
  override ngOnInit() {
    this.catalog.loadCategories().pipe(takeUntilDestroyed(this.themeDestroyRef)).subscribe();
    super.ngOnInit();
  }
}
