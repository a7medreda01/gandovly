import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductVariant } from '../../../core/models/models';
@Component({selector:'app-variant-picker',standalone:true,imports:[CommonModule],template:`@if(variants.length){<section class="variants"><h3>اللون</h3><div class="choices" aria-label="اللون">@for(color of colors;track color){<button type="button" [class.active]="selectedColor===color" [attr.aria-pressed]="selectedColor===color" (click)="chooseColor(color)"><span class="color-swatch" [style.background-color]="colorHex(color)"></span>{{color}}</button>}</div>@if(selectedColor){<h3>المقاس</h3><div class="choices" aria-label="المقاس">@for(v of sizes;track v.id){<button type="button" [disabled]="!v.isAvailable||v.stockQuantity===0" [class.active]="selectedId===v.id" [attr.aria-pressed]="selectedId===v.id" (click)="choose(v)">{{v.size}}{{!v.isAvailable||v.stockQuantity===0?' — غير متاح':''}}</button>}</div>}<p>اختر اللون والمقاس المتاحين لإضافتهما للسلة.</p></section>}`,styles:[`:host{display:block;width:100%;min-width:0}.color-swatch{display:inline-block;width:20px;height:20px;border-radius:50%;border:1px solid #0003;background:#eee;margin-inline-end:8px;vertical-align:middle}.variants{text-align:start;padding:14px;border:1px solid var(--border-color,#ddd);border-radius:var(--radius-card,16px);margin:10px 0}h3{font-size:13px;margin:0}.choices{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}button{min-height:44px;padding:8px 14px;border:1px solid var(--border-color,#ddd);border-radius:var(--radius-control,10px);background:var(--card-bg,#fff);color:var(--text-main,#123);font:inherit}.active{border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color)}button:disabled{opacity:.45}p{font-size:12px;color:var(--text-muted,#61758a)}`]})
export class VariantPickerComponent {
 @Input() variants:ProductVariant[]=[];
 @Output() selected=new EventEmitter<ProductVariant|null>();
 @Output() colorImages=new EventEmitter<string[]>();
 selectedColor='';selectedId='';
 ngOnChanges(){this.selectedColor='';this.selectedId='';}
 colorHex(name:string){return this.variants.find(v=>v.color===name)?.colorHex || ({'أسود':'#171717','اسود':'#171717','أبيض':'#ffffff','ابيض':'#ffffff','بيج':'#d9c6a5','رمادي':'#808080'} as Record<string,string>)[name] || null;}
 get colors(){return [...new Set(this.variants.map(v=>v.color))];}
 get sizes(){return this.variants.filter(v=>(v.colorId||v.color)===(this.variants.find(c=>c.color===this.selectedColor)?.colorId||this.selectedColor));}
 chooseColor(color:string){this.selectedColor=color;this.selectedId='';this.selected.emit(null);this.colorImages.emit(this.sizes.find(v=>v.images?.length)?.images||[]);}
 choose(v:ProductVariant){if(!v.isAvailable||v.stockQuantity===0)return;this.selectedId=v.id;this.selected.emit(v);}
}
