import { ProductCommerceComponent } from '../../../shared/components/product-commerce/product-commerce.component';
import { MarketingPixelsService } from '../../../core/services/marketing-pixels.service';
import { ProductVariant } from '../../../core/models/models';
import { VariantPickerComponent } from '../../../shared/components/variant-picker/variant-picker.component';
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Product, PreparationOption, ModifierOption, ModifierGroup } from '../../../core/models/models';
import { CatalogService } from '../../../core/services/catalog.service';
import { CartService } from '../../../core/services/cart.service';
import { SettingsService } from '../../../core/services/settings.service';
import { LanguageService } from '../../../core/services/language.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { StoreDialogDirective } from '../../../shared/directives/store-dialog.directive';
import { ProductDetailModalComponent } from '../../../shared/components/product-detail-modal/product-detail-modal.component';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [ProductCommerceComponent,VariantPickerComponent,CommonModule, FormsModule, RouterModule, ImageUrlPipe, ProductCardComponent, ProductDetailModalComponent, StoreDialogDirective],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss'
})
export class ProductPageComponent implements OnInit, OnDestroy {
  private productRequest?: Subscription;
  private relatedRequest?: Subscription;
  private routeSubscription?: Subscription;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  readonly settingsService = inject(SettingsService);
  readonly languageService = inject(LanguageService);
  readonly wishlistService = inject(WishlistService);
  private readonly toast = inject(NotificationService);

  product = signal<Product | null>(null);
  relatedProducts = signal<Product[]>([]);
  selectedRelatedProduct = signal<Product | null>(null);
  isLoading = signal<boolean>(true);
  isSuccess = signal<boolean>(false);
  isCopied = signal<boolean>(false);

  // Entrance Animation State
  entranceAnimationActive = signal<boolean>(false);
  entranceAnimationDone = signal<boolean>(false);
  private hasAnimatedForProduct = false;

  get targetUnitPrice(): number {
    const p = this.product();
    if (!p) return 0;
    return (this.isWeighedProduct ? (p.pricePerKg || p.pricePerUnit) : this.variantPrice) || 0;
  }

  // Gallery
  activeImageIndex = 0;
  showImageViewer = signal(false);

  // Weighed items
  orderMode: 'pieces' | 'weight' = 'pieces';
  piecesCount: number = 1;
  customWeightGrams: number = 500;

  // Modifiers & Options
  selectedPrepOption: PreparationOption | null = null;
  selectedModifiersByGroup: { [groupId: number]: ModifierOption | null } = {};
  multiSelectedModifiers: ModifierOption[] = [];
  specialInstructions: string = '';
  collapsedGroups = signal<Record<string, boolean>>({});

  // Swipe gesture state
  touchStartX = 0;
  touchCurrentX = 0;

  get currencySymbol(): string {
    return this.languageService.currencySymbol;
  }

  get isWeighedProduct(): boolean {
    const p = this.product();
    if (!p) return false;
    return p.pricingType === 'ByWeight' || (p.pricingType as any) === 1 || (p.pricingType as any) === 'WeightedByKilo';
  }

  private readonly pixels=inject(MarketingPixelsService);
  booking:any=null;
  selectedVariant:ProductVariant|null=null;
  variantImages:string[]=[];
  get variantPrice(){return this.selectedVariant?.price ?? (this.product()?.variants?.length?Math.min(...this.product()!.variants!.map(v=>v.price??this.product()!.pricePerUnit)):this.product()?.pricePerUnit) ?? 0;}
  get galleryImages(): string[] {
    if(this.variantImages.length)return this.variantImages;
    const p = this.product();
    if (!p) return [];
    const list: string[] = [];
    if (p.images && p.images.length > 0) {
      const sorted = [...p.images].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.displayOrder - b.displayOrder;
      });
      for (const img of sorted) {
        if (img.imageUrl && !list.includes(img.imageUrl)) {
          list.push(img.imageUrl);
        }
      }
    } else {
      if (p.imageUrl) list.push(p.imageUrl);
      if (p.secondaryImageUrl) {
        const parts = p.secondaryImageUrl.split(';').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          if (!list.includes(part)) list.push(part);
        }
      }
    }
    if (list.length === 0) list.push('/assets/images/branding/product-placeholder.svg');
    return list;
  }

  get currentImageUrl(): string {
    const imgs = this.galleryImages;
    return imgs[this.activeImageIndex] || imgs[0];
  }

  nextImage() {
    const total = this.galleryImages.length;
    if (total > 1) {
      this.activeImageIndex = (this.activeImageIndex + 1) % total;
    }
  }

  prevImage() {
    const total = this.galleryImages.length;
    if (total > 1) {
      this.activeImageIndex = (this.activeImageIndex - 1 + total) % total;
    }
  }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX;
      this.touchCurrentX = this.touchStartX;
    }
  }

  onTouchMove(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.touchCurrentX = e.touches[0].clientX;
    }
  }

  onTouchEnd(event?: TouchEvent) {
    const deltaX = this.touchCurrentX - this.touchStartX;
    if (Math.abs(deltaX) > 35 && this.galleryImages.length > 1) {
      if (event?.cancelable) event.preventDefault();
      if (deltaX < -35) {
        this.nextImage();
      } else {
        this.prevImage();
      }
    }
  }

  get calculatedEstimatedWeightGrams(): number {
    const p = this.product();
    if (!p || p.pricingType !== 'ByWeight') return 0;
    if (this.orderMode === 'weight') return this.customWeightGrams;
    const avg = p.averageUnitWeightGrams || 500;
    return this.piecesCount * avg;
  }

  get calculatedEstimatedTotal(): number {
    const p = this.product();
    if (!p) return 0;

    let total = 0;
    if (this.isWeighedProduct) {
      const pricePerKg = p.pricePerKg || p.pricePerUnit;
      if (this.orderMode === 'weight') {
        total = (this.customWeightGrams / 1000) * pricePerKg;
      } else {
        const avg = p.averageUnitWeightGrams || 500;
        const totalWeightKg = (this.piecesCount * avg) / 1000;
        total = totalWeightKg * pricePerKg;
      }
    } else {
      total = this.piecesCount * this.variantPrice * (this.booking?.blocks||1);
    }

    const units = this.isWeighedProduct && this.orderMode === 'weight' ? Math.max(1, Math.round(this.customWeightGrams / (p.averageUnitWeightGrams || 500))) : this.piecesCount;
    if (this.selectedPrepOption) {
      total = this.selectedPrepOption.pricingType === 'FinalPrice' ? this.selectedPrepOption.price * units : total + this.selectedPrepOption.price * units;
    }

    for (const key of Object.keys(this.selectedModifiersByGroup)) {
      const opt = this.selectedModifiersByGroup[Number(key)];
      if (opt && opt.price) {
        total += opt.price * units;
      }
    }

    for (const opt of this.multiSelectedModifiers) {
      if (opt.price) {
        total += opt.price * units;
      }
    }

    return Math.round(total * 100) / 100;
  }

  get parsedKeySpecs(): { label: string; value: string; icon?: string }[] {
    const p = this.product();
    if (!p) return [];
    const items: { label: string; value: string; icon?: string }[] = [];

    if (p.brand) {
      items.push({ label: 'الماركة', value: p.brand, icon: 'bi-award-fill' });
    }

    if (p.specificationsJson) {
      try {
        const specs = JSON.parse(p.specificationsJson);
        const map: { [k: string]: { label: string; icon: string } } = {
          origin: { label: 'بلد المنشأ', icon: 'bi-geo-alt-fill' },
          origin_ar: { label: 'بلد المنشأ', icon: 'bi-geo-alt-fill' },
          weight: { label: 'الوزن / الحجم', icon: 'bi-speedometer' },
          size: { label: 'الحجم', icon: 'bi-box' },
          storage: { label: 'طريقة الحفظ', icon: 'bi-thermometer-half' },
          calories: { label: 'السعرات', icon: 'bi-fire' },
          ingredients: { label: 'المكونات', icon: 'bi-list-ul' },
          flavor: { label: 'النكهة', icon: 'bi-stars' }
        };
        for (const [k, meta] of Object.entries(map)) {
          if (specs[k] && !items.some(i => i.label === meta.label)) {
            items.push({ label: meta.label, value: String(specs[k]), icon: meta.icon });
          }
        }
      } catch {}
    }
    return items;
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (Number.isInteger(id) && id > 0) {
        this.loadProduct(id);
      } else { this.product.set(null); this.isLoading.set(false); }
    });
  }

  loadProduct(id: number): void {
    this.productRequest?.unsubscribe(); this.relatedRequest?.unsubscribe();
    this.product.set(null); this.relatedProducts.set([]);
    this.isLoading.set(true);
    this.showImageViewer.set(false);
    this.activeImageIndex = 0;
    this.selectedVariant=null;this.variantImages=[];this.booking=null;this.selectedPrepOption=null;this.selectedModifiersByGroup={};this.multiSelectedModifiers=[];this.specialInstructions='';this.collapsedGroups.set({});
    this.piecesCount = 1;
    this.productRequest = this.catalogService.getProductById(id).subscribe({
      next: prod => {
        this.product.set(prod);
        if(prod)this.pixels.track('ViewContent',{ids:[String(prod.id)],value:this.variantPrice});
        if (!prod) { this.isLoading.set(false); return; }
        this.initProductState(prod);
        this.isLoading.set(false);
        this.loadRelated(prod);
        this.initEntranceAnimation();
      },
      error: () => {
        this.product.set(null);
        this.isLoading.set(false);
        this.toast.error('لم نتمكن من العثور على الصنف المطلوب');
      }
    });
  }

  private initEntranceAnimation(): void {
    const allowAnimations = this.settingsService.settings().storeLayout?.enableProductPageAnimations !== false;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isBackNav = typeof window !== 'undefined' && (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type === 'back_forward';

    if (allowAnimations && !prefersReduced && !isBackNav && !this.hasAnimatedForProduct) {
      this.hasAnimatedForProduct = true;
      this.entranceAnimationActive.set(true);
      this.entranceAnimationDone.set(false);
      setTimeout(() => {
        this.entranceAnimationActive.set(false);
        this.entranceAnimationDone.set(true);
      }, 2500);
    } else {
      this.entranceAnimationActive.set(false);
      this.entranceAnimationDone.set(true);
    }
  }

  private initProductState(p: Product): void {
    if (this.isWeighedProduct) {
      if (p.allowOrderByPieces && !p.allowOrderByWeight) {
        this.orderMode = 'pieces';
      } else if (!p.allowOrderByPieces && p.allowOrderByWeight) {
        this.orderMode = 'weight';
      } else {
        this.orderMode = 'pieces';
      }
      this.customWeightGrams = p.averageUnitWeightGrams || 500;
    }

    if (p.preparationGroups && p.preparationGroups.length > 0) {
      const g = p.preparationGroups[0];
      if (g.options && g.options.length > 0) {
        this.selectedPrepOption = g.options[0];
      }
    }
  }

  private loadRelated(p: Product): void {
    if (p.categoryId) {
      this.relatedRequest = this.catalogService.getProducts({ categoryId: p.categoryId, pageSize: 6 }).subscribe({
        next: res => {
          const list = (res.items || []).filter(item => item.id !== p.id).slice(0, 4);
          this.relatedProducts.set(list);
        }, error: () => this.relatedProducts.set([])
      });
    }
  }

  setOrderMode(mode: 'pieces' | 'weight') {
    this.orderMode = mode;
  }

  changePieces(delta: number) {
    const c=this.product()?.commerce;if(delta>0&&(c?.mode==='Subscription'||c?.mode==='Digital'&&c.digitalDelivery!=='Code'))return;
    const next = this.piecesCount + delta;
    if (next >= 1) this.piecesCount = next;
  }

  changeWeight(delta: number) {
    const next = this.customWeightGrams + delta;
    if (next >= 250) this.customWeightGrams = next;
  }

  selectPrep(opt: PreparationOption) {
    this.selectedPrepOption = opt;
  }

  selectSingleModifier(groupId: number, opt: ModifierOption) {
    if (this.selectedModifiersByGroup[groupId]?.id === opt.id) {
      this.selectedModifiersByGroup[groupId] = null;
    } else {
      this.selectedModifiersByGroup[groupId] = opt;
    }
  }

  modifierSelected(group:ModifierGroup,opt:ModifierOption){return this.selectedModifiersByGroup[group.id]?.id===opt.id||this.multiSelectedModifiers.some(m=>m.id===opt.id);}
  toggleModifier(group:ModifierGroup,opt:ModifierOption){
    if(!opt.isAvailable)return;
    if(group.maxSelection===1){this.selectSingleModifier(group.id,opt);return;}
    const index=this.multiSelectedModifiers.findIndex(m=>m.id===opt.id);
    if(index>=0){this.multiSelectedModifiers.splice(index,1);return;}
    const count=this.multiSelectedModifiers.filter(m=>group.options.some(o=>o.id===m.id)).length;
    if(count>=group.maxSelection){this.toast.info('الحد الأقصى لهذه المجموعة '+group.maxSelection);return;}
    this.multiSelectedModifiers.push(opt);
  }
  isGroupExpanded(groupKey: string, defaultExpanded: boolean): boolean {
    const state = this.collapsedGroups();
    if (state[groupKey] !== undefined) {
      return state[groupKey];
    }
    return defaultExpanded;
  }

  toggleGroupExpanded(groupKey: string, defaultExpanded: boolean): void {
    const currentlyExpanded = this.isGroupExpanded(groupKey, defaultExpanded);
    this.collapsedGroups.update(map => ({
      ...map,
      [groupKey]: !currentlyExpanded
    }));
  }

  isPrepGroupExpanded(grpId: number, index: number): boolean {
    return this.isGroupExpanded('prep-' + grpId, index === 0);
  }

  togglePrepGroup(grpId: number, index: number): void {
    this.toggleGroupExpanded('prep-' + grpId, index === 0);
  }

  isModGroupExpanded(modId: number, index: number): boolean {
    const defaultOpen = (this.product()?.preparationGroups?.length || 0) + index === 0;
    return this.isGroupExpanded('mod-' + modId, defaultOpen);
  }

  toggleModGroup(modId: number, index: number): void {
    const defaultOpen = (this.product()?.preparationGroups?.length || 0) + index === 0;
    this.toggleGroupExpanded('mod-' + modId, defaultOpen);
  }

  getSelectedCountForGroup(group: ModifierGroup): number {
    if (group.maxSelection === 1) {
      return this.selectedModifiersByGroup[group.id] ? 1 : 0;
    }
    return this.multiSelectedModifiers.filter(m => group.options?.some(o => o.id === m.id)).length;
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    const res = this.wishlistService.toggle(p.id);
    if (res === 'added') {
      this.toast.success('تمت إضافة الصنف للمفضلة ❤️');
    } else {
      this.toast.info('تمت إزالة الصنف من المفضلة');
    }
  }

  onShareProduct(): void {
    const p = this.product();
    if (!p) return;
    const url = window.location.href;
    const shareData = {
      title: p.nameAr,
      text: `${p.nameAr} - متوفر الآن على متجرنا!`,
      url: url
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.isCopied.set(true);
        this.toast.success('تم نسخ رابط الصنف إلى الحافظة بنجاح!');
        setTimeout(() => this.isCopied.set(false), 2500);
      });
    }
  }

  async onAddToCart(event?: MouseEvent) {
    const p = this.product();
    if (!p) return;
    if(p.commerce?.mode==='Vehicle'){this.toast.info('استخدم نموذج طلب المعاينة أو العرض.');return;}
    if(p.commerce?.mode==='Booking'&&!this.booking){this.toast.error('اختر موعدًا متاحًا أولًا.');return;}
    if(p.variants?.length&&!this.selectedVariant){
      const hasSizes = p.variants.some(v => !!v.size?.trim());
      this.toast.error(hasSizes ? 'اختر اللون والمقاس أولاً.' : 'اختر اللون أولاً.');
      return;
    }

    for(const group of p.modifierGroups||[]){const count=group.options.filter(o=>this.modifierSelected(group,o)).length;if(count<(group.isRequired?Math.max(1,group.minSelection):group.minSelection)||count>group.maxSelection){this.toast.error('راجع اختيارات '+group.nameAr);return;}}
    if(p.preparationGroups?.some(g=>g.isRequired&&!g.options.some(o=>o.id===this.selectedPrepOption?.id))){this.toast.error('اختر طريقة التجهيز المطلوبة');return;}

    // Launch flying dot
    this.launchFlyingCartDot(event);

    const mods: ModifierOption[] = [...this.multiSelectedModifiers];
    for (const key of Object.keys(this.selectedModifiersByGroup)) {
      const opt = this.selectedModifiersByGroup[Number(key)];
      if (opt && !mods.some(m => m.id === opt.id)) mods.push(opt);
    }

    const qty = this.isWeighedProduct && this.orderMode === 'weight' ? Math.max(1, Math.round(this.customWeightGrams / (p.averageUnitWeightGrams || 500))) : this.piecesCount;
    const customGrams = this.isWeighedProduct ? this.calculatedEstimatedWeightGrams : undefined;

    const added = await this.cartService.addItem(
      p,
      qty,
      this.selectedPrepOption ?? undefined,
      mods,
      customGrams,
      this.specialInstructions,
      this.isWeighedProduct ? this.orderMode : 'pieces',
      undefined, this.selectedVariant ?? undefined, this.booking ?? undefined
    );

    if (!added) {
      this.isSuccess.set(false);
      return;
    }

    this.isSuccess.set(true);
    this.toast.success(`تمت إضافة "${p.nameAr}" إلى السلة 🛒`);

    setTimeout(() => {
      this.isSuccess.set(false);
    }, 1200);
  }

  private launchFlyingCartDot(event?: MouseEvent): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.popCartBadges();
      return;
    }

    const btn = (event?.currentTarget as HTMLElement) || document.querySelector('.btn-add-to-cart');
    const isMobile = window.innerWidth <= 767;
    let cartTarget = isMobile
      ? document.querySelector('.store-bottom-nav .cart-icon, .store-bottom-nav button')
      : document.querySelector('.cart-trigger-btn .cart-icon-wrapper, .cart-trigger-btn');
    if (!cartTarget) {
      cartTarget = document.querySelector('.cart-trigger-btn, .cart-icon');
    }
    if (!btn || !cartTarget) {
      this.popCartBadges();
      return;
    }

    const btnRect = btn.getBoundingClientRect();
    const cartRect = cartTarget.getBoundingClientRect();

    const startX = btnRect.left + btnRect.width / 2;
    const startY = btnRect.top + btnRect.height / 2;
    const targetX = cartRect.left + cartRect.width / 2;
    const targetY = cartRect.top + cartRect.height / 2;

    const dx = targetX - startX;
    const dy = targetY - startY;

    // Outer wrapper translates horizontally
    const wrap = document.createElement('div');
    wrap.className = 'flying-cart-dot-wrap';
    wrap.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      width: 18px;
      height: 18px;
      margin-left: -9px;
      margin-top: -9px;
      z-index: 999999;
      pointer-events: none;
      transition: transform 750ms linear;
    `;

    // Inner dot translates vertically with curved arc
    const dot = document.createElement('div');
    dot.className = 'flying-cart-dot';
    const btnStyle = window.getComputedStyle(btn);
    const dotBg = btnStyle.backgroundColor || '#6b4f3a';
    dot.style.cssText = `
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background-color: ${dotBg};
      border: 2px solid #ffffff;
      box-shadow: 0 4px 14px rgba(107, 79, 58, 0.45);
      transition: transform 750ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 750ms ease;
    `;

    wrap.appendChild(dot);
    document.body.appendChild(wrap);

    void wrap.offsetWidth;

    wrap.style.transform = `translateX(${dx}px)`;
    dot.style.transform = `translateY(${dy}px) scale(0.45)`;
    dot.style.opacity = '0.7';

    setTimeout(() => {
      wrap.remove();
      this.popCartBadges();
    }, 750);
  }

  private popCartBadges(): void {
    if (typeof document === 'undefined') return;
    const badges = document.querySelectorAll('.cart-badge, .store-bottom-nav .cart-icon b');
    badges.forEach(badge => {
      badge.classList.remove('cart-badge-pop');
      void (badge as HTMLElement).offsetWidth;
      badge.classList.add('cart-badge-pop');
      setTimeout(() => badge.classList.remove('cart-badge-pop'), 450);
    });
  }

  openRelatedProduct(product: Product): void {
    if (this.settingsService.settings()?.productDetailViewMode === 'page') {
      this.router.navigate(['/product', product.id]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.selectedRelatedProduct.set(product);
    }
  }

  ngOnDestroy() {
    this.productRequest?.unsubscribe();
    this.relatedRequest?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/menu']);
    }
  }
}
