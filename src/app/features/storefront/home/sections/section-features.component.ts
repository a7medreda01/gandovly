import { Component, Input, inject , ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HomeSection } from '../../../../core/models/store-layout';
import { StorefrontSettings } from '../../../../core/models/models';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';
import { ImageRevealDirective } from '../../../../shared/directives/image-reveal.directive';
import { ScrollAnimateDirective } from '../../../../shared/directives/scroll-animate.directive';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-section-features',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, ImageRevealDirective, ScrollAnimateDirective],
  template: `
@if (s.items?.length) {
<section class="content-section"
  appScrollAnimate
  [class.has-fade-in-up]="settings?.storeLayout?.enableHomeSectionAnimations !== false"
  [style.background]="s.backgroundColor || null"
  [style.color]="colorFor()">
  <header>
    @if (eyebrow()) { <span class="eyebrow">{{ eyebrow() }}</span> }
    <h2>{{ title() }}</h2>
    @if (subtitle()) { <p>{{ subtitle() }}</p> }
  </header>
  <div class="items-grid">
    @for (item of s.items; track $index) {
      <a class="info-card" [routerLink]="item.link.split('?')[0] || '/menu'" queryParamsHandling="merge">
        @if (item.imageUrl) {
          <img appImageReveal [src]="item.imageUrl | imageUrl:'category'" [alt]="lang.text(item.title, item.titleEn)" loading="lazy" decoding="async">
        } @else {
          <span class="info-icon"><i class="bi" [ngClass]="item.icon" aria-hidden="true"></i></span>
        }
        <div>
          <h3>{{ lang.text(item.title, item.titleEn) }}</h3>
          @if (lang.text(item.text, item.textEn)) { <p>{{ lang.text(item.text, item.textEn) }}</p> }
        </div>
      </a>
    }
  </div>
</section>
}`,
})
export class SectionFeaturesComponent {
  @Input() s!: HomeSection;
  @Input() settings!: StorefrontSettings;
  readonly lang = inject(LanguageService);
  title() { return this.lang.text(this.s.title, this.s.titleEn); }
  subtitle() { return this.lang.text(this.s.subtitle, this.s.subtitleEn); }
  eyebrow() { return this.lang.text(this.s.eyebrow, this.s.eyebrowEn); }
  colorFor() {
    if (this.s.textColor) return this.s.textColor;
    if (!this.s.backgroundColor) return null;
    const c = this.s.backgroundColor.slice(1);
    const b = (parseInt(c.slice(0,2),16)*299+parseInt(c.slice(2,4),16)*587+parseInt(c.slice(4,6),16)*114)/1000;
    return b < 140 ? '#ffffff' : '#152138';
  }
}
