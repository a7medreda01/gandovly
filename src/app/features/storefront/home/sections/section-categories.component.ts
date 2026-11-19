import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ImageRevealDirective } from '../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';
import { CatalogService } from '../../../../core/services/catalog.service';

@Component({
  selector: 'app-section-categories',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, ImageRevealDirective, ScrollAnimateDirective],
  template: `
<section class="content-section"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false">
  <header>
    <h2>{{ title() }}</h2>
    @if (subtitle()) { <p>{{ subtitle() }}</p> }
  </header>
  <div class="items-grid categories">
    @for (cat of catalog.categories().slice(0, s.limit || 8); track cat.id) {
      <a class="info-card" routerLink="/menu"
        [queryParams]="{category: cat.id, page: null, search: null, sort: null}"
        queryParamsHandling="merge">
        <img appImageReveal [src]="cat.imageUrl | imageUrl:'category'" [alt]="lang.getLocalizedName(cat)" loading="lazy">
        <h3>{{ lang.getLocalizedName(cat) }}</h3>
      </a>
    }
  </div>
</section>`,
})
export class SectionCategoriesComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  readonly catalog = inject(CatalogService);
  title() { return this.lang.text(this.s.title, this.s.titleEn); }
  subtitle() { return this.lang.text(this.s.subtitle, this.s.subtitleEn); }
}
