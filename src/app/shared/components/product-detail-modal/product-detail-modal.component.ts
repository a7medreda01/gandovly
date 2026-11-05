import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModifierGroup, ModifierOption, PreparationOption, Product } from '../../../core/models/models';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { LanguageService } from '../../../core/services/language.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { StoreDialogDirective } from '../../directives/store-dialog.directive';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUrlPipe, StoreDialogDirective],
  templateUrl: './product-detail-modal.component.html',
  styleUrl: './product-detail-modal.component.scss'
})
export class ProductDetailModalComponent implements OnInit {
  @Input({ required: true }) product!: Product;
  @Output() closeModal = new EventEmitter<void>();

  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly toast = inject(NotificationService);
  readonly settingsService = inject(SettingsService);
  readonly wishlistService = inject(WishlistService);
  readonly languageService = inject(LanguageService);

  openFullPage(): void {
    this.dismissModal();
    this.router.navigate(['/product', this.product.id]);
  }

  toggleWishlist(event: Event): void {
    event.stopPropagation();
    const res = this.wishlistService.toggle(this.product.id);
    if (res === 'added') {
      this.toast.success('تمت إضافة الصنف للمفضلة ❤️');
    } else {
      this.toast.info('تمت إزالة الصنف من المفضلة');
    }
  }

  get currencySymbol(): string {
    return this.settingsService.settings()?.currencySymbol || 'ج.م';
  }

  // Order mode for weighed items: 'pieces' or 'weight'
  orderMode: 'pieces' | 'weight' = 'pieces';
  piecesCount: number = 1;
  customWeightGrams: number = 500;

  selectedPrepOption: PreparationOption | null = null;
  selectedModifiersByGroup: { [groupId: number]: ModifierOption | null } = {};
  multiSelectedModifiers: ModifierOption[] = [];
  specialInstructions: string = '';
  activeImageIndex: number = 0;
  showSpecsModal: boolean = false;

  get previewDescription(): string {
    if (!this.product.description) return '';
    let text = this.product.description
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length > 220) {
      const cut = text.substring(0, 220);
      const lastSpace = cut.lastIndexOf(' ');
      return (lastSpace > 160 ? cut.substring(0, lastSpace) : cut) + '...';
    }
    return text;
  }

  get parsedKeySpecs(): { label: string; value: string; fullValue?: string; icon?: string }[] {
    const items: { label: string; value: string; fullValue?: string; icon?: string }[] = [];

    // 1. Parse structured specificationsJson if available (Carrefour / seeded products)
    let specsObj: { [key: string]: any } | null = null;
    if (this.product.specificationsJson) {
      try {
        specsObj = JSON.parse(this.product.specificationsJson);
      } catch { specsObj = null; }
    }

    if (specsObj) {
      const specMap: { [key: string]: { label: string; icon: string } } = {
        brand: { label: 'الماركة', icon: 'bi-award-fill' },
        brand_ar: { label: 'الماركة', icon: 'bi-award-fill' },
        origin: { label: 'بلد المنشأ', icon: 'bi-geo-alt-fill' },
        origin_ar: { label: 'بلد المنشأ', icon: 'bi-geo-alt-fill' },
        weight: { label: 'الوزن / الحجم', icon: 'bi-speedometer' },
        weight_ar: { label: 'الوزن / الحجم', icon: 'bi-speedometer' },
        size: { label: 'الحجم / الكمية', icon: 'bi-box' },
        size_ar: { label: 'الحجم / الكمية', icon: 'bi-box' },
        unitSize: { label: 'حجم الوحدة', icon: 'bi-box' },
        originCountry: { label: 'بلد المنشأ', icon: 'bi-geo-alt-fill' },
        storageType: { label: 'طريقة التخزين', icon: 'bi-thermometer-half' },
        storage: { label: 'طريقة التخزين', icon: 'bi-thermometer-half' },
        caloriesper100g: { label: 'السعرات لكل 100 جرام', icon: 'bi-fire' },
        calories: { label: 'السعرات الحرارية', icon: 'bi-fire' },
        ingredients: { label: 'المكونات الرئيسية', icon: 'bi-list-ul' },
        ingredients_ar: { label: 'المكونات', icon: 'bi-list-ul' },
        category: { label: 'التصنيف', icon: 'bi-tag-fill' },
        type: { label: 'النوع', icon: 'bi-grid-fill' },
        flavor: { label: 'النكهة', icon: 'bi-stars' },
        flavor_ar: { label: 'النكهة', icon: 'bi-stars' },
        packSize: { label: 'عبوة / عدد القطع', icon: 'bi-stack' },
        sku: { label: 'الرقم المرجعي', icon: 'bi-upc' },
        barcode: { label: 'الباركود', icon: 'bi-upc-scan' },
      };

      const addedLabels = new Set<string>();
      for (const [key, meta] of Object.entries(specMap)) {
        // skip _ar duplicate if non-ar base key already exists in object
        if (key.endsWith('_ar')) {
          const base = key.replace('_ar', '');
          if (specsObj[base]) continue;
        }
        const val = specsObj[key];
        if (val !== undefined && val !== null && String(val).trim() && !addedLabels.has(meta.label)) {
          items.push({ label: meta.label, value: String(val).trim(), icon: meta.icon });
          addedLabels.add(meta.label);
        }
        if (items.length >= 6) break;
      }
    }

    // Also add brand from product model if not in specs
    if (this.product.brand && !items.some(i => i.label === 'الماركة')) {
      items.unshift({ label: 'الماركة', value: this.product.brand, icon: 'bi-award-fill' });
    }

    // 2. Fallback: parse from description text (rich text products)
    if (items.length === 0 && this.product.description) {
      const text = this.product.description.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

      const capM = text.match(/(?:[-–—•\s]|^)السعة\s*:\s*([^-\n•]+?)(?=\s*(?:[-–—•\s]*(?:النوع|الأبعاد|الوزن|الصناعة|تصنيف|الاسعار|الأسعار))|$)/i);
      if (capM && capM[1].trim()) items.push({ label: 'السعة والنوع', value: capM[1].trim(), icon: 'bi-droplet-half' });

      const dimM = text.match(/(?:[-–—•\s]|^)الأبعاد\s*:\s*([^•]+?)(?=\s*(?:[-–—•\s]*(?:الوزن|الصناعة|تصنيف|الاسعار|الأسعار|ما هو))|$)/i);
      if (dimM && dimM[1].trim()) {
        const cleanDim = dimM[1].replace(/^-+\s*|-+\s*$/g, '').trim();
        items.push({ label: 'الأبعاد والمقاسات', value: cleanDim, icon: 'bi-aspect-ratio' });
      }

      const wM = text.match(/(?:[-–—•\s]|^)الوزن\s*:\s*([^-\n•]+?)(?=\s*(?:[-–—•\s]*(?:الصناعة|تصنيف|الاسعار|الأسعار|الأبعاد|ما هو))|$)/i);
      if (wM && wM[1].trim()) items.push({ label: 'الوزن التقريبي', value: wM[1].trim(), icon: 'bi-speedometer' });

      const orgM = text.match(/(?:[-–—•\s]|^)الصناعة\s*:\s*([^-\n•]+?)(?=\s*(?:[-–—•\s]*(?:الاسعار|الأسعار|ما هو|الضمان))|$)/i);
      if (orgM && orgM[1].trim()) {
        const cleanOrg = orgM[1].trim();
        items.push({ label: 'بلد الصنع', value: cleanOrg, icon: 'bi-patch-check-fill' });
      }
    }

    return items;
  }

  get truncatedOverviewText(): string {
    if (!this.product.description) return '';
    const text = this.product.description;
    if (text.length <= 135) return text;
    return text.substring(0, 130) + '...';
  }

  openSpecsModal(event?: Event) {
    if (event) event.stopPropagation();
    this.showSpecsModal = true;
  }

  closeSpecsModal(event?: Event) {
    if (event) event.stopPropagation();
    this.showSpecsModal = false;
  }

  ngOnInit() {
    // Default preparation selection
    if (this.product.preparationGroups && this.product.preparationGroups.length > 0) {
      const firstGroup = this.product.preparationGroups[0];
      if (firstGroup.options && firstGroup.options.length > 0) {
        this.selectedPrepOption = firstGroup.options[0];
      }
    }

    // Initialize modifier groups
    if (this.product.modifierGroups && this.product.modifierGroups.length > 0) {
      for (const grp of this.product.modifierGroups) {
        if (grp.maxSelection === 1 || grp.isRequired) {
          this.selectedModifiersByGroup[grp.id] = null;
        }
      }
    }

    if (this.isWeighedProduct) {
      if (this.product.allowOrderByPieces && !this.product.allowOrderByWeight) {
        this.orderMode = 'pieces';
      } else if (!this.product.allowOrderByPieces && this.product.allowOrderByWeight) {
        this.orderMode = 'weight';
      } else if (!this.product.allowOrderByPieces) {
        this.orderMode = 'weight';
      } else {
        // Both are allowed: default to pieces
        this.orderMode = 'pieces';
      }

      const avg = this.product.averageUnitWeightGrams || 500;
      this.customWeightGrams = avg;
    }
  }

  get isWeighedProduct(): boolean {
    return this.product.pricingType === 'ByWeight' || (this.product.pricingType as any) === 1 || (this.product.pricingType as any) === 'WeightedByKilo';
  }

  get galleryImages(): string[] {
    const list: string[] = [];
    if (this.product.images && this.product.images.length > 0) {
      const sorted = [...this.product.images].sort((a, b) => {
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
      if (this.product.imageUrl) list.push(this.product.imageUrl);
      if (this.product.secondaryImageUrl) {
        const parts = this.product.secondaryImageUrl.split(';').map(s => s.trim()).filter(Boolean);
        for (const part of parts) {
          if (!list.includes(part)) {
            list.push(part);
          }
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

  nextImage(e?: Event) {
    if (e) e.stopPropagation();
    const total = this.galleryImages.length;
    if (total > 1) {
      this.activeImageIndex = (this.activeImageIndex + 1) % total;
    }
  }

  prevImage(e?: Event) {
    if (e) e.stopPropagation();
    const total = this.galleryImages.length;
    if (total > 1) {
      this.activeImageIndex = (this.activeImageIndex - 1 + total) % total;
    }
  }

  get calculatedEstimatedWeightGrams(): number {
    if (this.product.pricingType !== 'ByWeight') return 0;
    if (this.orderMode === 'weight') return this.customWeightGrams;
    const avg = this.product.averageUnitWeightGrams || 500;
    return this.piecesCount * avg;
  }

  get allSelectedModifiers(): ModifierOption[] {
    const list: ModifierOption[] = [...this.multiSelectedModifiers];
    for (const key of Object.keys(this.selectedModifiersByGroup)) {
      const opt = this.selectedModifiersByGroup[Number(key)];
      if (opt && !list.some(m => m.id === opt.id)) {
        list.push(opt);
      }
    }

    // Smart pipe extension modifier if selected
    if (this.selectedPipeType !== 'none') {
      const pGroup = this.pipeGroup;
      const rate = this.selectedPipeRate;
      const typeLabel = this.selectedPipeType === 'install_only' 
        ? 'تمديد وتركيب فقط' 
        : 'توريد وتركيب شامل المواسير';

      let optId = 99901;
      if (pGroup && pGroup.options) {
        const found = pGroup.options.find(o => 
          this.selectedPipeType === 'install_only' 
            ? (o.nameAr.includes('تركيب فقط') || o.price === 25)
            : (o.nameAr.includes('توريد وتركيب') || o.price === 85)
        );
        if (found) optId = found.id;
      }

      const pipeMod: ModifierOption = {
        id: optId,
        groupId: pGroup?.id ?? 999,
        nameAr: `خدمة إضافية: ${typeLabel} (${this.pipeMeters} وحدة × ${rate} = ${this.pipeTotalCost})`,
        price: this.pipeTotalCost,
        isAvailable: true,
        displayOrder: 99
      };

      list.push(pipeMod);
    }

    return list;
  }

  get calculatedEstimatedTotal(): number {
    let total = 0;

    if (this.product.pricingType === 'ByWeight') {
      const pricePerKg = this.product.pricePerKg || this.product.pricePerUnit;
      const weightInKg = this.calculatedEstimatedWeightGrams / 1000;
      total = weightInKg * pricePerKg;

      const units = this.orderMode === 'pieces' ? this.piecesCount : Math.max(1, Math.round(this.customWeightGrams / (this.product.averageUnitWeightGrams || 500)));

      if (this.selectedPrepOption) {
        if (this.selectedPrepOption.pricingType === 'FinalPrice') {
          total = this.selectedPrepOption.price * units;
        } else {
          total += this.selectedPrepOption.price * units;
        }
      }

      const mods = this.allSelectedModifiers;
      if (mods.length > 0) {
        const modSum = mods.reduce((acc, m) => acc + m.price, 0);
        total += modSum * units;
      }
    } else {
      total = this.product.pricePerUnit * this.piecesCount;

      if (this.selectedPrepOption) {
        if (this.selectedPrepOption.pricingType === 'FinalPrice') {
          total = this.selectedPrepOption.price * this.piecesCount;
        } else {
          total += this.selectedPrepOption.price * this.piecesCount;
        }
      }

      const mods = this.allSelectedModifiers;
      if (mods.length > 0) {
        const modSum = mods.reduce((acc, m) => acc + m.price, 0);
        total += modSum * this.piecesCount;
      }
    }

    return Math.round(total * 100) / 100;
  }

  setOrderMode(mode: 'pieces' | 'weight') {
    this.orderMode = mode;
  }

  changePieces(delta: number) {
    const next = this.piecesCount + delta;
    if (next >= 1 && next <= 50) {
      this.piecesCount = next;
    }
  }

  changeWeight(deltaGrams: number) {
    const next = this.customWeightGrams + deltaGrams;
    if (next >= 250 && next <= 20000) {
      this.customWeightGrams = next;
    }
  }

  selectPrep(option: PreparationOption) {
    this.selectedPrepOption = option;
  }

  get selectedActivityName(): string | null {
    for (const key of Object.keys(this.selectedModifiersByGroup)) {
      const opt = this.selectedModifiersByGroup[Number(key)];
      if (opt && (opt.nameAr === 'سكني' || opt.nameAr === 'تجاري')) {
        return opt.nameAr;
      }
    }
    return null;
  }

  // --- Smart Pipe Extension Network (Meters Counter) ---
  selectedPipeType: 'none' | 'install_only' | 'supply_and_install' = 'none';
  pipeMeters: number = 20;

  isPipeGroup(group: ModifierGroup): boolean {
    return group.nameAr.includes('مواسير') || group.nameAr.includes('تمديد شبكة');
  }

  get pipeGroup(): ModifierGroup | undefined {
    return this.product.modifierGroups?.find(g => this.isPipeGroup(g));
  }

  get isTank(): boolean {
    return false;
  }

  get selectedPipeRate(): number {
    if (this.selectedPipeType === 'install_only') return 25;
    if (this.selectedPipeType === 'supply_and_install') return 85;
    return 0;
  }

  get pipeTotalCost(): number {
    if (this.selectedPipeType === 'none') return 0;
    return this.pipeMeters * this.selectedPipeRate;
  }

  selectPipeType(type: 'none' | 'install_only' | 'supply_and_install') {
    this.selectedPipeType = type;
    if (type !== 'none' && this.pipeMeters < 20) {
      this.pipeMeters = 20;
    }
  }

  changePipeMeters(delta: number) {
    const next = this.pipeMeters + delta;
    if (next >= 20 && next <= 1000) {
      this.pipeMeters = next;
    }
  }

  setPipeMeters(meters: number) {
    if (meters >= 20) {
      this.pipeMeters = meters;
    }
  }

  onPipeMetersManualChange(val: any) {
    const num = Number(val);
    if (!isNaN(num) && num >= 20) {
      this.pipeMeters = Math.min(1000, num);
    }
  }

  onPipeMetersBlur() {
    if (!this.pipeMeters || this.pipeMeters < 20) {
      this.pipeMeters = 20;
    }
  }

  isGroupVisible(group: ModifierGroup): boolean {
    if (this.isPipeGroup(group)) {
      return false; // Handled by dedicated smart pipes component
    }
    if (group.nameAr.includes('منظم أو بدون')) {
      return !!this.selectedActivityName;
    }
    return true;
  }

  getFilteredGroupOptions(group: ModifierGroup): ModifierOption[] {
    if (!group.options) return [];
    if (group.nameAr.includes('منظم أو بدون')) {
      const activity = this.selectedActivityName;
      if (activity === 'سكني') {
        return group.options.filter(o => o.nameAr === 'بدون' || o.nameAr.includes('سكني') || (!o.nameAr.includes('ضغط عالي') && !o.nameAr.includes('تجاري')));
      } else if (activity === 'تجاري') {
        return group.options.filter(o => o.nameAr === 'بدون' || o.nameAr.includes('ضغط عالي') || o.nameAr.includes('تجاري'));
      }
    }
    return group.options;
  }

  onSingleModifierChange(group: ModifierGroup, optionIdVal: any) {
    if (optionIdVal === null || optionIdVal === undefined || optionIdVal === 'null') {
      this.selectedModifiersByGroup[group.id] = null;
      if (group.nameAr.includes('نوع النشاط')) {
        this.resetRegulatorSelection(false);
      }
      return;
    }
    const optionId = Number(optionIdVal);
    const found = group.options?.find(o => o.id === optionId) || null;
    this.selectedModifiersByGroup[group.id] = found;

    if (group.nameAr.includes('نوع النشاط')) {
      this.resetRegulatorSelection(true);
    }
  }

  private resetRegulatorSelection(selectDefaultBedoon = false) {
    if (!this.product.modifierGroups) return;
    const regGroup = this.product.modifierGroups.find(g => g.nameAr.includes('منظم أو بدون'));
    if (regGroup) {
      if (selectDefaultBedoon) {
        const bedoon = regGroup.options?.find(o => o.nameAr === 'بدون') || null;
        this.selectedModifiersByGroup[regGroup.id] = bedoon;
      } else {
        this.selectedModifiersByGroup[regGroup.id] = null;
      }
    }
  }

  toggleMultiModifier(mod: ModifierOption) {
    const exists = this.multiSelectedModifiers.some(m => m.id === mod.id);
    if (exists) {
      this.multiSelectedModifiers = this.multiSelectedModifiers.filter(m => m.id !== mod.id);
    } else {
      this.multiSelectedModifiers = [...this.multiSelectedModifiers, mod];
    }
  }

  isMultiModifierSelected(modId: number): boolean {
    return this.multiSelectedModifiers.some(m => m.id === modId);
  }

  isSuccess = false;

  onAddToCart() {
    // Validate required modifier groups
    if (this.product.modifierGroups) {
      for (const grp of this.product.modifierGroups) {
        if (!this.isGroupVisible(grp)) continue;
        if (grp.isRequired && (grp.maxSelection === 1 || grp.minSelection >= 1)) {
          if (!this.selectedModifiersByGroup[grp.id]) {
            this.toast.error(`يرجى تحديد (${grp.nameAr}) للمتابعة`);
            return;
          }
        }
      }
    }

    if (this.isSuccess) return;
    this.isSuccess = true;

    const qty = this.orderMode === 'pieces'
      ? this.piecesCount
      : Math.max(1, Math.round(this.customWeightGrams / (this.product.averageUnitWeightGrams || 500)));

    const customGrams = this.orderMode === 'weight'
      ? this.customWeightGrams
      : (this.product.pricingType === 'ByWeight' ? this.piecesCount * (this.product.averageUnitWeightGrams || 500) : undefined);

    this.cartService.addItem(
      this.product,
      qty,
      this.selectedPrepOption ?? undefined,
      this.allSelectedModifiers,
      customGrams,
      this.specialInstructions,
      this.orderMode,
      this.selectedPipeType !== 'none' ? this.pipeMeters : undefined
    );

    this.toast.success(
      'تمت الإضافة إلى السلة بنجاح',
      'عرض السلة',
      () => this.cartService.openDrawer()
    );

    setTimeout(() => {
      this.dismissModal();
    }, 350);
  }

  isCopied = false;
  private copyTimeout: any;

  async onShareProduct(event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (typeof window === 'undefined') return;

    const productUrl = new URL('/product/' + this.product.id, window.location.origin);
    const tenant = new URLSearchParams(window.location.search).get('tenant');
    if (tenant) productUrl.searchParams.set('tenant', tenant);
    const shareUrl = productUrl.href;
    const storeName = this.settingsService.settings().restaurantName || 'منصة التجارة';
    const shareTitle = `${this.product.nameAr} - ${storeName}`;
    const shareText = `شاهد تفاصيل ومواصفات (${this.product.nameAr}) من ${storeName} 🛒`;

    // Native Web Share API (Pass text without url so apps like WhatsApp won't duplicate the URL)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        this.triggerCopiedState();
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback: Clipboard copy (include URL here so paste has full text + link)
    const clipboardText = `${shareText}\n${shareUrl}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(clipboardText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = clipboardText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      this.triggerCopiedState();
      this.toast.success('تم نسخ الرابط بنجاح! 📋');
    } catch {
      this.toast.info(`رابط الصنف: ${shareUrl}`);
    }
  }

  private triggerCopiedState() {
    this.isCopied = true;
    if (this.copyTimeout) clearTimeout(this.copyTimeout);
    this.copyTimeout = setTimeout(() => {
      this.isCopied = false;
    }, 2500);
  }

  // ===== TOUCH GESTURES (SWIPE BETWEEN IMAGES + SWIPE DOWN TO DISMISS) =====
  touchStartX = 0;
  touchCurrentX = 0;
  touchStartY = 0;
  touchCurrentY = 0;
  private touchStartTime = 0;
  isDragging = false;
  dragTranslateY = 0;
  isClosing = false;

  get backdropOpacity(): number {
    if (this.isClosing) return 0;
    if (this.isDragging && this.dragTranslateY > 0) {
      return Math.max(0.15, 1 - (this.dragTranslateY / 320));
    }
    return 1;
  }

  get modalTransform(): string | null {
    if (this.isClosing) return null;
    if (this.dragTranslateY > 0) {
      return `translate3d(0, ${this.dragTranslateY}px, 0)`;
    }
    return null;
  }

  get modalTransition(): string {
    if (this.isDragging) return 'none';
    if (this.isClosing) return 'transform 0.14s cubic-bezier(0.25, 1, 0.5, 1)';
    return 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)';
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.touchStartX = event.touches[0].clientX;
      this.touchCurrentX = this.touchStartX;
      this.touchStartY = event.touches[0].clientY;
      this.touchCurrentY = this.touchStartY;
      this.touchStartTime = performance.now();
      this.isDragging = true;
    }
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || event.touches.length !== 1) return;
    this.touchCurrentX = event.touches[0].clientX;
    this.touchCurrentY = event.touches[0].clientY;
    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;

    // Horizontal swipe on images: don't pull down modal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      this.dragTranslateY = 0;
      if (event.cancelable) {
        event.preventDefault();
      }
      return;
    }

    if (deltaY > 0) {
      this.dragTranslateY = deltaY;
      if (event.cancelable && deltaY > 6) {
        event.preventDefault();
      }
    } else {
      this.dragTranslateY = 0;
    }
  }

  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;
    const deltaTime = performance.now() - this.touchStartTime;

    // 1. Horizontal swipe gesture between product images
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35 && this.galleryImages.length > 1) {
      if (deltaX < -35) {
        // Swiped left -> next image
        this.nextImage();
      } else if (deltaX > 35) {
        // Swiped right -> previous image
        this.prevImage();
      }
      this.dragTranslateY = 0;
      return;
    }

    // 2. Vertical swipe gesture to dismiss modal
    const velocityY = deltaY / Math.max(1, deltaTime);
    if (deltaY > 55 || (deltaY > 25 && velocityY > 0.35)) {
      this.dismissModal();
    } else {
      this.dragTranslateY = 0;
    }
  }

  onPointerDown(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    if (event.button !== 0) return;
    this.touchStartX = event.clientX;
    this.touchCurrentX = this.touchStartX;
    this.touchStartY = event.clientY;
    this.touchCurrentY = this.touchStartY;
    this.touchStartTime = performance.now();
    this.isDragging = true;
    (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    if (!this.isDragging) return;
    this.touchCurrentX = event.clientX;
    this.touchCurrentY = event.clientY;
    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      this.dragTranslateY = 0;
      return;
    }
    this.dragTranslateY = deltaY > 0 ? deltaY : 0;
  }

  onPointerUp(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    if (!this.isDragging) return;
    this.isDragging = false;
    (event.target as HTMLElement)?.releasePointerCapture?.(event.pointerId);
    const deltaX = this.touchCurrentX - this.touchStartX;
    const deltaY = this.touchCurrentY - this.touchStartY;
    const deltaTime = performance.now() - this.touchStartTime;

    // Horizontal swipe on images
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30 && this.galleryImages.length > 1) {
      if (deltaX < -30) {
        this.nextImage();
      } else if (deltaX > 30) {
        this.prevImage();
      }
      this.dragTranslateY = 0;
      return;
    }

    const velocityY = deltaY / Math.max(1, deltaTime);
    if (deltaY > 40 || (deltaY > 15 && velocityY > 0.3)) {
      this.dismissModal();
    } else {
      this.dragTranslateY = 0;
    }
  }

  dismissModal() {
    if (this.isClosing) return;
    this.isClosing = true;
    setTimeout(() => {
      this.closeModal.emit();
    }, 110);
  }

  onClose() {
    this.dismissModal();
  }
}
