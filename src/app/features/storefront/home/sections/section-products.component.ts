import { Component, Input, Output, EventEmitter, inject , ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings, Product } from '../../../../core/models/models';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-section-products',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollAnimateDirective, ProductCardComponent],
  template: `
@if (products.length) {
<section class="collection"
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  appScrollAnimate>
  <header>
    <div>
      @if (eyebrow()) { <span class="eyebrow">{{ eyebrow() }}</span> }
      <h2>{{ title() }}</h2>
      @if (subtitle()) { <p>{{ subtitle() }}</p> }
    </div>
    @if (btnText()) {
      <a [routerLink]="path()" [queryParams]="queryParams()" queryParamsHandling="merge">
        {{ btnText() }} <i class="bi bi-arrow-left" aria-hidden="true"></i>
      </a>
    }
  </header>
  <div class="collection-grid">
    @for (p of products; track p.id) {
      <app-product-card [product]="p" (selectProduct)="selectProduct.emit($event)"></app-product-card>
    }
  </div>
</section>
}`,
})
export class SectionProductsComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  @Input() products: Product[] = [];
  @Output() selectProduct = new EventEmitter<Product>();
  readonly lang = inject(LanguageService);
  title() { return this.lang.text(this.s.title, this.s.titleEn); }
  subtitle() { return this.lang.text(this.s.subtitle, this.s.subtitleEn); }
  eyebrow() { return this.lang.text(this.s.eyebrow, this.s.eyebrowEn); }
  btnText() { return this.lang.text(this.s.buttonText, this.s.buttonTextEn); }
  path() { return this.s.link.split('?')[0] || '/menu'; }
  queryParams() {
    const q: any = {page:null,search:null,product:null,category:null,sort:null,...Object.fromEntries(new URLSearchParams(this.s.link.split('?')[1]||''))};
    if(this.path()==='/menu'){if(this.s.source==='category')q.category=this.s.categoryId;if(['latest','offers','bestsellers'].includes(this.s.source||'')&&!q.sort)q.sort=this.s.source;}
    return q;
  }
}
