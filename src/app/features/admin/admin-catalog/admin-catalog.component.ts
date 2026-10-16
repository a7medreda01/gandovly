import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  MenuCategory,
  ModifierGroup,
  PreparationOption,
  PreparationOptionGroup,
  PricingType,
  Product,
  ProductImage
} from '../../../core/models/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUrlPipe, LoadingStateComponent],
  templateUrl: './admin-catalog.component.html',
  styleUrl: './admin-catalog.component.scss'
})
export class AdminCatalogComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(NotificationService);

  activeTab: 'products' | 'categories' | 'cooking-methods' = 'products';

  categories = signal<MenuCategory[]>([]);
  products = signal<Product[]>([]);
  prepGroups = signal<PreparationOptionGroup[]>([]);
  modifierGroups = signal<ModifierGroup[]>([]);
  isLoading = signal<boolean>(false);
  isUploadingProductImage = signal<boolean>(false);
  uploadProgressText = signal<string>('');
  isUploadingCategoryImage = signal<boolean>(false);

  // Search & Filter State
  productSearch = signal<string>('');
  categoryFilter = signal<number | null>(null);
  categorySearch = signal<string>('');

  filteredProducts = computed(() => {
    const q = this.productSearch().trim().toLowerCase();
    const catId = this.categoryFilter();
    let list = this.products();

    if (catId !== null) {
      list = list.filter(p => p.categoryId === catId);
    }

    if (!q) return list;

    return list.filter(p =>
      (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
      (p.categoryNameAr && p.categoryNameAr.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

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

  // Product Form Modal
  showProductModal = signal<boolean>(false);
  isEditingProduct = signal<boolean>(false);
  productForm = {
    id: 0,
    categoryId: 1,
    nameAr: '',
    nameEn: '',
    description: '',
    imageUrl: '',
    secondaryImageUrl: '',
    images: [] as { id?: number; imageUrl: string; isPrimary: boolean; displayOrder: number }[],
    pricingType: 'ByWeight' as PricingType,
    pricePerUnit: 0,
    pricePerKg: 0 as number | undefined,
    averageUnitWeightGrams: 500 as number | undefined,
    allowOrderByPieces: true,
    allowOrderByWeight: true,
    preparationTimeMinutes: 25,
    allergyNotice: '',
    displayOrder: 0,
    isAvailable: true,
    preparationOptionGroupIds: [] as number[],
    modifierGroupIds: [] as number[]
  };

  // Category Form Modal
  showCategoryModal = signal<boolean>(false);
  isEditingCategory = signal<boolean>(false);
  categoryForm = {
    id: 0,
    nameAr: '',
    nameEn: '',
    description: '',
    imageUrl: '',
    displayOrder: 0,
    isActive: true
  };

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.isLoading.set(true);
    this.adminService.getCategories().subscribe(cats => this.categories.set(cats || []));
    this.adminService.getProducts().subscribe(prods => {
      this.products.set(prods || []);
      this.isLoading.set(false);
    });
    this.adminService.getPreparationGroups().subscribe(groups => this.prepGroups.set(groups || []));
    this.adminService.getModifierGroups().subscribe(groups => this.modifierGroups.set(groups || []));
  }

  openNewProductModal() {
    this.isEditingProduct.set(false);
    this.productImages = [];
    const firstCat = this.categories()[0]?.id || 1;
    this.productForm = {
      id: 0,
      categoryId: firstCat,
      nameAr: '',
      nameEn: '',
      description: '',
      imageUrl: '',
      secondaryImageUrl: '',
      images: [],
      pricingType: 'ByWeight',
      pricePerUnit: 0,
      pricePerKg: 150,
      averageUnitWeightGrams: 500,
      allowOrderByPieces: true,
      allowOrderByWeight: true,
      preparationTimeMinutes: 25,
      allergyNotice: '',
      displayOrder: 0,
      isAvailable: true,
      preparationOptionGroupIds: [] as number[],
      modifierGroupIds: [] as number[]
    };
    this.showProductModal.set(true);
  }

  openEditProductModal(prod: Product) {
    this.isEditingProduct.set(true);

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

    this.productForm = {
      id: prod.id,
      categoryId: prod.categoryId,
      nameAr: prod.nameAr,
      nameEn: prod.nameEn || '',
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      secondaryImageUrl: prod.secondaryImageUrl || '',
      images: imgs,
      pricingType: prod.pricingType,
      pricePerUnit: prod.pricePerUnit,
      pricePerKg: prod.pricePerKg || prod.pricePerUnit,
      averageUnitWeightGrams: prod.averageUnitWeightGrams || 500,
      allowOrderByPieces: prod.allowOrderByPieces,
      allowOrderByWeight: prod.allowOrderByWeight,
      preparationTimeMinutes: prod.preparationTimeMinutes,
      allergyNotice: prod.allergyNotice || '',
      displayOrder: prod.displayOrder,
      isAvailable: prod.isAvailable,
      preparationOptionGroupIds: prod.preparationGroups?.map(g => g.id) || [],
      modifierGroupIds: prod.modifierGroups?.map(g => g.id) || []
    };
    this.syncProductImagesToForm();
    this.showProductModal.set(true);
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

    if (!this.productForm.preparationTimeMinutes || this.productForm.preparationTimeMinutes < 1) {
      this.productForm.preparationTimeMinutes = 25;
    }

    if (this.isEditingProduct()) {
      this.adminService.updateProduct(this.productForm.id, this.productForm).subscribe({
        next: () => {
          this.toast.success('تم حفظ وتحديث الصنف بنجاح.');
          this.showProductModal.set(false);
          this.loadAll();
        },
        error: () => this.toast.error('حدث خطأ أثناء تعديل الصنف.')
      });
    } else {
      this.adminService.createProduct(this.productForm).subscribe({
        next: () => {
          this.toast.success('تم إضافة الصنف بنجاح.');
          this.showProductModal.set(false);
          this.loadAll();
        },
        error: () => this.toast.error('حدث خطأ أثناء إضافة الصنف.')
      });
    }
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
        }
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
  onProductImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    this.isUploadingProductImage.set(true);
    this.uploadProgressText.set(`جاري رفع ${files.length} صورة...`);

    const uploads$ = files.map(file => this.adminService.uploadImage(file, 'products'));

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
        this.toast.success(`تم رفع ${urls.length} صورة بنجاح.`);
        input.value = '';
      },
      error: () => {
        this.isUploadingProductImage.set(false);
        this.uploadProgressText.set('');
        this.toast.error('فشل في رفع بعض الصور أو أن حجم الملف كبير (أقصى حجم 10MB).');
        input.value = '';
      }
    });
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
  onCategoryImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.isUploadingCategoryImage.set(true);
    this.adminService.uploadImage(file, 'categories').subscribe({
      next: (url) => {
        this.categoryForm.imageUrl = url;
        this.isUploadingCategoryImage.set(false);
        this.toast.success('تم رفع صورة القسم بنجاح.');
        input.value = '';
      },
      error: () => {
        this.isUploadingCategoryImage.set(false);
        this.toast.error('فشل رفع صورة القسم.');
        input.value = '';
      }
    });
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
      imageUrl: '',
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
      imageUrl: cat.imageUrl || '',
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

    if (this.isEditingCategory()) {
      this.adminService.updateCategory(this.categoryForm.id, this.categoryForm).subscribe({
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
      this.adminService.createCategory(this.categoryForm).subscribe({
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
      this.toast.error('يرجى إدخال اسم طريقة الطهي.');
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
          this.toast.success('تم تعديل طريقة الطهي وتكلفتها بنجاح!');
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
          this.toast.success('تمت إضافة طريقة الطهي بنجاح!');
          this.showPrepOptionModal.set(false);
          this.adminService.getPreparationGroups().subscribe(groups => this.prepGroups.set(groups || []));
        },
        error: () => this.toast.error('فشل في إضافة طريقة الطهي.')
      });
    }
  }

  deletePrepOption(opt: PreparationOption) {
    if (!confirm(`هل أنت متأكد من حذف طريقة الطهي "${opt.nameAr}"؟`)) return;

    this.adminService.deletePreparationOption(opt.id).subscribe({
      next: () => {
        this.toast.success('تم حذف طريقة الطهي بنجاح.');
        this.adminService.getPreparationGroups().subscribe(groups => this.prepGroups.set(groups || []));
      },
      error: () => this.toast.error('فشل حذف طريقة الطهي.')
    });
  }
}
