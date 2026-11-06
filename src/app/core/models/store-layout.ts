export interface HomeSectionItem {
    title: string;
    text: string;
    icon: string;
    imageUrl: string;
    link: string;
}
export interface HomeSection {
    id: string;
    kind: 'hero' | 'products' | 'banner' | 'features' | 'brands' | 'categories';
    enabled: boolean;
    title: string;
    subtitle: string;
    eyebrow: string;
    imageUrl: string;
    mobileImageUrl: string;
    layout: 'split' | 'overlay';
    backgroundColor: string;
    textColor: string;
    overlayOpacity: number;
    buttonText: string;
    link: string;
    source: 'featured' | 'latest' | 'offers' | 'bestsellers' | 'category' | 'manual';
    categoryId: number | null;
    productIds: number[];
    limit: number;
    items: HomeSectionItem[];
}
export interface StoreLayout {
    mobileColumns: number;
    cardImageFit: 'cover' | 'contain';
    cardImagePadding: number;
    cardImageRadius: number;
    cardImageAspect: 'square' | 'portrait' | 'landscape';
    detailImageFit: 'cover' | 'contain';
    useCustomHome: boolean;
    sections: HomeSection[];
}
export const defaultStoreLayout = (): StoreLayout => ({ mobileColumns: 2, cardImageFit: 'cover', cardImagePadding: 0, cardImageRadius: -1, cardImageAspect: 'square', detailImageFit: 'contain', useCustomHome: false, sections: [] });
export function newHomeSection(kind: HomeSection['kind']): HomeSection {
    return { id: crypto.randomUUID().replaceAll('-', ''), kind, enabled: true, title: ({ hero: 'اكتشف مجموعتنا', products: 'منتجات مختارة', banner: 'اختيارات تناسبك', features: 'لماذا تختارنا؟', brands: 'العلامات التجارية', categories: 'تسوق حسب القسم' })[kind], subtitle: '', eyebrow: '', imageUrl: '', mobileImageUrl: '', layout: 'split', backgroundColor: '', textColor: '', overlayOpacity: 20, buttonText: 'تسوق الآن', link: '/menu', source: 'featured', categoryId: null, productIds: [], limit: 8, items: [] };
}
