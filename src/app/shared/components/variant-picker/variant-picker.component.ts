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
        <h3>اللون</h3>
        <div class="choices" aria-label="اللون">
          @for(color of colors;track color){
            <button type="button" [class.active]="selectedColor===color" [attr.aria-pressed]="selectedColor===color" (click)="chooseColor(color)">
              <span class="color-swatch" [style.background-color]="colorHex(color)"></span>{{color}}
            </button>
          }
        </div>
        @if(selectedColor && hasSizes){
          <h3>المقاس</h3>
          <div class="choices" aria-label="المقاس">
            @for(v of sizes;track v.id){
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
    .variants { display: grid; grid-template-columns: 52px minmax(0, 1fr); align-items: start; gap: 6px; padding-block: 8px; }
    h3 { font-size: 13px; margin: 0; padding-block: 8px; }
    .choices { display: flex; flex-wrap: wrap; gap: 5px; }
    button { display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: 34px; min-width: 34px; padding: 4px 8px; border: 1px solid var(--border-color, #ddd); border-radius: var(--radius-control, 8px); background: var(--card-bg, #fff); color: var(--text-main, #123); font: inherit; font-size: 13px; line-height: 1.35; }
    .color-swatch { width: 13px; height: 13px; flex: none; border-radius: 50%; border: 1px solid #0003; background: #eee; }
    .active { border-color: var(--primary-color); background: color-mix(in srgb, var(--primary-color) 8%, var(--card-bg, #fff)); }
    button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    button:disabled { opacity: .45; }
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

  get colors() {
    return [...new Set(this.variants.map(v => v.color))];
  }

  get sizes() {
    return this.variants.filter(v => (v.colorId || v.color) === (this.variants.find(c => c.color === this.selectedColor)?.colorId || this.selectedColor));
  }

  get hasSizes(): boolean {
    return this.variants.some(v => !!v.size?.trim());
  }

  chooseColor(color: string) {
    this.selectedColor = color;
    const currentSizes = this.sizes;
    this.colorImages.emit(currentSizes.find(v => v.images?.length)?.images || []);

    if (!this.hasSizes) {
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
    this.selectedId = v.id;
    this.selected.emit(v);
  }
}
