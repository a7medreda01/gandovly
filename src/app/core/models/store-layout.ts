export interface HomeSectionItem {
    number?: string;
    titleEn?: string;
    textEn?: string;
    title: string;
    text: string;
    icon: string;
    imageUrl: string;
    link: string;
}
export interface HomeSectionTestimonial {
    name: string;
    nameEn?: string;
    role?: string;
    roleEn?: string;
    text: string;
    textEn?: string;
    rating: number;
    avatarUrl?: string;
}
export interface HomeSectionSlide {
    titleEn?: string;
    subtitleEn?: string;
    buttonTextEn?: string;
    title: string;
    subtitle?: string;
    buttonText?: string;
    link?: string;
    imageUrl?: string;
    mobileImageUrl?: string;
    overlayOpacity?: number;
    textColor?: string;
}
export interface HomeSection {
    titleEn?: string;
    subtitleEn?: string;
    eyebrowEn?: string;
    buttonTextEn?: string;
    id: string;
    kind: 'hero' | 'products' | 'banner' | 'features' | 'brands' | 'categories'
        | 'product_carousel' | 'testimonials' | 'hero_slider' | 'categories_grid'
        | 'countdown' | 'newsletter' | 'stats' | 'cta_full' | 'video' | 'markdown';
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
    /** countdown target date ISO string (for countdown sections) */
    countdownTarget?: string;
    /** video embed URL or direct URL (for video sections) */
    videoUrl?: string;
    /** markdown/HTML content (for markdown sections) */
    markdownContent?: string;
    /** testimonials list (for testimonials sections) */
    testimonials?: HomeSectionTestimonial[];
    /** slides list (for hero_slider) */
    slides?: HomeSectionSlide[];
}
export interface HomeThemeBannerConfig {
    desktopUrl?: string;
    mobileUrl?: string;
    title?: string;
    titleEn?: string;
    subtitle?: string;
    subtitleEn?: string;
    buttonText?: string;
    buttonTextEn?: string;
    buttonLink?: string;
}
export interface StoreLayout {
    themeBanners?: Record<string, HomeThemeBannerConfig>;
    useBrandColors?: boolean;
    homeProfiles?: Record<string, { useCustomHome: boolean; sections: HomeSection[] }>;
    /** Presentation is deliberately separate from homepage section configuration. */
    homeTheme?: 'classic' | 'cards' | 'editorial' | 'discovery';
    showCustomerServicePhone?: boolean;
    showHomeSearch?: boolean;
    showMobileBottomNav?: boolean;
    homeTitleEn?: string;
    homeSubtitleEn?: string;
    homeButtonTextEn?: string;
    homeCategoriesTitleEn?: string;
    homeFeaturedTitleEn?: string;
    homeCategoryGridTitleEn?: string;
    restaurantNameEn?: string;
    taglineEn?: string;
    descriptionEn?: string;
    currencySymbolEn?: string;
    addressEn?: string;
    cityEn?: string;
    activePromotionBannerEn?: string;
    estimatedWeightDisclaimerEn?: string;
    pauseMessageEn?: string;
    promoBannerLink?: string;
    promoBannerBtnText?: string;
    promoBannerBtnTextEn?: string;
    productCardStyle?: 'modern' | 'bordered' | 'minimal';
    discountBadgeMode?: 'percent' | 'amount' | 'both';
    stickyHeader?: boolean;
    whatsappDefaultMessage?: string;
    whatsappDefaultMessageEn?: string;
    emptyCartText?: string;
    emptyCartTextEn?: string;
    emptyWishlistText?: string;
    emptyWishlistTextEn?: string;
    emptySearchText?: string;
    emptySearchTextEn?: string;
    mobileColumns: number;
    cardImageFit: 'cover' | 'contain';
    cardImagePadding: number;
    cardImageRadius: number;
    cardImageAspect: 'square' | 'portrait' | 'landscape';
    detailImageFit: 'cover' | 'contain';
    detailImageAspect?: 'square' | 'portrait' | 'landscape' | 'auto';
    onlineOrdering?: boolean;
    showOrdersPage?: boolean;
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
    enableImageCompression?: boolean;
    maxImageCompressionKb?: number;
    orderNumberMode?: 'random' | 'continuous' | 'daily' | 'weekly' | 'monthly' | null;
    orderNumberStart?: number;
    useCustomHome: boolean;
    sections: HomeSection[];
}
export const defaultStoreLayout = (): StoreLayout => ({ homeTheme: 'classic', mobileColumns: 2, cardImageFit: 'cover', cardImagePadding: 0, cardImageRadius: -1, cardImageAspect: 'square', detailImageFit: 'contain', detailImageAspect: 'square', enableProductPageAnimations: true, enableProductCardAnimations: true, enableHomeSectionAnimations: true, enableImageCompression: true, maxImageCompressionKb: 150, showCustomerServicePhone: false, showHomeSearch: true, showMobileBottomNav: true, showOrdersPage: true, productCardStyle: 'modern', discountBadgeMode: 'percent', stickyHeader: true, promoBannerLink: '/menu', useCustomHome: false, sections: [] });
export function newHomeSection(kind: HomeSection['kind']): HomeSection {
    const titles: Record<HomeSection['kind'], string> = {
        hero: 'اكتشف مجموعتنا',
        products: 'منتجات مختارة',
        banner: 'اختيارات تناسبك',
        features: 'لماذا تختارنا؟',
        brands: 'العلامات التجارية',
        categories: 'تسوق حسب القسم',
        product_carousel: 'منتجات مميزة',
        testimonials: 'آراء عملائنا',
        hero_slider: 'أحدث عروض المتجر',
        categories_grid: 'تصفح التشكيلات',
        countdown: 'عرض لفترة محدودة',
        newsletter: 'اشترك في النشرة',
        stats: 'أرقام وإنجازات',
        cta_full: 'تواصل معنا الآن',
        video: 'شاهد الفيديو',
        markdown: 'محتوى مخصص',
    };
    const s: HomeSection = {
        id: crypto.randomUUID().replaceAll('-', ''),
        kind,
        enabled: true,
        title: titles[kind] ?? kind,
        subtitle: '',
        eyebrow: '',
        imageUrl: '',
        mobileImageUrl: '',
        layout: 'split',
        backgroundColor: '',
        textColor: '',
        overlayOpacity: 20,
        buttonText: 'تسوق الآن',
        link: '/menu',
        source: 'featured',
        categoryId: null,
        productIds: [],
        limit: 8,
        items: []
    };
    if (kind === 'hero_slider') {
        s.slides = [
            { title: '', subtitle: '', buttonText: 'تسوق الآن', link: '/menu', imageUrl: '', mobileImageUrl: '', overlayOpacity: 30 }
        ];
    } else if (kind === 'testimonials') {
        s.testimonials = [
            { name: '', role: 'عميل موثق', text: '', rating: 5 }
        ];
    }
    return s;
}
