import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductVariant } from '../../../core/models/models';

@Component({
  selector: 'app-variant-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if(variants.length){
      <section class="variants">
        @if(hasColors){
          <h3>اللون</h3>
          <div class="choices" aria-label="اللون">
            @for(color of colors;track color){
              <button type="button" [class.active]="selectedColor===color" [attr.aria-pressed]="selectedColor===color" (click)="chooseColor(color)">
                <span class="color-swatch" [style.background-color]="colorHex(color)"></span>{{color}}
              </button>
            }
          </div>
        }
        @if(hasSizes && (!hasColors || selectedColor || sizeOnlyVariants.length > 0)){
          <h3>المقاس</h3>
          <div class="choices" aria-label="المقاس">
            @for(v of visibleSizes;track v.id){
              <button type="button" [disabled]="!v.isAvailable||v.stockQuantity===0" [class.active]="selectedId===v.id" [attr.aria-pressed]="selectedId===v.id" (click)="choose(v)">
                {{v.size}}{{!v.isAvailable||v.stockQuantity===0?' — غير متاح':''}}
              </button>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .variants { display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: start; gap: 8px; padding-block: 8px; }
    h3 { font-size: 13px; font-weight: 700; margin: 0; padding-block: 8px; color: var(--text-main, #123); }
    .choices { display: flex; flex-wrap: wrap; gap: 6px; }
    button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; min-width: 38px; padding: 5px 12px; border: 1.5px solid var(--border-color, #ddd); border-radius: var(--radius-control, 10px); background: var(--card-bg, #fff); color: var(--text-main, #123); font: inherit; font-size: 13px; font-weight: 600; line-height: 1.35; cursor: pointer; transition: all .18s ease; }
    .color-swatch { width: 14px; height: 14px; flex: none; border-radius: 50%; border: 1px solid #0003; background: #eee; }
    .active { border-color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 10%, var(--card-bg, #fff)); color: var(--primary-color); box-shadow: 0 2px 8px color-mix(in srgb, var(--primary-color) 14%, transparent); }
    button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    button:disabled { opacity: .45; cursor: not-allowed; }
  `]
})
export class VariantPickerComponent {
  @Input() variants: ProductVariant[] = [];
  @Output() selected = new EventEmitter<ProductVariant|null>();
  @Output() colorImages = new EventEmitter<string[]>();
  selectedColor = '';
  selectedId = '';

  ngOnChanges() {
    this.selectedColor = '';
    this.selectedId = '';
  }

  colorHex(name: string) {
    return this.variants.find(v => v.color === name)?.colorHex || ({'أسود':'#171717','اسود':'#171717','أبيض':'#ffffff','ابيض':'#ffffff','بيج':'#d9c6a5','رمادي':'#808080'} as Record<string,string>)[name] || null;
  }

  get hasColors(): boolean {
    return this.variants.some(v => !!v.color?.trim());
  }

  get colors(): string[] {
    return [...new Set(this.variants.map(v => (v.color || '').trim()).filter(Boolean))];
  }

  get sizeOnlyVariants(): ProductVariant[] {
    return this.variants.filter(v => !(v.color || '').trim() && !!(v.size || '').trim());
  }

  get sizes(): ProductVariant[] {
    if (!this.selectedColor) return this.sizeOnlyVariants;
    const targetColorId = this.variants.find(c => c.color?.trim() === this.selectedColor)?.colorId || this.selectedColor;
    return this.variants.filter(v => !!v.color?.trim() && ((v.colorId || v.color) === targetColorId || v.color?.trim() === this.selectedColor));
  }

  get visibleSizes(): ProductVariant[] {
    if (!this.hasColors) return this.variants.filter(v => !!(v.size || '').trim());
    if (this.selectedColor) {
      const colorSizes = this.sizes.filter(v => !!(v.size || '').trim());
      return colorSizes.length ? colorSizes : this.sizeOnlyVariants;
    }
    return this.sizeOnlyVariants;
  }

  get hasSizes(): boolean {
    return this.variants.some(v => !!v.size?.trim());
  }

  chooseColor(color: string) {
    this.selectedColor = color;
    const currentSizes = this.sizes;
    this.colorImages.emit(currentSizes.find(v => v.images?.length)?.images || []);

    const colorHasSizes = currentSizes.some(v => !!(v.size || '').trim());
    if (!colorHasSizes) {
      const match = currentSizes[0];
      if (match && match.isAvailable && match.stockQuantity !== 0) {
        this.selectedId = match.id;
        this.selected.emit(match);
        return;
      }
    }

    this.selectedId = '';
    this.selected.emit(null);
  }

  choose(v: ProductVariant) {
    if (!v.isAvailable || v.stockQuantity === 0) return;
    if (!v.color?.trim()) {
      this.selectedColor = '';
    }
    if (v.images?.length) {
      this.colorImages.emit(v.images);
    }
    this.selectedId = v.id;
    this.selected.emit(v);
  }
}
