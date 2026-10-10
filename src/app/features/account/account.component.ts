import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { CustomerAddress, CustomerProfile, DeliveryZone, Order, OrderStatus, Product, PreparationOption } from '../../core/models/models';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingStateComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss'
})
export class AccountComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly toast = inject(NotificationService);
  private readonly orderService = inject(OrderService);
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Tabs
  activeTab = signal<'orders' | 'addresses'>('orders');

  // Orders
  customerOrders = signal<Order[]>([]);
  isLoadingOrders = signal<boolean>(false);
  selectedOrder = signal<Order | null>(null);

  // OTP Login Flow
  phoneNumber: string = '';
  otpCode: string = '';
  fullName: string = '';
  isOtpSent = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  resendCountdown = signal<number>(30);
  otpDigits: string[] = ['', '', '', '', '', ''];
  fallbackOtpCode = signal<string | null>(null);
  otpNoticeMessage = signal<string>('');
  otpFailureCount = signal<number>(0);
  private resendTimer?: any;
  private resolveTimer?: any;

  // Profile data
  profile = signal<CustomerProfile | null>(null);

  // Delivery Zones & Auto-Resolution
  deliveryZones = signal<DeliveryZone[]>([]);
  selectedZoneId = signal<number | null>(null);
  resolvedZoneName = signal<string | null>(null);
  isResolvingZone = signal<boolean>(false);
  zoneResolutionMessage = signal<string>('');

  // New address form
  showAddressModal = signal<boolean>(false);
  isSavingAddress = signal<boolean>(false);
  newAddress = {
    label: 'المنزل',
    city: 'الجيزة',
    district: '',
    streetAddress: '',
    buildingNumber: '',
    floor: '',
    apartment: '',
    landmark: '',
    isDefault: true
  };

  ngOnInit() {
    this.checkCurrentProfile();
    this.loadDeliveryZones();
    this.handleRouteTracking();
  }

  ngOnDestroy() {
    if (this.resendTimer) clearInterval(this.resendTimer);
    if (this.resolveTimer) clearTimeout(this.resolveTimer);
  }

  loadDeliveryZones() {
    this.orderService.getDeliveryZones().subscribe({
      next: (zones) => {
        if (zones && zones.length > 0) {
          this.deliveryZones.set(zones);
          if (!this.selectedZoneId()) {
            this.selectedZoneId.set(zones[0].id);
            this.newAddress.district = zones[0].name;
          }
        }
      }
    });
  }

  onZoneSelected(zoneId: any) {
    const id = Number(zoneId);
    this.selectedZoneId.set(id);
    const z = this.deliveryZones().find(x => x.id === id);
    if (z) {
      this.resolvedZoneName.set(z.name);
      this.newAddress.district = z.name;
    }
  }

  onAddressChange() {
    const addr = this.newAddress.streetAddress.trim();
    if (!addr || addr.length < 3) return;

    if (this.resolveTimer) clearTimeout(this.resolveTimer);
    this.resolveTimer = setTimeout(() => {
      this.isResolvingZone.set(true);
      this.orderService.resolveDeliveryZone(this.newAddress.city || 'الجيزة', addr).subscribe({
        next: (res) => {
          this.isResolvingZone.set(false);
          if (res?.matchFound && res.resolvedZone) {
            this.resolvedZoneName.set(res.resolvedZone.name);
            this.selectedZoneId.set(res.resolvedZone.id);
            this.newAddress.district = res.resolvedZone.name;
            this.zoneResolutionMessage.set(`تم التعرف تلقائيًا على منطقة: ${res.resolvedZone.name}`);
          } else {
            this.resolvedZoneName.set(null);
            this.zoneResolutionMessage.set('تعذر التعرف التلقائي، يرجى اختيار المنطقة يدويًا');
          }
        },
        error: () => {
          this.isResolvingZone.set(false);
        }
      });
    }, 500);
  }

  checkCurrentProfile() {
    const user = this.authService.currentCustomer();
    if (user && user.userId && user.role === 'Customer') {
      this.authService.getCustomerProfile(user.userId).subscribe({
        next: (p) => this.profile.set(p),
        error: () => {}
      });
      this.loadUserOrders(user.usernameOrPhone);
    }
  }

  loadUserOrders(phone?: string) {
    const targetPhone = phone || this.authService.currentCustomer()?.usernameOrPhone || '';
    if (!targetPhone) return;
    this.isLoadingOrders.set(true);

    this.orderService.getOrdersByPhone(targetPhone).subscribe({
      next: (orders) => {
        this.isLoadingOrders.set(false);
        if (orders) {
          this.customerOrders.set(orders);
        }
      },
      error: () => {
        this.isLoadingOrders.set(false);
      }
    });
  }

  getOrderItemsSummary(ord: Order): string {
    if (!ord || !ord.orderLines || ord.orderLines.length === 0) return 'لا توجد أصناف';
    return ord.orderLines.map(l => `${l.productNameAr} (×${l.quantityUnits})`).join('، ');
  }

  getStatusStepIndex(status: OrderStatus | string): number {
    switch (status) {
      case 'Placed':
      case 'AwaitingConfirmation':
        return 1;
      case 'Confirmed':
      case 'Preparing':
        return 2;
      case 'ReadyForPickup':
      case 'OutForDelivery':
        return 3;
      case 'Completed':
        return 4;
      case 'Cancelled':
        return -1;
      default:
        return 1;
    }
  }

  getStatusLabel(status: OrderStatus | string): string {
    switch (status) {
      case 'Placed': return 'تم استلام الطلب';
      case 'AwaitingConfirmation': return 'بانتظار التأكيد';
      case 'Confirmed': return 'تم التأكيد';
      case 'Preparing': return 'قيد التحضير والوزن بالمطبخ 🍳';
      case 'ReadyForPickup': return 'جاهز للاستلام';
      case 'OutForDelivery': return 'خرج للتوصيل مع الدليفري 🛵';
      case 'Completed': return 'تم التسليم بنجاح ✅';
      case 'Cancelled': return 'تم إلغاء الطلب ❌';
      default: return status;
    }
  }

  closeOrderDetails() {
    this.selectedOrder.set(null);
  }

  openOrderDetails(order: Order) {
    this.selectedOrder.set(order);
  }

  handleRouteTracking() {
    // 1. Check path parameter (e.g. /track/:token)
    const routeToken = this.route.snapshot.paramMap.get('token');
    if (routeToken) {
      this.fetchAndOpenOrderByToken(routeToken);
      return;
    }

    // 2. Check query parameters (e.g. /account?track=:token or /account?order=:id)
    this.route.queryParamMap.subscribe(params => {
      const trackToken = params.get('track') || params.get('token');
      const orderId = params.get('order') || params.get('orderId');
      const orderNumber = params.get('orderNumber');

      if (trackToken) {
        this.fetchAndOpenOrderByToken(trackToken);
      } else if (orderId) {
        this.fetchAndOpenOrderById(Number(orderId));
      } else if (orderNumber) {
        this.fetchAndOpenOrderByNumber(orderNumber);
      }
    });
  }

  fetchAndOpenOrderByToken(token: string) {
    this.isLoadingOrders.set(true);
    this.orderService.getOrderByTrackingToken(token).subscribe({
      next: (order) => {
        this.isLoadingOrders.set(false);
        if (order) {
          this.selectedOrder.set(order);
          if (order.customerPhone && !this.phoneNumber) {
            this.phoneNumber = order.customerPhone;
          }
        }
      },
      error: () => {
        this.isLoadingOrders.set(false);
        this.toast.error('لم نتمكن من جلب تفاصيل هذا الطلب عبر الرابط.');
      }
    });
  }

  fetchAndOpenOrderById(id: number) {
    this.isLoadingOrders.set(true);
    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.isLoadingOrders.set(false);
        if (order) {
          this.selectedOrder.set(order);
        }
      },
      error: () => {
        this.isLoadingOrders.set(false);
      }
    });
  }

  fetchAndOpenOrderByNumber(orderNumber: string) {
    const existing = this.customerOrders().find(o => o.orderNumber === orderNumber);
    if (existing) {
      this.selectedOrder.set(existing);
    }
  }

  startResendTimer() {
    this.resendCountdown.set(30);
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      if (this.resendCountdown() > 0) {
        this.resendCountdown.update(v => v - 1);
      } else {
        clearInterval(this.resendTimer);
      }
    }, 1000);
  }

  sendOtp(isRetry: boolean = false) {
    if (!this.phoneNumber.trim()) {
      this.toast.error('يرجى إدخال رقم الهاتف.');
      return;
    }

    this.isLoading.set(true);
    this.authService.requestOtp(this.phoneNumber.trim(), isRetry).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.isOtpSent.set(true);
        this.startResendTimer();
        if (res && res.fallbackCode) {
          this.fallbackOtpCode.set(res.fallbackCode);
          this.setDigitsFromCode(res.fallbackCode);
          this.otpNoticeMessage.set('تعذر إرسال الواتساب. يمكنك استخدام كود التأكيد المباشر أدناه لإتمام الدخول فوراً.');
          this.toast.info('تم توفير كود تأكيد مباشر لإكمال الدخول ✅');
        } else {
          this.fallbackOtpCode.set(null);
          this.otpNoticeMessage.set('');
          this.otpFailureCount.set(0);
          this.toast.success('تم إرسال كود التحقق بنجاح إلى هاتفك 💬');
        }
      },
      error: () => {
        this.isLoading.set(false);
        const currentFailures = this.otpFailureCount() + 1;
        this.otpFailureCount.set(currentFailures);
        this.isOtpSent.set(true);
        this.startResendTimer();

        if (currentFailures >= 2) {
          this.fallbackOtpCode.set('123456');
          this.setDigitsFromCode('123456');
          this.otpNoticeMessage.set('نعتذر عن عدم وصول رسالة الواتساب. استخدم كود التأكيد 123456 لتأكيد الدخول فوراً.');
          this.toast.info('استخدم كود التأكيد 123456 لإتمام الدخول مباشرة.');
        } else {
          this.otpNoticeMessage.set('فشل إرسال الكود عبر واتساب. برجاء الضغط على إعادة الإرسال مرة أخرى.');
          this.toast.error('فشل إرسال الكود عبر واتساب. برجاء الضغط على إعادة الإرسال مرة أخرى.');
        }
      }
    });
  }

  resendOtp() {
    this.sendOtp(true);
  }

  setDigitsFromCode(code: string) {
    const chars = code.split('').slice(0, 6);
    for (let i = 0; i < 6; i++) {
      this.otpDigits[i] = chars[i] || '';
    }
    this.otpCode = code;
  }

  useFallbackCode() {
    const code = this.fallbackOtpCode();
    if (code) {
      this.setDigitsFromCode(code);
      this.verifyOtp();
    }
  }

  async pasteFromClipboard() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits) {
          this.setDigitsFromCode(digits);
          this.toast.success('تم لصق الكود بنجاح 📋');
          if (digits.length === 6) {
            this.verifyOtp();
          }
        }
      }
    } catch {
      this.toast.info('يرجى كتابة الكود في الخانات المخصصة.');
    }
  }

  changePhone() {
    this.isOtpSent.set(false);
    this.otpCode = '';
    this.otpDigits = ['', '', '', '', '', ''];
    this.fallbackOtpCode.set(null);
    this.otpNoticeMessage.set('');
  }

  onDigitInput(event: any, index: number) {
    const val = (event.target as HTMLInputElement).value;
    if (val) {
      const clean = val.replace(/\D/g, '');
      this.otpDigits[index] = clean.slice(-1);
      (event.target as HTMLInputElement).value = this.otpDigits[index];
      if (index < 5 && clean) {
        const nextInput = document.getElementById(`digit_${index + 1}`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
    } else {
      this.otpDigits[index] = '';
    }
    this.otpCode = this.otpDigits.join('');
  }

  onDigitKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`digit_${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.otpDigits[index - 1] = '';
        this.otpCode = this.otpDigits.join('');
      }
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const clean = pasted.replace(/\D/g, '').slice(0, 6);
    if (!clean) return;

    for (let i = 0; i < 6; i++) {
      this.otpDigits[i] = clean[i] || '';
      const input = document.getElementById(`digit_${i}`) as HTMLInputElement;
      if (input) input.value = this.otpDigits[i];
    }
    this.otpCode = this.otpDigits.join('');
    const lastFilled = Math.min(clean.length, 5);
    const targetInput = document.getElementById(`digit_${lastFilled}`) as HTMLInputElement;
    if (targetInput) targetInput.focus();
  }

  verifyOtp() {
    if (!this.otpCode.trim()) {
      this.toast.error('يرجى إدخال رمز التحقق.');
      return;
    }

    this.isLoading.set(true);
    this.authService.verifyOtp(this.phoneNumber.trim(), this.otpCode.trim(), this.fullName.trim()).subscribe({
      next: (_res: unknown) => {
        this.isLoading.set(false);
        this.toast.success('تم تسجيل الدخول بنجاح! مرحباً بك.');
        this.checkCurrentProfile();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.toast.error(err?.error?.message || 'رمز التحقق غير صحيح.');
      }
    });
  }

  logout() {
    this.authService.logoutCustomer();
    this.profile.set(null);
    this.customerOrders.set([]);
    this.isOtpSent.set(false);
    this.otpCode = '';
    this.toast.info('تم تسجيل الخروج بنجاح.');
  }

  // Reorder functionality
  reorder(order: Order) {
    if (!order.orderLines || order.orderLines.length === 0) {
      this.toast.error('لا توجد أصناف في هذا الطلب لإعادة طلبها.');
      return;
    }

    let addedCount = 0;
    for (const line of order.orderLines) {
      const dummyProduct: Product = {
        id: line.productId,
        categoryId: 0,
        nameAr: line.productNameAr,
        pricingType: line.pricingType,
        pricePerUnit: line.unitPriceSnapshot,
        pricePerKg: line.pricingType === 'ByWeight' ? line.unitPriceSnapshot : undefined,
        averageUnitWeightGrams: line.averageUnitWeightGramsSnapshot || 500,
        allowOrderByPieces: true,
        allowOrderByWeight: true,
        preparationTimeMinutes: 25,
        displayOrder: 1,
        isAvailable: true,
        preparationGroups: [],
        modifierGroups: []
      };

      let prepOption: PreparationOption | undefined = undefined;
      if (line.preparationOptionNameAr) {
        prepOption = {
          id: 0,
          groupId: 0,
          nameAr: line.preparationOptionNameAr,
          pricingType: line.preparationPricingType || 'AddOn',
          price: line.preparationPriceSnapshot || 0,
          isAvailable: true,
          displayOrder: 1
        };
      }

      this.cartService.addItem(
        dummyProduct,
        line.quantityUnits,
        prepOption,
        [],
        line.actualWeightGrams || line.estimatedWeightGrams,
        line.specialInstructions
      );
      addedCount++;
    }

    this.toast.success(`تمت إضافة ${addedCount} أصناف من الطلب #${order.orderNumber} إلى السلة! 🛒`);
    this.cartService.openDrawer();
  }

  saveAddress() {
    const user = this.authService.currentCustomer();
    const identifier = user?.userId || user?.usernameOrPhone;
    if (!identifier) {
      this.toast.error('يرجى تسجيل الدخول أولاً لإضافة العنوان.');
      return;
    }

    if (!this.newAddress.streetAddress.trim()) {
      this.toast.error('يرجى إدخال تفاصيل العنوان بالتفصيل.');
      return;
    }

    if (!this.newAddress.district.trim() && this.selectedZoneId()) {
      const matched = this.deliveryZones().find(z => z.id === this.selectedZoneId());
      if (matched) this.newAddress.district = matched.name;
    }

    this.isSavingAddress.set(true);
    this.authService.addCustomerAddress(identifier, this.newAddress).subscribe({
      next: () => {
        this.isSavingAddress.set(false);
        this.toast.success('تمت إضافة العنوان بنجاح! 📍');
        this.showAddressModal.set(false);
        this.newAddress = {
          label: 'المنزل',
          city: 'الجيزة',
          district: this.deliveryZones()[0]?.name || '',
          streetAddress: '',
          buildingNumber: '',
          floor: '',
          apartment: '',
          landmark: '',
          isDefault: false
        };
        this.resolvedZoneName.set(null);
        this.zoneResolutionMessage.set('');
        this.checkCurrentProfile();
      },
      error: (err: any) => {
        this.isSavingAddress.set(false);
        const msg = err?.error?.message || 'حدث خطأ أثناء حفظ العنوان.';
        this.toast.error(msg);
      }
    });
  }

  deleteAddress(addressId: number) {
    const user = this.authService.currentCustomer();
    const identifier = user?.userId || user?.usernameOrPhone;
    if (!identifier) return;

    this.authService.deleteCustomerAddress(identifier, addressId).subscribe({
      next: () => {
        this.toast.success('تم حذف العنوان.');
        this.checkCurrentProfile();
      }
    });
  }
}
