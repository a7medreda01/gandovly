import { ChangeDetectorRef } from '@angular/core';
import { CommerceService } from '../../../core/services/commerce.service';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { SettingsService } from '../../../core/services/settings.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  BusinessDomain,
  MenuCategory,
  ModifierGroup,
  ModifierOption,
  PreparationOption,
  PreparationOptionGroup,
  PricingType,
  Product,
  ProductImage
} from '../../../core/models/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { compressImage } from '../../../core/utils/image-compressor.util';

@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUrlPipe, LoadingStateComponent],
  templateUrl: './admin-catalog.component.html',
  styleUrl: './admin-catalog.component.scss'
})
export class AdminCatalogComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  readonly settingsService = inject(SettingsService);
  private readonly toast = inject(NotificationService);

  readonly isEnglishEnabled = computed(() => {
    const s = this.settingsService.settings();
    return s.languageMode !== 'ar_only' && s.enableEnglish !== false;
  });

  get currencySymbol(): string {
    return this.settingsService.settings().currencySymbol || 'ج.م';
  }

  activeTab: 'products' | 'categories' | 'modifiers' | 'cooking-methods' = 'products';

  categories = signal<MenuCategory[]>([]);
  products = signal<Product[]>([]);
  prepGroups = signal<PreparationOptionGroup[]>([]);
  modifierGroups = signal<ModifierGroup[]>([]);
  isLoading = signal<boolean>(false);
  isUploadingProductImage = signal<boolean>(false);
  uploadProgressText = signal<string>('');
  isUploadingCategoryImage = signal<boolean>(false);

  // Search & Filter & Pagination State
  productSearch = signal<string>('');
  categoryFilter = signal<number | null>(null);
  categorySearch = signal<string>('');
  pageIndex = signal<number>(1);
  pageSize = signal<number>(20);
  totalProductsCount = signal<number>(0);
  totalPages = signal<number>(1);
  isLoadingProducts = signal<boolean>(false);
  private searchDebounceTimer?: any;

  // Modifier Groups & Options Management
  showModifierGroupModal = signal<boolean>(false);
  isEditingModifierGroup = signal<boolean>(false);
  modifierGroupForm = {
    id: 0,
    nameAr: '',
    nameEn: '',
    isRequired: false,
    minSelection: 0,
    maxSelection: 1,
    displayOrder: 1
  };

  showModifierOptionModal = signal<boolean>(false);
  isEditingModifierOption = signal<boolean>(false);
  targetModifierGroupId = signal<number>(1);
  modifierOptionForm = {
    id: 0,
    groupId: 1,
    nameAr: '',
    nameEn: '',
    price: 0,
    isAvailable: true,
    displayOrder: 1
  };

  filteredProducts = computed(() => this.products());

  filteredCategories = computed(() => {
    const q = this.categorySearch().trim().toLowerCase();
    const list = this.categories();
    if (!q) return list;
    return list.filter(c =>
      (c.nameAr && c.nameAr.toLowerCase().includes(q)) ||
      (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  // Preparation Option Form Modal
  showPrepOptionModal = signal<boolean>(false);
  isEditingPrepOption = signal<boolean>(false);
  targetGroupId = signal<number>(1);
  prepOptionForm = {
    id: 0,
    groupId: 1,
    nameAr: '',
    nameEn: '',
    price: 0,
    isAvailable: true,
    displayOrder: 1
  };

  // Product Images Gallery State
  productImages: { id?: number; imageUrl: string; isPrimary: boolean; displayOrder: number }[] = [];

  // Business Domains Catalog
  businessDomains: { id: BusinessDomain; label: string; icon: string; description: string }[] = [
    { id: 'Supermarket', label: 'سوبرماركت ومواد غذائية', icon: 'bi-basket2-fill', description: 'أغذية، مشروبات، معلبات، منظفات، مجمدات' },
    { id: 'Restaurant', label: 'مطاعم ومأكولات وكافيهات', icon: 'bi-cup-hot-fill', description: 'وجبات، سندوتشات، مشروبات، حلويات' },
    { id: 'Pharmacy', label: 'صيدلية وعناية طبية', icon: 'bi-capsule', description: 'أدوية، فيتامينات، مستحضرات تجميل، أجهزة طبية' },
    { id: 'AutoParts', label: 'قطع غيار سيارات وورش', icon: 'bi-gear-wide-connected', description: 'قطع غيار، إطارات، بطاريات، فلاتر وزيوت' },
    { id: 'Electronics', label: 'إلكترونيات وأجهزة منزلية', icon: 'bi-tv-fill', description: 'شاشات، هواتف، أجهزة مطبخ، لابتوبات، كابلات' },
    { id: 'GeneralRetail', label: 'تجارة عامة وتوريدات وخدمات', icon: 'bi-shop', description: 'أدوات، ملابس، خدمات، توريدات ومقاولات' },
  ];

  // Product Form Modal
  showProductModal = signal<boolean>(false);
  isEditingProduct = signal<boolean>(false);
  productModalTab = signal<'basic' | 'variants' | 'modifiers' | 'specs'>('basic');

  setProductTab(tab: 'basic' | 'variants' | 'modifiers' | 'specs') {
    this.productModalTab.set(tab);
  }

  nextProductTab() {
    const tabs: ('basic' | 'variants' | 'modifiers' | 'specs')[] = ['basic', 'variants', 'modifiers', 'specs'];
    const idx = tabs.indexOf(this.productModalTab());
    if (idx < tabs.length - 1) this.productModalTab.set(tabs[idx + 1]);
  }

  prevProductTab() {
    const tabs: ('basic' | 'variants' | 'modifiers' | 'specs')[] = ['basic', 'variants', 'modifiers', 'specs'];
    const idx = tabs.indexOf(this.productModalTab());
    if (idx > 0) this.productModalTab.set(tabs[idx - 1]);
  }

  productForm = {
    id: 0,
    categoryId: 1,
    domain: 'Supermarket' as BusinessDomain,
    nameAr: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    imageUrl: '',
    secondaryImageUrl: '',
    images: [] as { id?: number; imageUrl: string; isPrimary: boolean; displayOrder: number }[],
    brand: '',
    sku: '',
    barcode: '',
    pricingType: 'FixedPerUnit' as PricingType,
    pricePerUnit: 0,
    originalPrice: null as number | null,
    pricePerKg: 0 as number | undefined,
    averageUnitWeightGrams: 500 as number | undefined,
    allowOrderByPieces: true,
    allowOrderByWeight: false,
    preparationTimeMinutes: 0,
    allergyNotice: '',
    displayOrder: 0,
    isAvailable: true,
    stockQuantity: 100 as number | null,
    specificationsJson: '',
    preparationOptionGroupIds: [] as number[],
    modifierGroupIds: [] as number[],

    // Domain Specific Presets & Key-Value Specs
    unitSize: '',
    originCountry: '',
    storageType: '',
    activeIngredient: '',
    dosageForm: '',
    requiresPrescription: false,
    oemNumber: '',
    compatibleVehicles: '',
    partCondition: 'جديد أصلي',
    warrantyYears: '',
    powerVoltage: '',
    customSpecs: [] as { key: string; value: string }[]
  };

  // Quick Add Modifier / Options inside Product Modal
  showQuickModifierPanel = signal<boolean>(false);
  quickModifierMode: 'new_group' | 'add_to_existing' = 'new_group';
  quickSelectedGroupId: number = 0;
  quickGroupNameAr = '';
  quickGroupType: 'single' | 'multiple' = 'single';
  quickGroupIsRequired = false;
  quickGroupOptions: { nameAr: string; price: number }[] = [
    { nameAr: '', price: 0 }
  ];
  quickExistingOptionNameAr = '';
  quickExistingOptionPrice = 0;
  isSavingQuickModifier = signal<boolean>(false);

  // Category Form Modal
  showCategoryModal = signal<boolean>(false);
  isEditingCategory = signal<boolean>(false);
  categoryForm = {
    id: 0,
    nameAr: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    imageUrl: '',
    iconName: 'bi-grid-fill',
    domain: 'Supermarket' as BusinessDomain,
    displayOrder: 0,
    isActive: true
  };

  private readonly commerceApi=inject(CommerceService);
  private readonly commerceCdr=inject(ChangeDetectorRef);
  activityPresets:any[]=[];commerceResources:any[]=[];productActivityPreset='';
  productCommerce:any={mode:'Physical',prescriptionRequired:false,resourceId:null,durationMinutes:60,flexibleDuration:false,maxDurationMinutes:43200,subscriptionDays:30,digitalDelivery:'File',depositAmount:0};
  applyPreset(id:string){const preset=this.activityPresets.find(p=>p.id===id);if(!preset)return;this.productActivityPreset=id;this.productForm.domain=preset.domain;this.productCommerce={...this.productCommerce,mode:preset.mode,prescriptionRequired:id==='pharmacy',flexibleDuration:id==='rental'};if(preset.mode!=='Physical'&&preset.mode!=='Perishable'){this.productForm.pricingType='FixedPerUnit';this.variantRows=[];this.productForm.preparationOptionGroupIds=[];}
  for(const key of preset.fields||[])if(!this.productForm.customSpecs.some((s:any)=>s.key===key))this.productForm.customSpecs.push({key,value:''});}
  ngOnInit() {
    this.commerceApi.presets.subscribe(rows=>{this.activityPresets=rows;this.commerceCdr.markForCheck();});this.commerceApi.resources().subscribe(rows=>{this.commerceResources=rows;this.commerceCdr.markForCheck();});
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.adminService.getCategories().subscribe(cats => this.categories.set(cats || []));
    this.loadProducts(1);
    this.adminService.getPreparationGroups().subscribe(groups => this.prepGroups.set(groups || []));
    this.adminService.getModifierGroups().subscribe(groups => this.modifierGroups.set(groups || []));
  }

  loadProducts(page: number = 1) {
    this.pageIndex.set(page);
    this.isLoadingProducts.set(true);
    this.adminService.getProducts({
      categoryId: this.categoryFilter(),
      search: this.productSearch().trim() || undefined,
      page: page,
      pageSize: this.pageSize()
    }).subscribe({
      next: (res) => {
        this.products.set(res?.items || []);
        this.totalProductsCount.set(res?.totalCount || 0);
        this.totalPages.set(res?.totalPages || Math.ceil((res?.totalCount || 0) / this.pageSize()) || 1);
        this.isLoadingProducts.set(false);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoadingProducts.set(false);
        this.isLoading.set(false);
      }
    });
  }

  onProductSearchChange(val: string) {
    this.productSearch.set(val);
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.loadProducts(1);
    }, 300);
  }

  onCategoryFilterChange(catId: any) {
    const parsed = (catId === 'null' || catId === null || catId === '') ? null : Number(catId);
    this.categoryFilter.set(parsed);
    this.loadProducts(1);
  }

  onPageSizeChange(size: any) {
    this.pageSize.set(Number(size));
    this.loadProducts(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageIndex()) {
      this.loadProducts(page);
    }
  }

  openNewProductModal() {
    this.productActivityPreset=this.settingsService.settings().activityPreset||'';
    this.productCommerce={mode:'Physical',prescriptionRequired:false,resourceId:null,durationMinutes:60,flexibleDuration:false,maxDurationMinutes:43200,subscriptionDays:30,digitalDelivery:'File',depositAmount:0};
    this.isEditingProduct.set(false);
    this.variantRows=[];
    this.editingProductVersion=undefined;
    this.productImages = [];
    const firstCat = this.categories()[0];
    const catId = firstCat?.id || 1;
    const catDomain = firstCat?.domain || 'Supermarket';
    this.productForm = {
      id: 0,
      categoryId: catId,
      domain: catDomain,
      nameAr: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      imageUrl: '',
      secondaryImageUrl: '',
      images: [],
      brand: '',
      sku: '',
      barcode: '',
      pricingType: 'FixedPerUnit',
      pricePerUnit: 0,
      originalPrice: null,
      pricePerKg: undefined,
      averageUnitWeightGrams: undefined,
      allowOrderByPieces: true,
      allowOrderByWeight: false,
      preparationTimeMinutes: 0,
      allergyNotice: '',
      displayOrder: 0,
      isAvailable: true,
      stockQuantity: 100,
      specificationsJson: '',
      preparationOptionGroupIds: [],
      modifierGroupIds: [],
      unitSize: '',
      originCountry: '',
      storageType: '',
      activeIngredient: '',
      dosageForm: '',
      requiresPrescription: false,
      oemNumber: '',
      compatibleVehicles: '',
      partCondition: 'جديد أصلي',
      warrantyYears: '',
      powerVoltage: '',
      customSpecs: []
    };
    if(this.productActivityPreset)this.applyPreset(this.productActivityPreset);
    this.showQuickModifierPanel.set(false);
    this.productModalTab.set('basic');
    this.showProductModal.set(true);
  }

  onProductCategoryChange(catId: any) {
    const num = Number(catId);
    this.productForm.categoryId = num;
    const cat = this.categories().find(c => c.id === num);
    if (cat?.domain) {
      this.productForm.domain = cat.domain;
    }
  }

  openEditProductModal(prod: Product) {
    this.productActivityPreset=prod.activityPreset||'';
    this.productCommerce={mode:'Physical',...prod.commerce};
    this.isEditingProduct.set(true);
    this.editingProductVersion=prod.version;

    const imgs: { id?: number; imageUrl: string; isPrimary: boolean; displayOrder: number }[] = [];
    if (prod.images && prod.images.length > 0) {
      const sorted = [...prod.images].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.displayOrder - b.displayOrder;
      });
      sorted.forEach((img, idx) => {
        imgs.push({
          id: img.id,
          imageUrl: img.imageUrl,
          isPrimary: idx === 0,
          displayOrder: idx
        });
      });
    } else {
      if (prod.imageUrl && prod.imageUrl.trim()) {
        imgs.push({ imageUrl: prod.imageUrl.trim(), isPrimary: true, displayOrder: 0 });
      }
      if (prod.secondaryImageUrl) {
        const parts = prod.secondaryImageUrl.split(';').map(s => s.trim()).filter(Boolean);
        for (const p of parts) {
          if (!imgs.some(x => x.imageUrl === p)) {
            imgs.push({ imageUrl: p, isPrimary: false, displayOrder: imgs.length });
          }
        }
      }
    }
    this.productImages = imgs;
    this.variantRows=JSON.parse(JSON.stringify(prod.variants||[]));

    const cat = this.categories().find(c => c.id === prod.categoryId);
    const domain = prod.domain || cat?.domain || 'Supermarket';

    this.productForm = {
      id: prod.id,
      categoryId: prod.categoryId,
      domain: domain,
      nameAr: prod.nameAr,
      nameEn: prod.nameEn || '',
      description: prod.description || '',
      descriptionEn: prod.descriptionEn || '',
      imageUrl: prod.imageUrl || '',
      secondaryImageUrl: prod.secondaryImageUrl || '',
      images: imgs,
      brand: prod.brand || '',
      sku: prod.sku || '',
      barcode: prod.barcode || '',
      pricingType: prod.pricingType,
      pricePerUnit: prod.pricePerUnit,
      originalPrice: prod.originalPrice || null,
      pricePerKg: prod.pricePerKg || prod.pricePerUnit,
      averageUnitWeightGrams: prod.averageUnitWeightGrams || 500,
      allowOrderByPieces: prod.allowOrderByPieces,
      allowOrderByWeight: prod.allowOrderByWeight,
      preparationTimeMinutes: prod.preparationTimeMinutes,
      allergyNotice: prod.allergyNotice || '',
      displayOrder: prod.displayOrder,
      isAvailable: prod.isAvailable,
      stockQuantity: prod.stockQuantity ?? 100,
      specificationsJson: prod.specificationsJson || '',
      preparationOptionGroupIds: prod.preparationGroups?.map(g => g.id) || [],
      modifierGroupIds: prod.modifierGroups?.map(g => g.id) || [],
      unitSize: '',
      originCountry: '',
      storageType: '',
      activeIngredient: '',
      dosageForm: '',
      requiresPrescription: false,
      oemNumber: '',
      compatibleVehicles: '',
      partCondition: 'جديد أصلي',
      warrantyYears: '',
      powerVoltage: '',
      customSpecs: []
    };

    this.parseSpecificationsJson(prod.specificationsJson);
    this.syncProductImagesToForm();
    this.showQuickModifierPanel.set(false);
    this.productModalTab.set('basic');
    this.showProductModal.set(true);
  }

  // Specifications Parsing & Building
  addCustomSpec() {
    this.productForm.customSpecs.push({ key: '', value: '' });
  }

  removeCustomSpec(index: number) {
    this.productForm.customSpecs.splice(index, 1);
  }

  buildSpecificationsJson(): string {
    const specs: { [key: string]: any } = {};

    if (this.productForm.unitSize?.trim()) specs['unitSize'] = this.productForm.unitSize.trim();
    if (this.productForm.originCountry?.trim()) specs['originCountry'] = this.productForm.originCountry.trim();
    if (this.productForm.storageType?.trim()) specs['storageType'] = this.productForm.storageType.trim();
    if (this.productForm.activeIngredient?.trim()) specs['activeIngredient'] = this.productForm.activeIngredient.trim();
    if (this.productForm.dosageForm?.trim()) specs['dosageForm'] = this.productForm.dosageForm.trim();
    if (this.productForm.requiresPrescription) specs['requiresPrescription'] = 'نعم - يلزم وصفة طبية';
    if (this.productForm.oemNumber?.trim()) specs['oemNumber'] = this.productForm.oemNumber.trim();
    if (this.productForm.compatibleVehicles?.trim()) specs['compatibleVehicles'] = this.productForm.compatibleVehicles.trim();
    if (this.productForm.partCondition?.trim()) specs['partCondition'] = this.productForm.partCondition.trim();
    if (this.productForm.warrantyYears?.trim()) specs['warrantyYears'] = this.productForm.warrantyYears.trim();
    if (this.productForm.powerVoltage?.trim()) specs['powerVoltage'] = this.productForm.powerVoltage.trim();

    if (this.productForm.customSpecs && this.productForm.customSpecs.length > 0) {
      for (const row of this.productForm.customSpecs) {
        if (row.key?.trim() && row.value?.trim()) {
          specs[row.key.trim()] = row.value.trim();
        }
      }
    }

    return Object.keys(specs).length > 0 ? JSON.stringify(specs) : '';
  }

  parseSpecificationsJson(jsonStr?: string) {
    this.productForm.unitSize = '';
    this.productForm.originCountry = '';
    this.productForm.storageType = '';
    this.productForm.activeIngredient = '';
    this.productForm.dosageForm = '';
    this.productForm.requiresPrescription = false;
    this.productForm.oemNumber = '';
    this.productForm.compatibleVehicles = '';
    this.productForm.partCondition = 'جديد أصلي';
    this.productForm.warrantyYears = '';
    this.productForm.powerVoltage = '';
    this.productForm.customSpecs = [];

    if (!jsonStr) return;

    try {
      const obj = JSON.parse(jsonStr);
      if (typeof obj === 'object' && obj !== null) {
        if (obj['unitSize']) this.productForm.unitSize = obj['unitSize'];
        if (obj['originCountry']) this.productForm.originCountry = obj['originCountry'];
        if (obj['storageType']) this.productForm.storageType = obj['storageType'];
        if (obj['activeIngredient']) this.productForm.activeIngredient = obj['activeIngredient'];
        if (obj['dosageForm']) this.productForm.dosageForm = obj['dosageForm'];
        if (obj['requiresPrescription']) this.productForm.requiresPrescription = true;
        if (obj['oemNumber']) this.productForm.oemNumber = obj['oemNumber'];
        if (obj['compatibleVehicles']) this.productForm.compatibleVehicles = obj['compatibleVehicles'];
        if (obj['partCondition']) this.productForm.partCondition = obj['partCondition'];
        if (obj['warrantyYears']) this.productForm.warrantyYears = obj['warrantyYears'];
        if (obj['powerVoltage']) this.productForm.powerVoltage = obj['powerVoltage'];

        const standardKeys = new Set([
          'unitSize', 'originCountry', 'storageType', 'activeIngredient',
          'dosageForm', 'requiresPrescription', 'oemNumber', 'compatibleVehicles',
          'partCondition', 'warrantyYears', 'powerVoltage', 'category'
        ]);

        for (const [k, v] of Object.entries(obj)) {
          if (!standardKeys.has(k) && typeof v === 'string' && v.trim()) {
            this.productForm.customSpecs.push({ key: k, value: v.trim() });
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  // Quick Add Options & Modifiers Methods
  toggleQuickModifierPanel() {
    this.showQuickModifierPanel.update(v => !v);
    if (this.showQuickModifierPanel()) {
      this.resetQuickModifierForm();
    }
  }

  resetQuickModifierForm() {
    this.quickGroupNameAr = '';
    this.quickGroupType = 'single';
    this.quickGroupIsRequired = false;
    this.quickGroupOptions = [{ nameAr: '', price: 0 }];
    this.quickSelectedGroupId = this.modifierGroups()[0]?.id || 0;
    this.quickExistingOptionNameAr = '';
    this.quickExistingOptionPrice = 0;
  }

  addQuickOptionRow() {
    this.quickGroupOptions.push({ nameAr: '', price: 0 });
  }

  removeQuickOptionRow(index: number) {
    if (this.quickGroupOptions.length > 1) {
      this.quickGroupOptions.splice(index, 1);
    }
  }

  saveQuickModifierGroup() {
    const name = this.quickGroupNameAr.trim();
    if (!name) {
      this.toast.error('يرجى كتابة اسم مجموعة الخيارات (مثال: الحجم، الإضافات، اللون...)');
      return;
    }

    const validOptions = this.quickGroupOptions.filter(o => o.nameAr.trim().length > 0);
    if (validOptions.length === 0) {
      this.toast.error('يرجى إضافة خيار واحد على الأقل داخل المجموعة (مثال: حجم كبير، صوص خاص...)');
      return;
    }

    this.isSavingQuickModifier.set(true);

    const groupDto = {
      nameAr: name,
      isRequired: this.quickGroupIsRequired,
      minSelection: this.quickGroupIsRequired ? 1 : 0,
      maxSelection: this.quickGroupType === 'single' ? 1 : 10,
      displayOrder: this.modifierGroups().length + 1
    };

    this.adminService.createModifierGroup(groupDto).subscribe({
      next: (createdGroup) => {
        const optionObservables = validOptions.map((opt, idx) =>
          this.adminService.createModifierOption(createdGroup.id, {
            nameAr: opt.nameAr.trim(),
            price: Number(opt.price) || 0,
            displayOrder: idx + 1,
            isAvailable: true
          })
        );

        forkJoin(optionObservables).subscribe({
          next: () => {
            this.adminService.getModifierGroups().subscribe(groups => {
              this.modifierGroups.set(groups || []);
              if (!this.productForm.modifierGroupIds.includes(createdGroup.id)) {
                this.productForm.modifierGroupIds.push(createdGroup.id);
              }
              this.isSavingQuickModifier.set(false);
              this.showQuickModifierPanel.set(false);
              this.toast.success(`تم إنشاء مجموعة "${name}" وربطها بالصنف بنجاح! 🎉`);
            });
          },
          error: () => {
            this.adminService.getModifierGroups().subscribe(groups => this.modifierGroups.set(groups || []));
            this.productForm.modifierGroupIds.push(createdGroup.id);
            this.isSavingQuickModifier.set(false);
            this.showQuickModifierPanel.set(false);
            this.toast.success(`تم إنشاء المجموعة وربطها بالصنف.`);
          }
        });
      },
      error: () => {
        this.isSavingQuickModifier.set(false);
        this.toast.error('حدث خطأ أثناء إنشاء مجموعة الخيارات.');
      }
    });
  }

  saveQuickOptionToExisting() {
    const optName = this.quickExistingOptionNameAr.trim();
    if (!this.quickSelectedGroupId) {
      this.toast.error('يرجى اختيار المجموعة لإضافة الخيار إليها');
      return;
    }
    if (!optName) {
      this.toast.error('يرجى كتابة اسم الإضافة أو الخيار');
      return;
    }

    this.isSavingQuickModifier.set(true);
    this.adminService.createModifierOption(this.quickSelectedGroupId, {
      nameAr: optName,
      price: Number(this.quickExistingOptionPrice) || 0,
      displayOrder: 99,
      isAvailable: true
    }).subscribe({
      next: () => {
        this.adminService.getModifierGroups().subscribe(groups => {
          this.modifierGroups.set(groups || []);
          if (!this.productForm.modifierGroupIds.includes(this.quickSelectedGroupId)) {
            this.productForm.modifierGroupIds.push(this.quickSelectedGroupId);
          }
          this.isSavingQuickModifier.set(false);
          this.showQuickModifierPanel.set(false);
          this.toast.success(`تم إضافة الخيار "${optName}" وربطه بالصنف بنجاح! 🎉`);
        });
      },
      error: () => {
        this.isSavingQuickModifier.set(false);
        this.toast.error('حدث خطأ أثناء إضافة الخيار.');
      }
    });
  }

  syncProductImagesToForm() {
    this.productImages.forEach((img, idx) => {
      img.displayOrder = idx;
      img.isPrimary = (idx === 0);
    });

    if (this.productImages.length > 0) {
      this.productForm.imageUrl = this.productImages[0].imageUrl;
      this.productForm.secondaryImageUrl = this.productImages.slice(1).map(i => i.imageUrl).join(';');
      this.productForm.images = this.productImages.map(i => ({
        id: i.id,
        imageUrl: i.imageUrl,
        isPrimary: i.isPrimary,
        displayOrder: i.displayOrder
      }));
    } else {
      this.productForm.imageUrl = '';
      this.productForm.secondaryImageUrl = '';
      this.productForm.images = [];
    }
  }

  variantRows:any[]=[];
  editingProductVersion?:string;
  addVariant(){this.variantRows.push({id:crypto.randomUUID(),color:'',colorId:crypto.randomUUID(),colorHex:'#171717',size:'',sku:'',price:null,stockQuantity:null,isAvailable:true,images:[]});}
  toggleVariantImage(row:any,url:string){row.images=row.images.includes(url)?row.images.filter((x:string)=>x!==url):[...row.images,url];this.syncVariantImages(row);}
  syncVariantColor(row:any){const same=this.variantRows.find(v=>v!==row&&v.color.trim()===row.color.trim());if(same){row.colorId=same.colorId;row.colorHex=same.colorHex;}else row.colorId ||= crypto.randomUUID();}
  updateVariantColor(row:any){row.colorId ||= crypto.randomUUID();for(const v of this.variantRows)if(v===row||(v.colorId&&v.colorId===row.colorId)||v.color.trim()===row.color.trim()){v.colorId=row.colorId;v.colorHex=row.colorHex;v.color=row.color;}}
  syncVariantImages(row:any){for(const v of this.variantRows)if(v.color.trim()===row.color.trim())v.images=[...row.images];}
  saveProduct() {
    if (!this.productForm.nameAr.trim()) {
      this.toast.error('يرجى إدخال اسم الصنف باللغة العربية.');
      return;
    }

    this.syncProductImagesToForm();

    if (this.productForm.pricingType === 'FixedPerUnit') {
      this.productForm.allowOrderByWeight = false;
      this.productForm.allowOrderByPieces = true;
      this.productForm.pricePerKg = undefined;
      this.productForm.averageUnitWeightGrams = undefined;
    }

    // Build specs JSON from domain inputs + custom specs
    this.productForm.specificationsJson = this.buildSpecificationsJson();

    const payload: any = {
      categoryId: this.productForm.categoryId,
      activityPreset:this.productActivityPreset,commerce:this.productCommerce,
      variants: this.variantRows,
      version: this.editingProductVersion,
      nameAr: this.productForm.nameAr.trim(),
      nameEn: this.productForm.nameEn?.trim() || null,
      description: this.productForm.description?.trim() || null,
      descriptionEn: this.productForm.descriptionEn?.trim() || null,
      imageUrl: this.productForm.imageUrl,
      secondaryImageUrl: this.productForm.secondaryImageUrl,
      images: this.productForm.images,
      brand: this.productForm.brand?.trim() || null,
      sku: this.productForm.sku?.trim() || null,
      barcode: this.productForm.barcode?.trim() || null,
      pricingType: this.productForm.pricingType,
      pricePerUnit: Number(this.productForm.pricePerUnit) || 0,
      originalPrice: this.productForm.originalPrice ? Number(this.productForm.originalPrice) : null,
      pricePerKg: this.productForm.pricePerKg ? Number(this.productForm.pricePerKg) : null,
      averageUnitWeightGrams: this.productForm.averageUnitWeightGrams ? Number(this.productForm.averageUnitWeightGrams) : null,
      allowOrderByPieces: this.productForm.allowOrderByPieces,
      allowOrderByWeight: this.productForm.allowOrderByWeight,
      preparationTimeMinutes: Number(this.productForm.preparationTimeMinutes) || 0,
      allergyNotice: this.productForm.allergyNotice?.trim() || null,
      specificationsJson: this.productForm.specificationsJson || null,
      displayOrder: Number(this.productForm.displayOrder) || 0,
      isAvailable: this.productForm.isAvailable,
      stockQuantity: this.productForm.stockQuantity !== null && this.productForm.stockQuantity !== undefined ? Number(this.productForm.stockQuantity) : null,
      preparationOptionGroupIds: this.productForm.preparationOptionGroupIds,
      modifierGroupIds: this.productForm.modifierGroupIds
    };

    if (this.isEditingProduct()) {
      this.adminService.updateProduct(this.productForm.id, payload).subscribe({
        next: () => {
          this.toast.success('تم حفظ وتحديث الصنف بنجاح.');
          this.showProductModal.set(false);
          this.loadAll();
        },
        error: (err) => this.toast.error(this.extractErrorMessage(err, 'حدث خطأ أثناء تعديل الصنف.'))
      });
    } else {
      this.adminService.createProduct(payload).subscribe({
        next: () => {
          this.toast.success('تم إضافة الصنف بنجاح.');
          this.showProductModal.set(false);
          this.loadAll();
        },
        error: (err) => this.toast.error(this.extractErrorMessage(err, 'حدث خطأ أثناء إضافة الصنف.'))
      });
    }
  }

  private extractErrorMessage(err: any, fallback: string): string {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (err.error?.message) return err.error.message;
    if (err.error?.errors) {
      const errs = err.error.errors;
      if (Array.isArray(errs)) return errs.join(' - ');
      if (typeof errs === 'object') return Object.values(errs).flat().join(' - ');
    }
    if (err.error?.title) return err.error.title;
    if (err.message && !err.message.includes('Http failure response')) return err.message;
    return fallback;
  }

  toggleAvailability(prod: Product) {
    const previousState = prod.isAvailable;
    const newState = !previousState;

    // 1. Instant optimistic UI update with Angular Signals
    prod.isAvailable = newState;
    this.products.update(list =>
      list.map(p => (p.id === prod.id ? { ...p, isAvailable: newState } : p))
    );

    this.adminService.toggleProductAvailability(prod.id, newState).subscribe({
      next: () => {
        this.toast.success(`تم تغيير حالة (${prod.nameAr}) إلى: ${newState ? 'متوفر' : 'غير متوفر'}`);
      },
      error: () => {
        // Rollback on failure
        prod.isAvailable = previousState;
        this.products.update(list =>
          list.map(p => (p.id === prod.id ? { ...p, isAvailable: previousState } : p))
        );
        this.toast.error(`تعذر تحديث حالة الصنف (${prod.nameAr}).`);
      }
    });
  }

  deleteProduct(prod: Product) {
    if (confirm(`هل أنت متأكد من حذف الصنف (${prod.nameAr})؟`)) {
      this.adminService.deleteProduct(prod.id).subscribe({
        next: () => {
          this.toast.success('تم حذف الصنف بنجاح.');
          this.loadAll();
        },
        error: (err) => this.toast.error(this.extractErrorMessage(err, 'حدث خطأ أثناء حذف الصنف.'))
      });
    }
  }

  togglePrepGroup(groupId: number) {
    const ids = this.productForm.preparationOptionGroupIds;
    if (ids.includes(groupId)) {
      this.productForm.preparationOptionGroupIds = ids.filter(id => id !== groupId);
    } else {
      this.productForm.preparationOptionGroupIds = [...ids, groupId];
    }
  }

  toggleModifierGroup(groupId: number) {
    const ids = this.productForm.modifierGroupIds;
    if (ids.includes(groupId)) {
      this.productForm.modifierGroupIds = ids.filter(id => id !== groupId);
    } else {
      this.productForm.modifierGroupIds = [...ids, groupId];
    }
  }

  // ===== PRODUCT IMAGES GALLERY =====
  async onProductImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    this.isUploadingProductImage.set(true);
    this.uploadProgressText.set(`جاري ضغط وتحسين ${files.length} صورة بأعلى دقة WebP...`);

    try {
      // Auto compress & convert to ultra-fast WebP without visible quality loss
      const compressedFiles = await Promise.all(
        files.map(file => compressImage(file, { maxWidth: 1400, quality: 0.85 }))
      );

      this.uploadProgressText.set(`جاري رفع ${compressedFiles.length} صورة...`);
      const uploads$ = compressedFiles.map(file => this.adminService.uploadImage(file, 'products'));

      forkJoin(uploads$).subscribe({
        next: (urls: string[]) => {
          for (const url of urls) {
            if (url && !this.productImages.some(i => i.imageUrl === url)) {
              this.productImages.push({
                imageUrl: url,
                isPrimary: this.productImages.length === 0,
                displayOrder: this.productImages.length
              });
            }
          }
          this.syncProductImagesToForm();
          this.isUploadingProductImage.set(false);
          this.uploadProgressText.set('');
          this.toast.success(`تم ضغط ورفع ${urls.length} صورة بنجاح بصيغة WebP فائقة السرعة.`);
          input.value = '';
        },
        error: () => {
          this.isUploadingProductImage.set(false);
          this.uploadProgressText.set('');
          this.toast.error('فشل في رفع بعض الصور أو أن حجم الملف كبير (أقصى حجم 10MB).');
          input.value = '';
        }
      });
    } catch {
      this.isUploadingProductImage.set(false);
      this.uploadProgressText.set('');
      this.toast.error('حدث خطأ أثناء معالجة وضغط الصور.');
      input.value = '';
    }
  }

  setAsPrimaryProductImage(index: number) {
    if (index <= 0 || index >= this.productImages.length) return;
    const selected = this.productImages.splice(index, 1)[0];
    this.productImages.unshift(selected);
    this.syncProductImagesToForm();
    this.toast.success('تم تعيين الصورة كصورة رئيسية (غلاف) للصنف.');
  }

  moveProductImage(index: number, direction: 'prev' | 'next') {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= this.productImages.length) return;
    const temp = this.productImages[index];
    this.productImages[index] = this.productImages[targetIndex];
    this.productImages[targetIndex] = temp;
    this.syncProductImagesToForm();
  }

  removeProductImage(index: number) {
    if (index < 0 || index >= this.productImages.length) return;
    this.productImages.splice(index, 1);
    this.syncProductImagesToForm();
    this.toast.info('تمت إزالة الصورة من الصنف.');
  }

  // ===== CATEGORIES IMAGES =====
  async onCategoryImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.isUploadingCategoryImage.set(true);

    try {
      const compressed = await compressImage(file, { maxWidth: 800, quality: 0.85 });
      this.adminService.uploadImage(compressed, 'categories').subscribe({
        next: (url) => {
          this.categoryForm.imageUrl = url;
          this.isUploadingCategoryImage.set(false);
          this.toast.success('تم ضغط ورفع صورة القسم بنجاح بصيغة WebP.');
          input.value = '';
        },
        error: () => {
          this.isUploadingCategoryImage.set(false);
          this.toast.error('فشل رفع صورة القسم.');
          input.value = '';
        }
      });
    } catch {
      this.isUploadingCategoryImage.set(false);
      this.toast.error('حدث خطأ أثناء معالجة صورة القسم.');
      input.value = '';
    }
  }

  removeCategoryImage() {
    this.categoryForm.imageUrl = '';
    this.toast.info('تمت إزالة صورة القسم.');
  }

  // ===== CATEGORIES MANAGEMENT =====
  openNewCategoryModal() {
    this.isEditingCategory.set(false);
    this.categoryForm = {
      id: 0,
      nameAr: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      imageUrl: '',
      iconName: 'bi-grid-fill',
      domain: this.settingsService.settings().defaultDomain || 'Supermarket',
      displayOrder: this.categories().length + 1,
      isActive: true
    };
    this.showCategoryModal.set(true);
  }

  openEditCategoryModal(cat: MenuCategory) {
    this.isEditingCategory.set(true);
    this.categoryForm = {
      id: cat.id,
      nameAr: cat.nameAr,
      nameEn: cat.nameEn || '',
      description: cat.description || '',
      descriptionEn: cat.descriptionEn || '',
      imageUrl: cat.imageUrl || '',
      iconName: cat.iconName || 'bi-grid-fill',
      domain: cat.domain || 'Supermarket',
      displayOrder: cat.displayOrder,
      isActive: cat.isActive
    };
    this.showCategoryModal.set(true);
  }

  saveCategory() {
    if (!this.categoryForm.nameAr.trim()) {
      this.toast.error('يرجى إدخال اسم القسم باللغة العربية.');
      return;
    }

    const payload: any = {
      nameAr: this.categoryForm.nameAr.trim(),
      nameEn: this.categoryForm.nameEn?.trim() || null,
      description: this.categoryForm.description?.trim() || null,
      descriptionEn: this.categoryForm.descriptionEn?.trim() || null,
      imageUrl: this.categoryForm.imageUrl || null,
      iconName: this.categoryForm.iconName || 'bi-grid-fill',
      domain: this.categoryForm.domain || 'Supermarket',
      displayOrder: Number(this.categoryForm.displayOrder) || 0,
      isActive: this.categoryForm.isActive
    };

    if (this.isEditingCategory()) {
      this.adminService.updateCategory(this.categoryForm.id, payload).subscribe({
        next: () => {
          this.toast.success('تم تعديل القسم بنجاح.');
          this.showCategoryModal.set(false);
          this.loadAll();
        },
        error: (err) => {
          const msg = err?.error?.message || 'حدث خطأ أثناء تعديل القسم.';
          this.toast.error(msg);
        }
      });
    } else {
      this.adminService.createCategory(payload).subscribe({
        next: () => {
          this.toast.success('تم إضافة القسم بنجاح.');
          this.showCategoryModal.set(false);
          this.loadAll();
        },
        error: (err) => {
          const msg = err?.error?.message || 'حدث خطأ أثناء إضافة القسم.';
          this.toast.error(msg);
        }
      });
    }
  }

  deleteCategory(cat: MenuCategory) {
    const count = this.getCategoryProductCount(cat.id);
    if (count > 0) {
      this.toast.error(`لا يمكن حذف قسم (${cat.nameAr}) لوجود ${count} صنف مرتبط به. قم بحذف أو نقل الأصناف أولاً.`);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف القسم (${cat.nameAr}) نهائياً؟`)) {
      this.adminService.deleteCategory(cat.id).subscribe({
        next: () => {
          this.toast.success('تم حذف القسم بنجاح.');
          this.loadAll();
        },
        error: (err) => {
          const msg = err?.error?.message || 'حدث خطأ أثناء حذف القسم.';
          this.toast.error(msg);
        }
      });
    }
  }

  toggleCategoryStatus(cat: MenuCategory) {
    const previousState = cat.isActive;
    const newState = !previousState;

    // Instant optimistic UI update
    cat.isActive = newState;
    this.categories.update(list =>
      list.map(c => (c.id === cat.id ? { ...c, isActive: newState } : c))
    );

    const updated = {
      nameAr: cat.nameAr,
      nameEn: cat.nameEn,
      description: cat.description,
      imageUrl: cat.imageUrl,
      displayOrder: cat.displayOrder,
      isActive: newState
    };

    this.adminService.updateCategory(cat.id, updated).subscribe({
      next: () => {
        this.toast.success(`تم ${newState ? 'تفعيل' : 'تعطيل'} قسم (${cat.nameAr}).`);
      },
      error: () => {
        cat.isActive = previousState;
        this.categories.update(list =>
          list.map(c => (c.id === cat.id ? { ...c, isActive: previousState } : c))
        );
        this.toast.error('حدث خطأ أثناء تحديث حالة القسم.');
      }
    });
  }

  getCategoryProductCount(catId: number): number {
    return this.products().filter(p => p.categoryId === catId).length;
  }

  // Modifier Groups Management
  openNewModifierGroupModal() {
    this.isEditingModifierGroup.set(false);
    this.modifierGroupForm = {
      id: 0,
      nameAr: '',
      nameEn: '',
      isRequired: false,
      minSelection: 0,
      maxSelection: 1,
      displayOrder: (this.modifierGroups()?.length || 0) + 1
    };
    this.showModifierGroupModal.set(true);
  }

  openEditModifierGroupModal(grp: ModifierGroup) {
    this.isEditingModifierGroup.set(true);
    this.modifierGroupForm = {
      id: grp.id,
      nameAr: grp.nameAr,
      nameEn: grp.nameEn || '',
      isRequired: grp.isRequired,
      minSelection: grp.minSelection,
      maxSelection: grp.maxSelection,
      displayOrder: grp.displayOrder
    };
    this.showModifierGroupModal.set(true);
  }

  saveModifierGroup() {
    if (!this.modifierGroupForm.nameAr.trim()) {
      this.toast.error('يرجى إدخال اسم مجموعة الخيارات والمواصفات.');
      return;
    }

    if (this.isEditingModifierGroup()) {
      this.adminService.updateModifierGroup(this.modifierGroupForm.id, {
        nameAr: this.modifierGroupForm.nameAr.trim(),
        nameEn: this.modifierGroupForm.nameEn.trim(),
        isRequired: this.modifierGroupForm.isRequired,
        minSelection: Number(this.modifierGroupForm.minSelection) || 0,
        maxSelection: Number(this.modifierGroupForm.maxSelection) || 1,
        displayOrder: this.modifierGroupForm.displayOrder
      }).subscribe({
        next: () => {
          this.toast.success('تم تعديل مجموعة الخيارات بنجاح!');
          this.showModifierGroupModal.set(false);
          this.adminService.getModifierGroups().subscribe(groups => this.modifierGroups.set(groups || []));
        },
        error: () => this.toast.error('فشل حفظ التعديلات.')
      });
    } else {
      this.adminService.createModifierGroup({
        nameAr: this.modifierGroupForm.nameAr.trim(),
        nameEn: this.modifierGroupForm.nameEn.trim(),
        isRequired: this.modifierGroupForm.isRequired,
        minSelection: Number(this.modifierGroupForm.minSelection) || 0,
        maxSelection: Number(this.modifierGroupForm.maxSelection) || 1,
        displayOrder: this.modifierGroupForm.displayOrder
      }).subscribe({
        next: () => {
          this.toast.success('تمت إضافة مجموعة الخيارات بنجاح!');
          this.showModifierGroupModal.set(false);
          this.adminService.getModifierGroups().subscribe(groups => this.modifierGroups.set(groups || []));
        },
        error: () => this.toast.error('فشل في إضافة مجموعة الخيارات.')
      });
    }
  }

  deleteModifierGroup(grp: ModifierGroup) {
    if (!confirm(`هل أنت متأكد من حذف مجموعة الخيارات "${grp.nameAr}" وجميع خياراتها؟`)) return;

    this.adminService.deleteModifierGroup(grp.id).subscribe({
      next: () => {
        this.toast.success('تم حذف مجموعة الخيارات بنجاح.');
        this.adminService.getModifierGroups().subscribe(groups => this.modifierGroups.set(groups || []));
      },
      error: () => this.toast.error('فشل في حذف مجموعة الخيارات.')
    });
  }

  // Modifier Options Management
  openNewModifierOptionModal(group: ModifierGroup) {
    this.isEditingModifierOption.set(false);
    this.targetModifierGroupId.set(group.id);
    this.modifierOptionForm = {
      id: 0,
      groupId: group.id,
      nameAr: '',
      nameEn: '',
      price: 0,
      isAvailable: true,
      displayOrder: (group.options?.length || 0) + 1
    };
    this.showModifierOptionModal.set(true);
  }

  openEditModifierOptionModal(opt: ModifierOption) {
    this.isEditingModifierOption.set(true);
    this.targetModifierGroupId.set(opt.groupId);
    this.modifierOptionForm = {
      id: opt.id,
      groupId: opt.groupId,
      nameAr: opt.nameAr,
      nameEn: opt.nameEn || '',
      price: opt.price,
      isAvailable: opt.isAvailable,
      displayOrder: opt.displayOrder
    };
    this.showModifierOptionModal.set(true);
  }

  saveModifierOption() {
    if (!this.modifierOptionForm.nameAr.trim()) {
      this.toast.error('يرجى إدخال اسم الخيار أو الملحق.');
      return;
    }

    if (this.isEditingModifierOption()) {
      this.adminService.updateModifierOption(this.modifierOptionForm.id, {
        nameAr: this.modifierOptionForm.nameAr.trim(),
        nameEn: this.modifierOptionForm.nameEn.trim(),
        price: Number(this.modifierOptionForm.price) || 0,
        isAvailable: this.modifierOptionForm.isAvailable,
        displayOrder: this.modifierOptionForm.displayOrder
      }).subscribe({
        next: () => {
          this.toast.success('تم تعديل الخيار بنجاح!');
          this.showModifierOptionModal.set(false);
          this.adminService.getModifierGroups().subscribe(groups => this.modifierGroups.set(groups || []));
        },
        error: () => this.toast.error('فشل في حفظ التعديلات.')
      });
    } else {
      this.adminService.createModifierOption(this.targetModifierGroupId(), {
        nameAr: this.modifierOptionForm.nameAr.trim(),
        nameEn: this.modifierOptionForm.nameEn.trim(),
        price: Number(this.modifierOptionForm.price) || 0,
        displayOrder: this.modifierOptionForm.displayOrder
      }).subscribe({
        next: () => {
          this.toast.success('تمت إضافة الخيار بنجاح!');
          this.showModifierOptionModal.set(false);
          this.adminService.getModifierGroups().subscribe(groups => this.modifierGroups.set(groups || []));
        },
        error: () => this.toast.error('فشل في إضافة الخيار.')
      });
    }
  }

  deleteModifierOption(opt: ModifierOption) {
    if (!confirm(`هل أنت متأكد من حذف الخيار "${opt.nameAr}"؟`)) return;

    this.adminService.deleteModifierOption(opt.id).subscribe({
      next: () => {
        this.toast.success('تم حذف الخيار بنجاح.');
        this.adminService.getModifierGroups().subscribe(groups => this.modifierGroups.set(groups || []));
      },
      error: () => this.toast.error('فشل في حذف الخيار.')
    });
  }

  // Preparation Methods Management
  openNewPrepOptionModal(group: PreparationOptionGroup) {
    this.isEditingPrepOption.set(false);
    this.targetGroupId.set(group.id);
    this.prepOptionForm = {
      id: 0,
      groupId: group.id,
      nameAr: '',
      nameEn: '',
      price: 0,
      isAvailable: true,
      displayOrder: (group.options?.length || 0) + 1
    };
    this.showPrepOptionModal.set(true);
  }

  openEditPrepOptionModal(opt: PreparationOption) {
    this.isEditingPrepOption.set(true);
    this.targetGroupId.set(opt.groupId);
    this.prepOptionForm = {
      id: opt.id,
      groupId: opt.groupId,
      nameAr: opt.nameAr,
      nameEn: opt.nameEn || '',
      price: opt.price,
      isAvailable: opt.isAvailable,
      displayOrder: opt.displayOrder
    };
    this.showPrepOptionModal.set(true);
  }

  savePrepOption() {
    if (!this.prepOptionForm.nameAr.trim()) {
      this.toast.error('يرجى إدخال اسم الخدمة.');
      return;
    }

    if (this.isEditingPrepOption()) {
      this.adminService.updatePreparationOption(this.prepOptionForm.id, {
        nameAr: this.prepOptionForm.nameAr.trim(),
        nameEn: this.prepOptionForm.nameEn.trim(),
        price: Number(this.prepOptionForm.price) || 0,
        isAvailable: this.prepOptionForm.isAvailable,
        displayOrder: this.prepOptionForm.displayOrder
      }).subscribe({
        next: () => {
          this.toast.success('تم تعديل الخدمة وتكلفتها بنجاح!');
          this.showPrepOptionModal.set(false);
          this.adminService.getPreparationGroups().subscribe(groups => this.prepGroups.set(groups || []));
        },
        error: () => this.toast.error('فشل في حفظ التعديلات.')
      });
    } else {
      this.adminService.createPreparationOption(this.targetGroupId(), {
        nameAr: this.prepOptionForm.nameAr.trim(),
        nameEn: this.prepOptionForm.nameEn.trim(),
        price: Number(this.prepOptionForm.price) || 0,
        displayOrder: this.prepOptionForm.displayOrder
      }).subscribe({
        next: () => {
          this.toast.success('تمت إضافة الخدمة بنجاح!');
          this.showPrepOptionModal.set(false);
          this.adminService.getPreparationGroups().subscribe(groups => this.prepGroups.set(groups || []));
        },
        error: () => this.toast.error('فشل في إضافة الخدمة.')
      });
    }
  }

  deletePrepOption(opt: PreparationOption) {
    if (!confirm(`هل أنت متأكد من حذف الخدمة "${opt.nameAr}"؟`)) return;

    this.adminService.deletePreparationOption(opt.id).subscribe({
      next: () => {
        this.toast.success('تم حذف الخدمة بنجاح.');
        this.adminService.getPreparationGroups().subscribe(groups => this.prepGroups.set(groups || []));
      },
      error: () => this.toast.error('فشل حذف الخدمة.')
    });
  }
}
