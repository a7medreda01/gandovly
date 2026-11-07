import { ChangeDetectorRef } from '@angular/core';
import { CommerceService } from '../../core/services/commerce.service';
import { OrderCommerceComponent } from '../../shared/components/order-commerce/order-commerce.component';
import { CatalogService } from '../../core/services/catalog.service';
import { GuestOrdersService } from '../../core/services/guest-orders.service';
import { from, of, Subscription } from 'rxjs';
import { catchError, mergeMap, toArray, map } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { SettingsService } from '../../core/services/settings.service';
import { CustomerAddress, CustomerProfile, DeliveryZone, Order, OrderStatus, Product, PreparationOption } from '../../core/models/models';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component';
import { StoreDialogDirective } from '../../shared/directives/store-dialog.directive';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [OrderCommerceComponent,CommonModule, FormsModule, RouterLink, LoadingStateComponent, PhoneInputComponent, StoreDialogDirective],
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
  readonly settingsService = inject(SettingsService);

  get currencySymbol(): string {
    return this.settingsService.settings().currencySymbol || 'ج.م';
  }

  readonly guestOrders=inject(GuestOrdersService);
  guestOrderList=signal<Order[]>([]);
  guestOrdersLoading=signal(false);
  guestOrdersError=signal(false);
  private guestRequests?:Subscription;
  guestTrackingUrl(order:Order){const url=new URL('/account',window.location.origin);const tenant=new URLSearchParams(window.location.search).get('tenant');if(tenant)url.searchParams.set('tenant',tenant);url.searchParams.set('track',order.publicTrackingToken);return url.href;}
  loadGuestOrders(){
    this.guestRequests?.unsubscribe();
    this.guestOrdersLoading.set(true);this.guestOrdersError.set(false);
    this.guestRequests=from(this.guestOrders.list()).pipe(mergeMap(row=>this.orderService.getOrderByTrackingToken(row.token).pipe(catchError(()=>{this.guestOrdersError.set(true);return of(null);})),4),toArray()).subscribe(rows=>{this.guestOrderList.set(rows.filter((o):o is Order=>!!o).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()));this.guestOrdersLoading.set(false);});
  }
  private readonly commerceCdr=inject(ChangeDetectorRef);readonly commerce=inject(CommerceService);inquiries:any[]=[];trackedInquiryToken='';
  loadInquiries(){from(this.commerce.inquiryTokens()).pipe(mergeMap(token=>this.commerce.inquiryStatus(token).pipe(map(row=>({...row,token})),catchError(()=>of(null))),4),toArray()).subscribe(rows=>{this.inquiries=rows.filter(Boolean);this.commerceCdr.markForCheck();});}
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
  readonly showGuestLogin = signal(false);
  isOtpSent = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  resendCountdown = signal<number>(30);
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
    city: '',
    district: '',
    streetAddress: '',
    buildingNumber: '',
    floor: '',
    apartment: '',
    landmark: '',
    isDefault: true
  };

  ngOnInit() {
    this.newAddress.city = this.settingsService.settings().city || '';
    this.checkCurrentProfile();
    if(!this.authService.currentCustomer())this.loadGuestOrders();
    this.loadDeliveryZones();
    this.handleRouteTracking();
    this.loadInquiries();
  }

  ngOnDestroy() {
    this.guestRequests?.unsubscribe();
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
    this.zoneResolutionVersion++;
    if (this.resolveTimer) clearTimeout(this.resolveTimer);
    this.isResolvingZone.set(false);
    const id = Number(zoneId);
    this.selectedZoneId.set(id);
    const z = this.deliveryZones().find(x => x.id === id);
    if (z) {
      this.resolvedZoneName.set(z.name);
      this.newAddress.district = z.name;
      this.zoneResolutionMessage.set('تم اختيار منطقة التوصيل: ' + z.name);
    }
  }

  private zoneResolutionVersion = 0;
  onAddressChange() {
    const version = ++this.zoneResolutionVersion;
    if (this.resolveTimer) clearTimeout(this.resolveTimer);
    const addr = this.newAddress.streetAddress.trim();
    if (!addr || addr.length < 3) return;

    if (this.resolveTimer) clearTimeout(this.resolveTimer);
    this.resolveTimer = setTimeout(() => {
      this.isResolvingZone.set(true);
      this.orderService.resolveDeliveryZone(this.newAddress.city || this.settingsService.settings().city || '', addr).subscribe({
        next: (res) => {
          if (version !== this.zoneResolutionVersion) return;
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
          if (version !== this.zoneResolutionVersion) return;
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
      case 'Preparing': return 'قيد التجهيز والتعبئة 📦';
      case 'ReadyForPickup': return 'جاهز للاستلام';
      case 'OutForDelivery': return 'خرج للتوصيل 🚚';
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
      const inquiry=params.get('inquiry');if(inquiry){this.trackedInquiryToken=inquiry;this.commerce.inquiryStatus(inquiry).subscribe({next:()=>{this.commerce.rememberInquiry(inquiry);this.loadInquiries();this.router.navigate([], {queryParams:{inquiry:null},queryParamsHandling:'merge',replaceUrl:true});}});}
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
          this.router.navigate(['/account'],{queryParams:{track:null,token:null,order:null,orderId:null,orderNumber:null},queryParamsHandling:'merge',replaceUrl:true});
          if(!this.authService.currentCustomer()){this.guestOrders.remember(token);this.loadGuestOrders();}
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
        if (res && res.existingCustomerName) {
          this.fullName = res.existingCustomerName;
        }
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
      error: (err) => {
        this.isLoading.set(false);
        const existingName = err?.error?.data?.existingCustomerName;
        if (existingName) {
          this.fullName = existingName;
        }
        const currentFailures = this.otpFailureCount() + 1;
        this.otpFailureCount.set(currentFailures);
        this.isOtpSent.set(true);
        this.startResendTimer();

        this.fallbackOtpCode.set(null);
        this.setDigitsFromCode('');
        const message = err?.error?.message || 'تعذر إرسال رمز التحقق. أعد المحاولة لاحقًا أو تواصل مع المتجر.';
        this.otpNoticeMessage.set(message);
        this.toast.error(message);
      }
    });
  }

  resendOtp() {
    this.sendOtp(true);
  }

  setDigitsFromCode(code: string) {
    this.otpCode = code.replace(/\D/g, '').slice(0, 6);
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
    this.fallbackOtpCode.set(null);
    this.otpNoticeMessage.set('');
  }

  verifyOtp() {
    if (this.isLoading()) return;
    if (this.otpCode.length !== 6) {
      this.toast.error('يرجى إدخال رمز التحقق.');
      return;
    }

    this.isLoading.set(true);
    this.authService.verifyOtp(this.phoneNumber.trim(), this.otpCode.trim(), this.fullName.trim()).subscribe({
      next: (_res: unknown) => {
        this.isLoading.set(false);
        this.showGuestLogin.set(false);
        this.toast.success('تم تسجيل الدخول.');
        this.checkCurrentProfile();
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' });
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
  private readonly catalog=inject(CatalogService);
  isReordering=signal(false);
  reorder(order: Order) {
    if(this.isReordering()||!order.orderLines?.length)return;
    this.isReordering.set(true);
    from(order.orderLines).pipe(mergeMap(line=>this.catalog.getProductById(line.productId).pipe(map(product=>({line,product})),catchError(()=>of(null))),4),toArray()).subscribe(rows=>{
      let added=0,skipped=0;
      for(const row of rows){
        if(!row?.product?.isAvailable){skipped++;continue;}
        const p=row.product,line=row.line;
        if(['Booking','Vehicle'].includes(p.commerce?.mode||'')){skipped++;continue;}
        const variant=p.variants?.find(v=>v.id===line.variantId);
        if(p.variants?.length&&(!variant||!variant.isAvailable||(variant.stockQuantity!=null&&variant.stockQuantity<line.quantityUnits))){skipped++;continue;}
        const prep=p.preparationGroups?.flatMap(g=>g.options).find(o=>o.nameAr===line.preparationOptionNameAr&&o.isAvailable);
        if(line.preparationOptionNameAr&&!prep){skipped++;continue;}
        const available=p.modifierGroups?.flatMap(g=>g.options)||[];
        const mods=(line.modifiers||[]).map(m=>available.find(o=>o.nameAr===m.modifierOptionNameAr&&o.isAvailable));
        if(mods.some(m=>!m)){skipped++;continue;}
        const selected=mods.filter((m):m is NonNullable<typeof m>=>!!m);
        if(p.modifierGroups?.some(g=>{const n=selected.filter(m=>g.options.some(o=>o.id===m.id)).length;return n<(g.isRequired?Math.max(1,g.minSelection):g.minSelection)||n>g.maxSelection;})||p.preparationGroups?.some(g=>g.isRequired&&!g.options.some(o=>o.id===prep?.id))){skipped++;continue;}
        this.cartService.addItem(p,line.quantityUnits,prep,selected,line.actualWeightGrams||line.estimatedWeightGrams,line.specialInstructions,undefined,undefined,variant);added++;
      }
      this.isReordering.set(false);
      if(added){this.toast.success('تمت إضافة '+added+' أصناف بالأسعار والخيارات الحالية.');this.cartService.openDrawer();}
      if(skipped)this.toast.info('بعض الأصناف أو خياراتها غير متاحة الآن. اخترها من صفحة المنتج من جديد.');
    });
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
    this.authService.addCustomerAddress(identifier, { ...this.newAddress, deliveryZoneId: this.selectedZoneId() || undefined }).subscribe({
      next: () => {
        this.isSavingAddress.set(false);
        this.toast.success('تمت إضافة العنوان بنجاح! 📍');
        this.showAddressModal.set(false);
        this.newAddress = {
          label: 'المنزل',
          city: this.settingsService.settings().city || '',
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
