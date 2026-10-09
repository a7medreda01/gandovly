import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ImageUrlPipe } from '../../shared/pipes/image-url.pipe';
import {
  CreateOrderRequest,
  CustomerAddress,
  DeliveryZone,
  OrderQuoteResponse,
  OrderType,
  PaymentMethod
} from '../../core/models/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUrlPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  readonly cartService = inject(CartService);
  readonly orderService = inject(OrderService);
  readonly settingsService = inject(SettingsService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(NotificationService);
  private readonly router = inject(Router);

  // Form Fields
  customerName: string = '';
  customerPhone: string = '';
  orderType: OrderType = 'Delivery';
  paymentMethod: PaymentMethod = 'CashOnDelivery';
  notes: string = '';

  // Address
  city: string = 'القاهرة';
  district: string = '';
  streetAddress: string = '';

  // Saved Customer Addresses State
  savedAddresses = signal<CustomerAddress[]>([]);
  selectedAddressId = signal<number | null>(null);
  isCustomAddress = signal<boolean>(false);
  saveAddressToAccount = signal<boolean>(true);
  newAddressLabel = signal<string>('المنزل');
  isLoadingAddresses = signal<boolean>(false);

  // Delivery Zones
  deliveryZones = signal<DeliveryZone[]>([]);
  selectedZoneId: number | null = null;
  resolvedZoneName = signal<string | null>(null);
  zoneResolutionMessage = signal<string>('');
  isResolvingZone = signal<boolean>(false);

  // Server Quote
  serverQuote = signal<OrderQuoteResponse | null>(null);
  isCalculatingQuote = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);

  // Auth / OTP Modal State
  showAuthModal = signal<boolean>(false);
  authStep = signal<'info' | 'otp'>('info');
  authFullName: string = '';
  authPhone: string = '';
  authPassword: string = '';
  authOtpCode: string = '';
  isRequestingOtp = signal<boolean>(false);
  isVerifyingOtp = signal<boolean>(false);
  otpResendCountdown = signal<number>(0);
  private timerInterval: any = null;

  // Order Confirmation Modal State
  showConfirmModal = signal<boolean>(false);

  // Scheduled Order Timing State
  prepTimingType = signal<'Now' | 'Scheduled'>('Now');
  showScheduleModal = signal<boolean>(false);
  scheduleDateOption = signal<'today' | 'tomorrow' | 'custom'>('today');
  customScheduleDate: string = '';
  scheduleTime: string = '';
  scheduledForDate = signal<string | null>(null);
  scheduledDisplaySummary = signal<string>('');

  ngOnInit() {
    if (this.cartService.items().length === 0) {
      this.router.navigate(['/menu']);
      return;
    }

    // Prefill from authenticated user if available
    const user = this.authService.currentCustomer();
    if (user) {
      this.customerName = user.fullName || '';
      this.customerPhone = user.usernameOrPhone || '';
      this.loadSavedAddresses(user.userId || user.usernameOrPhone);
    }

    this.orderService.getDeliveryZones().subscribe(zones => {
      this.deliveryZones.set(zones || []);
      if (zones && zones.length > 0) {
        this.selectedZoneId = zones[0].id;
        this.fetchQuote();
      }
    });
  }

  loadSavedAddresses(identifier?: number | string) {
    const id = identifier || this.authService.currentCustomer()?.userId || this.authService.currentCustomer()?.usernameOrPhone || this.customerPhone;
    if (!id) return;

    this.isLoadingAddresses.set(true);
    this.authService.getCustomerAddresses(id).subscribe({
      next: (addresses) => {
        this.isLoadingAddresses.set(false);
        this.savedAddresses.set(addresses || []);
        if (addresses && addresses.length > 0) {
          const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
          this.selectSavedAddress(defaultAddr);
        } else {
          this.isCustomAddress.set(true);
          this.selectedAddressId.set(null);
        }
      },
      error: () => {
        this.isLoadingAddresses.set(false);
        this.isCustomAddress.set(true);
      }
    });
  }

  selectSavedAddress(addr: CustomerAddress) {
    this.selectedAddressId.set(addr.id);
    this.isCustomAddress.set(false);
    this.streetAddress = addr.streetAddress;
    this.district = addr.district;
    this.city = addr.city || 'القاهرة';

    if (addr.deliveryZoneId) {
      this.selectedZoneId = addr.deliveryZoneId;
      const matched = this.deliveryZones().find(z => z.id === addr.deliveryZoneId);
      if (matched) {
        this.resolvedZoneName.set(matched.name);
        this.zoneResolutionMessage.set(`تم تحديد المنطقة: ${matched.name} 🛵`);
      }
      this.fetchQuote();
    } else {
      this.onAddressChange();
    }
  }

  switchToNewAddress() {
    this.isCustomAddress.set(true);
    this.selectedAddressId.set(null);
    this.streetAddress = '';
    this.district = '';
    this.resolvedZoneName.set(null);
    this.zoneResolutionMessage.set('');
  }

  setOrderType(type: OrderType) {
    this.orderType = type;
    this.fetchQuote();
  }

  private addressDebounceTimer: any = null;

  onAddressChange() {
    const query = (this.streetAddress || '').trim();
    if (!query || this.orderType !== 'Delivery') return;

    if (this.addressDebounceTimer) clearTimeout(this.addressDebounceTimer);
    this.addressDebounceTimer = setTimeout(() => {
      this.isResolvingZone.set(true);
      this.orderService.resolveDeliveryZone(this.city, query).subscribe({
        next: (res: any) => {
          this.isResolvingZone.set(false);
          if (res.matchFound && res.resolvedZone) {
            this.selectedZoneId = res.resolvedZone.id;
            this.resolvedZoneName.set(res.resolvedZone.name);
            this.district = res.resolvedZone.name;
            this.zoneResolutionMessage.set(res.message);
            this.fetchQuote();
          } else {
            this.resolvedZoneName.set(null);
            this.zoneResolutionMessage.set(res.message);
          }
        },
        error: () => {
          this.isResolvingZone.set(false);
        }
      });
    }, 400);
  }

  // Alias for backward compatibility
  onDistrictChange() {
    this.onAddressChange();
  }

  onZoneSelected(zoneId: number) {
    this.selectedZoneId = zoneId;
    this.fetchQuote();
  }

  fetchQuote() {
    if (this.cartService.items().length === 0) return;

    this.isCalculatingQuote.set(true);
    const items = this.cartService.items().map(i => ({
      productId: i.product.id,
      quantityUnits: i.quantityUnits,
      customWeightGrams: i.customWeightGrams,
      preparationOptionId: i.selectedPrepOption?.id,
      modifierOptionIds: i.selectedModifiers.map(m => m.id),
      specialInstructions: i.specialInstructions
    }));

    this.orderService.calculateQuote({
      orderType: this.orderType,
      deliveryZoneId: this.orderType === 'Delivery' ? (this.selectedZoneId ?? undefined) : undefined,
      items
    }).subscribe({
      next: (quote: OrderQuoteResponse) => {
        this.serverQuote.set(quote);
        this.isCalculatingQuote.set(false);
      },
      error: (err: any) => {
        console.error('Error getting server quote', err);
        this.isCalculatingQuote.set(false);
      }
    });
  }

  get fullFormattedAddress(): string {
    const zone = this.resolvedZoneName() || this.selectedZone?.name || this.district;
    if (!this.streetAddress) return zone || '';
    if (zone && this.streetAddress.includes(zone)) {
      return this.streetAddress.trim();
    }
    const parts = [
      this.streetAddress.trim(),
      zone
    ].filter(p => p && p.trim().length > 0);

    return parts.join(' - ');
  }

  get selectedZone(): DeliveryZone | undefined {
    return this.deliveryZones().find(z => z.id === this.selectedZoneId);
  }

  // Calculation of Longest Item Prep Time + Delivery Duration
  get longestItemPrepTime(): { minutes: number; productName: string } {
    const items = this.cartService.items();
    if (!items || items.length === 0) {
      return { minutes: 25, productName: 'الوجبات البحرية' };
    }

    let maxTime = 0;
    let maxItemName = '';

    for (const item of items) {
      const itemTime = item.product.preparationTimeMinutes && item.product.preparationTimeMinutes > 0
        ? item.product.preparationTimeMinutes
        : 25;
      
      if (itemTime > maxTime) {
        maxTime = itemTime;
        maxItemName = item.product.nameAr;
      }
    }

    return { minutes: maxTime || 25, productName: maxItemName || items[0].product.nameAr };
  }

  get deliveryDurationMinutes(): number {
    if (this.orderType !== 'Delivery') return 0;
    return this.selectedZone?.estimatedDeliveryTimeMinutes && this.selectedZone.estimatedDeliveryTimeMinutes > 0
      ? this.selectedZone.estimatedDeliveryTimeMinutes
      : 30;
  }

  get totalEstimatedMinutes(): number {
    if (this.orderType === 'Pickup') {
      return this.longestItemPrepTime.minutes;
    }
    return this.longestItemPrepTime.minutes + this.deliveryDurationMinutes;
  }

  get isAddressDetermined(): boolean {
    if (this.orderType === 'Pickup') return true;
    return !!(this.selectedZoneId || this.resolvedZoneName() || this.streetAddress.trim());
  }

  get estimatedArrivalFormatted(): string {
    const totalMinutes = this.totalEstimatedMinutes;
    const now = new Date();
    const arrivalDate = new Date(now.getTime() + totalMinutes * 60 * 1000);
    
    let hours = arrivalDate.getHours();
    const minutes = arrivalDate.getMinutes();
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
    return `حوالي ${hours}:${minutesFormatted} ${ampm}`;
  }

  getModifiersSummary(item: any): string {
    if (!item?.selectedModifiers || item.selectedModifiers.length === 0) return '';
    return item.selectedModifiers.map((m: any) => m.nameAr).join('، ');
  }

  // Initiates checkout validations and triggers Auth or Confirmation Modal
  handleCheckoutClick() {
    if (!this.customerName.trim() && this.authService.currentCustomer()) {
      this.toast.error('يرجى إدخال اسم العميل.');
      return;
    }

    if (this.orderType === 'Delivery') {
      if (!this.streetAddress.trim()) {
        this.toast.error('يرجى إدخال العنوان بالتفصيل للتوصيل.');
        return;
      }
      if (!this.selectedZoneId) {
        this.toast.error('يرجى اختيار منطقة التوصيل.');
        return;
      }
    }

    const quote = this.serverQuote();
    if (quote && !quote.meetsMinimumOrder) {
      this.toast.error(`قيمة الطلب أقل من الحد الأدنى (${quote.minimumOrderRequired} ج.م).`);
      return;
    }

    // If user is not logged in, prompt Auth/OTP modal first
    if (!this.authService.currentCustomer()) {
      this.authFullName = this.customerName;
      this.authPhone = this.customerPhone;
      this.authStep.set('info');
      this.showAuthModal.set(true);
      return;
    }

    // User is logged in -> Open Order Confirmation Modal
    this.showConfirmModal.set(true);
  }

  // OTP Flow
  requestAuthOtp() {
    if (!this.authPhone.trim()) {
      this.toast.error('يرجى إدخال رقم الهاتف / الواتساب.');
      return;
    }

    this.isRequestingOtp.set(true);
    this.authService.requestOtp(this.authPhone.trim()).subscribe({
      next: () => {
        this.isRequestingOtp.set(false);
        this.toast.success('تم إرسال رمز التحقق عبر واتساب بنجاح 📲');
        this.authStep.set('otp');
        this.startOtpCountdown();
      },
      error: (err) => {
        this.isRequestingOtp.set(false);
        const msg = err?.error?.message || 'فشل إرسال رمز التحقق. يرجى التأكد من صحة الرقم.';
        this.toast.error(msg);
      }
    });
  }

  verifyAuthOtp() {
    if (!this.authOtpCode.trim()) {
      this.toast.error('يرجى إدخال رمز التحقق.');
      return;
    }

    this.isVerifyingOtp.set(true);
    const resolvedName = (this.authFullName || this.customerName || '').trim();
    this.authService.verifyOtp(this.authPhone.trim(), this.authOtpCode.trim(), resolvedName).subscribe({
      next: (res) => {
        this.isVerifyingOtp.set(false);
        this.toast.success('تم تسجيل الدخول وتأكيد الحساب بنجاح ✅');
        this.customerName = resolvedName || res.fullName || 'عميل جندوفلي';
        this.customerPhone = this.authPhone.trim();
        this.showAuthModal.set(false);
        this.loadSavedAddresses(res.userId || this.customerPhone);
        
        // Directly transition to Order Confirmation Modal
        this.showConfirmModal.set(true);
      },
      error: (err) => {
        this.isVerifyingOtp.set(false);
        const msg = err?.error?.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.';
        this.toast.error(msg);
      }
    });
  }

  startOtpCountdown() {
    this.otpResendCountdown.set(60);
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const current = this.otpResendCountdown();
      if (current <= 1) {
        clearInterval(this.timerInterval);
        this.otpResendCountdown.set(0);
      } else {
        this.otpResendCountdown.set(current - 1);
      }
    }, 1000);
  }

  closeAuthModal() {
    this.showAuthModal.set(false);
  }

  closeConfirmModal() {
    this.showConfirmModal.set(false);
  }

  // --- Scheduled Prep Flow ---
  openScheduleModal() {
    const now = new Date();
    this.scheduleDateOption.set('today');
    this.customScheduleDate = now.toISOString().split('T')[0];

    // Default to 1 hour from now rounded to next 15 minutes
    const target = new Date(now.getTime() + 60 * 60 * 1000);
    const remainder = target.getMinutes() % 15;
    if (remainder > 0) {
      target.setMinutes(target.getMinutes() + (15 - remainder));
    }
    const hours = String(target.getHours()).padStart(2, '0');
    const minutes = String(target.getMinutes()).padStart(2, '0');
    this.scheduleTime = `${hours}:${minutes}`;

    this.showScheduleModal.set(true);
  }

  closeScheduleModal() {
    this.showScheduleModal.set(false);
  }

  selectInstantPrep() {
    this.prepTimingType.set('Now');
    this.scheduledForDate.set(null);
    this.scheduledDisplaySummary.set('');
  }

  confirmSchedule() {
    if (!this.scheduleTime) {
      this.toast.error('يرجى تحديد وقت التجهيز المطلوب.');
      return;
    }

    const today = new Date();
    let targetDate = new Date();

    if (this.scheduleDateOption() === 'tomorrow') {
      targetDate.setDate(today.getDate() + 1);
    } else if (this.scheduleDateOption() === 'custom') {
      if (!this.customScheduleDate) {
        this.toast.error('يرجى اختيار التاريخ المحدد.');
        return;
      }
      const parts = this.customScheduleDate.split('-');
      targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }

    const [hrs, mins] = this.scheduleTime.split(':').map(Number);
    targetDate.setHours(hrs, mins, 0, 0);

    // Validate that schedule time is in future
    if (targetDate.getTime() <= Date.now() + 15 * 60 * 1000) {
      this.toast.error('يرجى اختيار موعد يبدأ بعد 15 دقيقة على الأقل من الآن.');
      return;
    }

    const isoString = targetDate.toISOString();
    this.scheduledForDate.set(isoString);
    this.prepTimingType.set('Scheduled');

    // Create friendly summary
    const dayName = targetDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeFormatted = targetDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    this.scheduledDisplaySummary.set(`${dayName} - الساعة ${timeFormatted}`);

    this.showScheduleModal.set(false);
    this.toast.success(`تم ضبط موعد التجهيز: ${this.scheduledDisplaySummary()} 🕒`);
  }

  // Final Order Submission
  confirmAndSubmitOrder() {
    this.isSubmitting.set(true);

    const isSched = this.prepTimingType() === 'Scheduled' && !!this.scheduledForDate();
    const finalNotes = isSched && this.scheduledDisplaySummary()
      ? `[طلب مجدول للتجهيز: ${this.scheduledDisplaySummary()}] ${this.notes.trim()}`.trim()
      : (this.notes.trim() || undefined);

    const request: CreateOrderRequest = {
      customerId: this.authService.currentCustomer()?.userId,
      customerName: this.customerName.trim(),
      customerPhone: this.customerPhone.trim(),
      orderType: this.orderType,
      paymentMethod: this.paymentMethod,
      deliveryZoneId: this.orderType === 'Delivery' ? (this.selectedZoneId ?? undefined) : undefined,
      deliveryAddress: this.orderType === 'Delivery' ? this.fullFormattedAddress : undefined,
      notes: finalNotes,
      scheduledFor: isSched ? this.scheduledForDate()! : undefined,
      items: this.cartService.items().map(i => ({
        productId: i.product.id,
        quantityUnits: i.quantityUnits,
        customWeightGrams: i.customWeightGrams,
        preparationOptionId: i.selectedPrepOption?.id,
        modifierOptionIds: i.selectedModifiers.map(m => m.id),
        specialInstructions: i.specialInstructions
      }))
    };

    this.orderService.createOrder(request).subscribe({
      next: (order: any) => {
        this.isSubmitting.set(false);
        this.showConfirmModal.set(false);
        this.cartService.clearCart();
        this.toast.success('تم إنشاء طلبك بنجاح! تم إرسال رسالة التأكيد عبر واتساب 🐟');

        // Auto-save new address to profile automatically as 'المنزل'
        if (this.orderType === 'Delivery' && (this.isCustomAddress() || !this.selectedAddressId())) {
          const user = this.authService.currentCustomer();
          const identifier = user?.userId || user?.usernameOrPhone || this.customerPhone.trim();
          if (identifier && this.streetAddress.trim()) {
            this.authService.addCustomerAddress(identifier, {
              label: 'المنزل',
              city: this.city || 'القاهرة',
              district: this.district || this.resolvedZoneName() || 'المنطقة المركزية',
              streetAddress: this.streetAddress.trim(),
              deliveryZoneId: this.selectedZoneId || undefined,
              isDefault: true
            }).subscribe({
              next: () => console.log('Address successfully auto-saved to account as default المنزل'),
              error: (e) => console.warn('Could not auto-save address', e)
            });
          }
        }

        this.router.navigate(['/account']);
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        const errMsg = err?.error?.message || 'حدث خطأ أثناء تأكيد الطلب. يرجى المحاولة ثانية.';
        this.toast.error(errMsg);
      }
    });
  }
}

