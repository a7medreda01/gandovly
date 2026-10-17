// API Response Envelopes
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
  traceId: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Enums
export type PricingType = 'FixedPerUnit' | 'ByWeight';
export type PreparationPricingType = 'AddOn' | 'FinalPrice';
export type OrderType = 'Delivery' | 'Pickup';
export type OrderStatus =
  | 'Placed'
  | 'AwaitingConfirmation'
  | 'Confirmed'
  | 'Preparing'
  | 'ReadyForPickup'
  | 'OutForDelivery'
  | 'Completed'
  | 'Cancelled'
  | 'Rejected';
export type PaymentMethod = 'CashOnDelivery' | 'CardOnDelivery' | 'OnlinePayment';
export type PaymentStatus = 'CashDue' | 'Pending' | 'Paid' | 'Failed' | 'Refunded';

// Settings
export interface StorefrontSettings {
  restaurantName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  heroBannerDesktopUrl: string;
  heroBannerMobileUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  facebookUrl?: string;
  instagramUrl?: string;
  currencyCode: string;
  currencySymbol: string;
  timeZone: string;
  locale: string;
  isOrdersOpen: boolean;
  pauseMessage?: string;
  minimumOrderAmount: number;
  defaultDeliveryFee: number;
  isFreeDeliveryEnabled: boolean;
  freeDeliveryMinOrderAmount?: number;
  isTieredDiscountEnabled: boolean;
  tieredDiscountThresholdAmount: number;
  tieredDiscountPercentage: number;
  isFlatDiscountEnabled: boolean;
  flatDiscountPercentage: number;
  activePromotionBanner?: string;
  estimatedWeightDisclaimer: string;
  termsAndPrivacyText?: string;
  branches: Branch[];
}

export interface Branch {
  id: number;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  workingHoursText: string;
}

// Catalog
export interface PreparationOption {
  id: number;
  groupId: number;
  nameAr: string;
  nameEn?: string;
  description?: string;
  pricingType: PreparationPricingType;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
}

export interface PreparationOptionGroup {
  id: number;
  nameAr: string;
  nameEn?: string;
  description?: string;
  isRequired: boolean;
  maxSelection: number;
  displayOrder: number;
  options: PreparationOption[];
}

export interface ModifierOption {
  id: number;
  groupId: number;
  nameAr: string;
  nameEn?: string;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
}

export interface ModifierGroup {
  id: number;
  nameAr: string;
  nameEn?: string;
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  displayOrder: number;
  options: ModifierOption[];
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryNameAr?: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  imageUrl?: string;
  secondaryImageUrl?: string;
  images?: ProductImage[];
  pricingType: PricingType;
  pricePerUnit: number;
  pricePerKg?: number;
  averageUnitWeightGrams?: number;
  allowOrderByPieces: boolean;
  allowOrderByWeight: boolean;
  preparationTimeMinutes: number;
  allergyNotice?: string;
  displayOrder: number;
  isAvailable: boolean;
  stockQuantity?: number;
  updatedAt?: string | Date;
  preparationGroups: PreparationOptionGroup[];
  modifierGroups: ModifierGroup[];
}

export interface MenuCategory {
  id: number;
  nameAr: string;
  nameEn?: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  products: Product[];
}

// Delivery Zones
export type ZoneLevel = 'Macro' | 'Sub' | 'Micro';

export interface DeliveryZone {
  id: number;
  name: string;
  city: string;
  parentZoneId?: number;
  parentZoneName?: string;
  level: ZoneLevel;
  neighborhoodKeywords: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTimeMinutes: number;
  isActive: boolean;
  displayOrder: number;
  subZones?: DeliveryZone[];
}

export interface ResolveDeliveryZoneResponse {
  matchFound: boolean;
  resolvedZone?: DeliveryZone;
  candidateZones: DeliveryZone[];
  message: string;
}

// Cart Item
export interface CartItem {
  id: string; // Unique cart line uuid
  product: Product;
  quantityUnits: number;
  customWeightGrams?: number;
  orderMode?: 'pieces' | 'weight';
  selectedPrepOption?: PreparationOption;
  selectedModifiers: ModifierOption[];
  specialInstructions?: string;
  estimatedWeightGrams?: number;
  estimatedUnitPrice: number;
  estimatedLineTotal: number;
}

// Orders
export interface CreateOrderLineRequest {
  productId: number;
  quantityUnits: number;
  customWeightGrams?: number;
  preparationOptionId?: number;
  modifierOptionIds: number[];
  specialInstructions?: string;
}

export interface CreateOrderRequest {
  customerId?: number;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  deliveryZoneId?: number;
  deliveryAddress?: string;
  notes?: string;
  scheduledFor?: string;
  items: CreateOrderLineRequest[];
}

export interface OrderQuoteRequest {
  orderType: OrderType;
  deliveryZoneId?: number;
  items: CreateOrderLineRequest[];
}

export interface OrderQuoteLine {
  productId: number;
  productNameAr: string;
  quantityUnits: number;
  estimatedWeightGrams?: number;
  estimatedUnitPrice: number;
  estimatedLineTotal: number;
}

export interface OrderQuoteResponse {
  estimatedSubtotal: number;
  deliveryFee: number;
  discountAmount: number;
  discountDescription?: string;
  isFreeDelivery: boolean;
  estimatedTotal: number;
  totalEstimatedWeightGrams: number;
  meetsMinimumOrder: boolean;
  minimumOrderRequired: number;
  disclaimer: string;
  lines: OrderQuoteLine[];
}

export interface OrderLineModifier {
  id: number;
  modifierOptionNameAr: string;
  priceSnapshot: number;
}

export interface OrderLine {
  id: number;
  productId: number;
  productNameAr: string;
  pricingType: PricingType;
  unitPriceSnapshot: number;
  quantityUnits: number;
  averageUnitWeightGramsSnapshot?: number;
  estimatedWeightGrams?: number;
  actualWeightGrams?: number;
  estimatedLineTotal: number;
  finalLineTotal?: number;
  preparationOptionNameAr?: string;
  preparationPricingType: PreparationPricingType;
  preparationPriceSnapshot: number;
  specialInstructions?: string;
  modifiers: OrderLineModifier[];
}

export interface OrderStatusHistory {
  id: number;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  publicTrackingToken: string;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryZoneId?: number;
  deliveryZoneName?: string;
  deliveryAddress?: string;
  deliveryFee: number;
  discountAmount: number;
  discountDescription?: string;
  estimatedSubtotal: number;
  estimatedTotal: number;
  totalEstimatedWeightGrams?: number;
  finalSubtotal?: number;
  finalTotal?: number;
  totalActualWeightGrams?: number;
  notes?: string;
  kitchenNotes?: string;
  createdAt: string;
  scheduledFor?: string;
  confirmedAt?: string;
  completedAt?: string;
  orderLines: OrderLine[];
  statusHistories: OrderStatusHistory[];
}

// Auth
export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  message: string;
  role?: string;
  usernameOrPhone?: string;
  fullName?: string;
  userId?: number;
}

export interface CustomerAddress {
  id: number;
  label: string;
  city: string;
  district: string;
  streetAddress: string;
  buildingNumber?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  isDefault: boolean;
  deliveryZoneId?: number;
}

export interface CustomerProfile {
  id: number;
  phoneNumber: string;
  fullName: string;
  email?: string;
  addresses: CustomerAddress[];
}

// Reports
export interface DashboardStats {
  todayOrdersCount: number;
  todayTotalRevenue: number;
  activeOrdersCount: number;
  kitchenPendingOrdersCount: number;
  averageOrderValue: number;
  topProductsToday: {
    productId: number;
    productNameAr: string;
    quantitySold: number;
    totalRevenue: number;
  }[];
}

export interface SalesReport {
  fromDate: string;
  toDate: string;
  totalOrders: number;
  totalEstimatedRevenue: number;
  totalFinalRevenue: number;
  totalDeliveryFees: number;
  cancelledOrdersCount: number;
  topSellingProducts: {
    productId: number;
    productNameAr: string;
    quantitySold: number;
    totalRevenue: number;
  }[];
}

export interface WeightVarianceReport {
  orderId: number;
  orderNumber: string;
  productNameAr: string;
  estimatedWeightGrams: number;
  actualWeightGrams: number;
  varianceGrams: number;
  estimatedPrice: number;
  finalPrice: number;
  priceDifference: number;
  orderDate: string;
}

export interface WhatsAppGatewaySettings {
  isEnabled: boolean;
  baseUrl: string;
  hasApiKeyConfigured: boolean;
  apiKey?: string;
  sendOnOrderPlaced?: boolean;
  sendOnOrderConfirmed: boolean;
  sendOnKitchenWeighed: boolean;
  sendOnOutForDelivery: boolean;
  sendOnOrderCompleted: boolean;
  sendOnOrderCancelled: boolean;
  notifyCashierOnNewOrder?: boolean;
  cashierWhatsAppNumber?: string;
  cashierNotificationDelaySeconds?: number;
}

// WhatsApp Campaigns & Marketing
export interface MarketingContact {
  id: number;
  fullName: string;
  phoneNumber: string;
  normalizedPhone: string;
  source?: string;
  totalCampaignsReceived: number;
  lastMessagedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface ExcelContactRow {
  fullName: string;
  phoneNumber: string;
  notes?: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface ExcelImportResult {
  totalRowsFound: number;
  validCount: number;
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  sourceFileName: string;
  previewRows: ExcelContactRow[];
}

export type WhatsAppCampaignStatus = 'Draft' | 'Running' | 'Paused' | 'Completed' | 'Cancelled';
export type WhatsAppCampaignLogStatus = 'Pending' | 'Sent' | 'Failed' | 'Skipped';

export interface WhatsAppCampaign {
  id: number;
  title: string;
  messageTemplate: string;
  status: WhatsAppCampaignStatus;
  intervalMinutes: number;
  dailyLimit: number;
  excludePreviouslyMessaged: boolean;
  totalTargetCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  progressPercentage: number;
  startedAt?: string;
  completedAt?: string;
  nextScheduledDispatchAt?: string;
  lastDispatchedAt?: string;
  consecutiveFailureCount?: number;
  autoResumeAt?: string;
  pauseReason?: string;
  batchSentCount?: number;
  createdAt: string;
  createdBy?: string;
}

export interface WhatsAppCampaignLog {
  id: number;
  campaignId: number;
  contactId?: number;
  recipientName: string;
  recipientPhone: string;
  messageText: string;
  status: WhatsAppCampaignLogStatus;
  externalMessageId?: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export interface WhatsAppCampaignDetail extends WhatsAppCampaign {
  logs: WhatsAppCampaignLog[];
}

export interface CreateCampaignRequest {
  title: string;
  messageTemplate: string;
  intervalMinutes: number;
  dailyLimit: number;
  excludePreviouslyMessaged: boolean;
  targetSourceFilter?: string;
}

export interface UpdateCampaignRequest {
  title: string;
  messageTemplate: string;
  intervalMinutes: number;
  dailyLimit?: number;
}

export interface PostDeliverySettings {
  isEnabled: boolean;
  delayHours: number;
  messageTemplate: string;
}

export interface PeriodTraffic {
  periodLabel: string;
  totalVisits: number;
  uniqueVisitors: number;
  totalOrders: number;
  conversionRate: number;
  totalRevenue: number;
  growthPercentage: number;
}

export interface DailyVisitChartPoint {
  date: string;
  dayNameAr: string;
  visits: number;
  uniqueVisitors: number;
  orders: number;
  revenue: number;
}

export interface HourlyTrafficPoint {
  hour: number;
  hourLabel: string;
  visits: number;
}

export interface TopVisitedPage {
  path: string;
  pageNameAr: string;
  visits: number;
  percentage: number;
}

export interface DeviceBreakdown {
  mobileCount: number;
  desktopCount: number;
  tabletCount: number;
  mobilePercent: number;
  desktopPercent: number;
}

export interface VisitAnalytics {
  today: PeriodTraffic;
  yesterday: PeriodTraffic;
  thisWeek: PeriodTraffic;
  lastWeek: PeriodTraffic;
  thisMonth: PeriodTraffic;
  lastMonth: PeriodTraffic;
  overallVisits: number;
  overallUniqueVisitors: number;
  overallOrders: number;
  overallConversionRate: number;
  dailyTrend: DailyVisitChartPoint[];
  hourlyDistribution: HourlyTrafficPoint[];
  topPages: TopVisitedPage[];
  devices: DeviceBreakdown;
}

