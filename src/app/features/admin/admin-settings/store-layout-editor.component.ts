import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeSection, HomeSectionItem, StoreLayout, defaultStoreLayout, newHomeSection } from '../../../core/models/store-layout';
import { CatalogService } from '../../../core/services/catalog.service';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { compressImage } from '../../../core/utils/image-compressor.util';
@Component({ selector: 'app-store-layout-editor', standalone: true, imports: [CommonModule, FormsModule, ImageUrlPipe], templateUrl: './store-layout-editor.component.html', styleUrl: './store-layout-editor.component.scss' })
export class StoreLayoutEditorComponent {
    private value = defaultStoreLayout();
    @Input()
    set layout(v: StoreLayout | undefined) { this.value = v || defaultStoreLayout(); }
    get layout(): StoreLayout { return this.value; }
    @Output()
    layoutChange = new EventEmitter<StoreLayout>();
    readonly catalog = inject(CatalogService);
    private admin = inject(AdminService);
    private toast = inject(NotificationService);
    readonly settings = inject(SettingsService);
    expanded = signal('');
    busy = signal(false);
    previewImage = signal('');
    products = signal<any[]>([]);
    search = '';
    kind: HomeSection['kind'] = 'products';
    kinds: {
        id: HomeSection['kind'];
        name: string;
    }[] = [{ id: 'hero', name: 'بانر رئيسي' }, { id: 'products', name: 'مجموعة منتجات' }, { id: 'banner', name: 'بانر ترويجي' }, { id: 'features', name: 'مميزات وخدمات' }, { id: 'brands', name: 'علامات تجارية' }, { id: 'categories', name: 'أقسام المتجر' }];
    ngOnInit() { this.catalog.loadCategories().subscribe(); this.findProducts(); }
    radiusMode(mode: string) { this.layout.cardImageRadius = mode === 'inherit' ? -1 : Math.min(100, parseInt(this.settings.settings().productCardBorderRadius || '18px', 10) || 18); this.changed(); }
    changed() { this.layoutChange.emit(this.layout); }
    name(kind: string) { return this.kinds.find(k => k.id === kind)?.name || kind; }
    add() { if (this.kind === 'products' && this.layout.sections.filter(s => s.kind === 'products').length >= 6) {
        this.toast.error('الحد الأقصى 6 مجموعات منتجات؛ عدّل مجموعة موجودة أو احذفها أولًا');
        return;
    } if (this.layout.sections.length >= 16) {
        this.toast.error('الحد الأقصى 16 سكشن');
        return;
    } const s = newHomeSection(this.kind); if (this.kind === 'products')
        s.buttonText = 'عرض الكل'; this.layout.sections.push(s); this.expanded.set(s.id); this.changed(); }
    move(i: number, delta: number) { const j = i + delta; if (j < 0 || j >= this.layout.sections.length)
        return; [this.layout.sections[i], this.layout.sections[j]] = [this.layout.sections[j], this.layout.sections[i]]; this.changed(); }
    remove(i: number) { this.layout.sections.splice(i, 1); this.changed(); }
    addItem(s: HomeSection) { if (s.items.length >= 12)
        return; s.items.push({ title: '', text: '', icon: 'bi-check-circle', imageUrl: '', link: '/menu' }); this.changed(); }
    starter() {
        if (this.layout.sections.length) {
            this.toast.info('أضف السكشنات من القائمة للحفاظ على المحتوى الحالي.');
            return;
        }
        const settings = this.settings.settings();
        const hero = newHomeSection('hero');
        hero.title = settings.restaurantName;
        hero.subtitle = settings.description || '';
        hero.imageUrl = settings.heroBannerDesktopUrl || '';
        hero.mobileImageUrl = settings.heroBannerMobileUrl || '';
        const features = newHomeSection('features');
        features.title = 'تسوق بسهولة';
        features.items = [{ title: 'تصفح المنتجات', text: 'كل اختيارات المتجر في مكان واحد', icon: 'bi-grid', imageUrl: '', link: '/menu' }, { title: 'متابعة الطلب', text: 'تابع تفاصيل طلباتك وحالتها', icon: 'bi-box-seam', imageUrl: '', link: '/account' }];
        const latest = newHomeSection('products');
        latest.title = 'وصل حديثًا';
        latest.source = 'latest';
        latest.buttonText = 'عرض الكل';
        const offers = newHomeSection('products');
        offers.title = 'عروض وخصومات';
        offers.source = 'offers';
        offers.buttonText = 'كل العروض';
        const best = newHomeSection('products');
        best.title = 'الأكثر مبيعًا';
        best.source = 'bestsellers';
        best.buttonText = 'عرض الكل';
        this.layout.sections = [hero, features, latest, offers, best];
        this.layout.useCustomHome = true;
        this.changed();
    }
    findProducts() { this.catalog.getProducts({ search: this.search, page: 1, pageSize: 50 }).subscribe({ next: r => this.products.set(r.items || []), error: () => this.toast.error('تعذر تحميل المنتجات') }); }
    toggleProduct(s: HomeSection, id: number, checked: boolean) { s.productIds = checked ? [...s.productIds.filter(n => n !== id), id] : s.productIds.filter(n => n !== id); this.changed(); }
    async upload(event: Event, target: HomeSection | HomeSectionItem, field: 'imageUrl' | 'mobileImageUrl' = 'imageUrl') {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file)
            return;
        this.busy.set(true);
        try {
            const compressed = await compressImage(file, { maxWidth: field === 'mobileImageUrl' ? 900 : 1600, quality: .86 });
            this.admin.uploadImage(compressed, 'branding').subscribe({ next: url => { (target as any)[field] = url; this.busy.set(false); this.changed(); this.toast.success('تم رفع الصورة؛ احفظ الإعدادات لتطبيقها'); }, error: () => { this.busy.set(false); this.toast.error('تعذر رفع الصورة'); } });
        }
        catch {
            this.busy.set(false);
            this.toast.error('تعذر تجهيز الصورة؛ استخدم PNG أو JPEG أو WebP');
        }
    }
}
