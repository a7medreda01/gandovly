export interface HomeSectionItem {
    titleEn?: string;
    textEn?: string;
    title: string;
    text: string;
    icon: string;
    imageUrl: string;
    link: string;
}
export interface HomeSection {
    titleEn?: string;
    subtitleEn?: string;
    eyebrowEn?: string;
    buttonTextEn?: string;
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
    homeTitleEn?: string;
    homeSubtitleEn?: string;
    homeButtonTextEn?: string;
    homeCategoriesTitleEn?: string;
    homeFeaturedTitleEn?: string;
    homeCategoryGridTitleEn?: string;
    mobileColumns: number;
    cardImageFit: 'cover' | 'contain';
    cardImagePadding: number;
    cardImageRadius: number;
    cardImageAspect: 'square' | 'portrait' | 'landscape';
    detailImageFit: 'cover' | 'contain';
    detailImageAspect?: 'square' | 'portrait' | 'landscape' | 'auto';
    onlineOrdering?: boolean;
    guestCheckout?: boolean;
    showFooterStoreName?: boolean;
    navbarLogoWidth?: number;
    navbarLogoHeight?: number;
    footerLogoWidth?: number;
    footerLogoHeight?: number;
    modalImageHeight?: number;
    enableProductPageAnimations?: boolean;
    enableProductCardAnimations?: boolean;
    enableHomeSectionAnimations?: boolean;
    orderNumberMode?: 'random' | 'continuous' | 'daily' | 'weekly' | 'monthly' | null;
    orderNumberStart?: number;
    useCustomHome: boolean;
    sections: HomeSection[];
}
export const defaultStoreLayout = (): StoreLayout => ({ mobileColumns: 2, cardImageFit: 'cover', cardImagePadding: 0, cardImageRadius: -1, cardImageAspect: 'square', detailImageFit: 'contain', detailImageAspect: 'square', enableProductPageAnimations: true, enableProductCardAnimations: true, enableHomeSectionAnimations: true, useCustomHome: false, sections: [] });
export function newHomeSection(kind: HomeSection['kind']): HomeSection {
    return { id: crypto.randomUUID().replaceAll('-', ''), kind, enabled: true, title: ({ hero: 'اكتشف مجموعتنا', products: 'منتجات مختارة', banner: 'اختيارات تناسبك', features: 'لماذا تختارنا؟', brands: 'العلامات التجارية', categories: 'تسوق حسب القسم' })[kind], subtitle: '', eyebrow: '', imageUrl: '', mobileImageUrl: '', layout: 'split', backgroundColor: '', textColor: '', overlayOpacity: 20, buttonText: 'تسوق الآن', link: '/menu', source: 'featured', categoryId: null, productIds: [], limit: 8, items: [] };
}
