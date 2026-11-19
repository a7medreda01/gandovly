import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ImageRevealDirective } from '../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-section-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, ImageRevealDirective, ScrollAnimateDirective],
  template: `
<section class="promo hero"
  [class.overlay]="s.layout === 'overlay'"
  [class.no-image]="!s.imageUrl && !s.mobileImageUrl"
  [style.background]="s.backgroundColor || null"
  [style.color]="colorFor()"
  [style.--overlay]="s.overlayOpacity / 100"
  appScrollAnimate>
  @if (s.imageUrl || s.mobileImageUrl) {
    <picture class="promo-media">
      @if (s.mobileImageUrl) { <source media="(max-width:767px)" [srcset]="s.mobileImageUrl | imageUrl:'banner'"> }
      <img appImageReveal [src]="(s.imageUrl || s.mobileImageUrl) | imageUrl:'banner'" [alt]="title()" loading="eager" fetchpriority="high" decoding="async">
    </picture>
  }
  <div class="promo-copy">
    @if (eyebrow()) { <span class="eyebrow">{{ eyebrow() }}</span> }
    <h2>{{ title() }}</h2>
    @if (subtitle()) { <p>{{ subtitle() }}</p> }
    @if (btnText()) {
      <a class="primary-action" [routerLink]="path()" [queryParams]="queryParams()" queryParamsHandling="merge"
        [style.background]="btnBg()" [style.color]="btnColor()">
        <span>{{ btnText() }}</span> <i class="bi bi-arrow-left" aria-hidden="true"></i>
      </a>
    }
  </div>
</section>`,
})
export class SectionHeroComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  title() { return this.lang.text(this.s.title, this.s.titleEn); }
  subtitle() { return this.lang.text(this.s.subtitle, this.s.subtitleEn); }
  eyebrow() { return this.lang.text(this.s.eyebrow, this.s.eyebrowEn); }
  btnText() { return this.lang.text(this.s.buttonText, this.s.buttonTextEn); }
  colorFor() {
    if (this.s.textColor) return this.s.textColor;
    if (this.s.layout === 'overlay') return '#ffffff';
    if (!this.s.backgroundColor) return null;
    const c = this.s.backgroundColor.slice(1);
    const b = (parseInt(c.slice(0,2),16)*299 + parseInt(c.slice(2,4),16)*587 + parseInt(c.slice(4,6),16)*114)/1000;
    return b < 140 ? '#ffffff' : '#152138';
  }
  btnBg() { return this.s.textColor || this.colorFor() || 'var(--btn-primary-bg,var(--primary-color))'; }
  btnColor() {
    const bg = this.btnBg(); if (!bg || bg.startsWith('var(')) return 'var(--btn-primary-text,#ffffff)';
    const c = bg.replace('#','').trim(); if (c.length !== 6) return '#ffffff';
    return ((parseInt(c.substring(0,2),16)*299+parseInt(c.substring(2,4),16)*587+parseInt(c.substring(4,6),16)*114)/1000)>180?'#152138':'#ffffff';
  }
  path() { return this.s.link.split('?')[0] || '/menu'; }
  queryParams() {
    const q: any = { page:null,search:null,product:null,category:null,sort:null,...Object.fromEntries(new URLSearchParams(this.s.link.split('?')[1]||''))};
    if (this.path()==='/menu') { if(this.s.source==='category') q.category=this.s.categoryId; if(['latest','offers','bestsellers'].includes(this.s.source||'')&&!q.sort) q.sort=this.s.source; }
    return q;
  }
}
