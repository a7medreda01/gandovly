import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductVariant } from '../../../core/models/models';
@Component({selector:'app-variant-picker',standalone:true,imports:[CommonModule],template:`@if(variants.length){<section class="variants"><h3>اللون والمقاس</h3><div class="choices" aria-label="اللون">@for(color of colors;track color){<button type="button" [class.active]="selectedColor===color" [attr.aria-pressed]="selectedColor===color" (click)="chooseColor(color)">{{color}}</button>}</div>@if(selectedColor){<div class="choices" aria-label="المقاس">@for(v of sizes;track v.id){<button type="button" [disabled]="!v.isAvailable||v.stockQuantity===0" [class.active]="selectedId===v.id" [attr.aria-pressed]="selectedId===v.id" (click)="choose(v)">{{v.size}}{{!v.isAvailable||v.stockQuantity===0?' — غير متاح':''}}</button>}</div>}<p>اختر اللون والمقاس المتاحين لإضافتهما للسلة.</p></section>}`,styles:[`.variants{padding:16px;border:1px solid var(--border-color,#ddd);border-radius:var(--radius-card,16px);margin:16px 0}h3{font-size:16px}.choices{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}button{min-height:44px;padding:8px 14px;border:1px solid var(--border-color,#ddd);border-radius:var(--radius-control,10px);background:var(--card-bg,#fff);color:var(--text-main,#123);font:inherit}.active{border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}button:disabled{opacity:.45}p{font-size:12px;color:var(--text-muted,#61758a)}`]})
export class VariantPickerComponent {
 @Input() variants:ProductVariant[]=[];
 @Output() selected=new EventEmitter<ProductVariant|null>();
 @Output() colorImages=new EventEmitter<string[]>();
 selectedColor='';selectedId='';
 ngOnChanges(){this.selectedColor='';this.selectedId='';}
 get colors(){return [...new Set(this.variants.map(v=>v.color))];}
 get sizes(){return this.variants.filter(v=>v.color===this.selectedColor);}
 chooseColor(color:string){this.selectedColor=color;this.selectedId='';this.selected.emit(null);this.colorImages.emit(this.sizes.find(v=>v.images?.length)?.images||[]);}
 choose(v:ProductVariant){if(!v.isAvailable||v.stockQuantity===0)return;this.selectedId=v.id;this.selected.emit(v);}
}
