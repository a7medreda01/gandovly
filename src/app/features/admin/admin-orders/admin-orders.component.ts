import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Order, OrderLine, OrderStatus } from '../../../core/models/models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { parseUtcDate, formatEgyptTime, formatEgyptDateTime, formatElapsedTime } from '../../../shared/utils/date-utils';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(NotificationService);

  orders = signal<Order[]>([]);
  totalCount = signal<number>(0);
  selectedStatus: OrderStatus | '' = '';
  searchTerm: string = '';
  isLoading = signal<boolean>(false);

  // Pagination state (Backend Pagination)
  pageIndex = signal<number>(1);
  pageSize = signal<number>(20);
  readonly pageSizeOptions = [10, 20, 50, 100];

  totalPages = computed(() => {
    const total = this.totalCount();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  fromItemIndex = computed(() => {
    if (this.totalCount() === 0) return 0;
    return (this.pageIndex() - 1) * this.pageSize() + 1;
  });

  toItemIndex = computed(() => {
    return Math.min(this.pageIndex() * this.pageSize(), this.totalCount());
  });

  // Live Elapsed Timer
  currentTime = signal<Date>(new Date());
  private timerInterval?: any;

  // Selected Order for Modal
  selectedOrder = signal<Order | null>(null);

  // Bi-directional weight & price buffers
  qtyInputs: { [orderLineId: number]: number } = {};
  weightInputs: { [orderLineId: number]: number } = {};
  priceInputs: { [orderLineId: number]: number } = {};

  // Search Debounce
  private searchTimeout?: any;

  ngOnInit() {
    this.loadOrders();
    this.timerInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  getElapsedTime(createdAt: string | Date | undefined): string {
    return formatElapsedTime(createdAt, this.currentTime());
  }

  getElapsedMinutes(createdAt: string | Date | undefined): number {
    if (!createdAt) return 0;
    const now = this.currentTime().getTime();
    const created = parseUtcDate(createdAt).getTime();
    return Math.floor((now - created) / 60000);
  }

  getTimerClass(createdAt: string | Date | undefined, status?: OrderStatus | string): string {
    if (this.isTerminalStatus(status)) {
      return 'timer-normal';
    }
    const mins = this.getElapsedMinutes(createdAt);
    if (mins >= 35) return 'timer-critical';
    if (mins >= 20) return 'timer-warning';
    return 'timer-normal';
  }

  formatOrderTime(createdAt: string | Date | undefined): string {
    return formatEgyptTime(createdAt);
  }

  formatScheduledDate(scheduledFor: string | Date | undefined): string {
    return formatEgyptDateTime(scheduledFor);
  }

  onSearchInput() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.pageIndex.set(1);
      this.loadOrders();
    }, 350);
  }

  clearSearch() {
    this.searchTerm = '';
    this.pageIndex.set(1);
    this.loadOrders();
  }

  onStatusChange() {
    this.pageIndex.set(1);
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading.set(true);
    const statusParam = this.selectedStatus ? (this.selectedStatus as OrderStatus) : undefined;
    const search = this.searchTerm ? this.searchTerm.trim() : undefined;

    this.adminService.getOrders(
      statusParam,
      undefined,
      undefined,
      search,
      this.pageIndex(),
      this.pageSize()
    ).subscribe({
      next: paged => {
        this.orders.set(paged.items || []);
        this.totalCount.set(paged.totalCount);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  goToPage(page: number | string) {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPages() || page === this.pageIndex()) return;
    this.pageIndex.set(page);
    this.loadOrders();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    if (this.pageIndex() < this.totalPages()) {
      this.goToPage(this.pageIndex() + 1);
    }
  }

  prevPage() {
    if (this.pageIndex() > 1) {
      this.goToPage(this.pageIndex() - 1);
    }
  }

  onPageSizeChange(newSize: any) {
    this.pageSize.set(Number(newSize));
    this.pageIndex.set(1);
    this.loadOrders();
  }

  getPageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const current = this.pageIndex();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (current > 3) {
      pages.push('...');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }
    pages.push(total);

    return pages;
  }

  isTerminalStatus(status: OrderStatus | string | undefined): boolean {
    if (!status) return false;
    return status === 'Completed' || status === 'Cancelled' || status === 'Rejected';
  }

  viewOrder(ord: Order) {
    this.adminService.getOrderById(ord.id).subscribe({
      next: fullOrder => {
        if (fullOrder) {
          this.initBuffers(fullOrder);
          this.selectedOrder.set(fullOrder);
        }
      },
      error: () => {
        this.initBuffers(ord);
        this.selectedOrder.set(ord);
      }
    });
  }

  closeModal() {
    this.selectedOrder.set(null);
  }

  initBuffers(order: Order) {
    order.orderLines?.forEach(l => {
      if (this.isLineByWeight(l)) {
        this.qtyInputs[l.id] = l.quantityUnits || 1;
        const grams = l.actualWeightGrams || l.estimatedWeightGrams || 500;
        this.weightInputs[l.id] = grams;
        const price = l.finalLineTotal || l.estimatedLineTotal || this.calculatePriceFromWeight(l, grams);
        this.priceInputs[l.id] = Math.round(price * 100) / 100;
      }
    });
  }

  hasWeightItems(order: Order): boolean {
    return order.orderLines?.some(l => this.isLineByWeight(l)) || false;
  }

  isLineByWeight(line: OrderLine): boolean {
    return line.pricingType === 'ByWeight';
  }

  getLineUnitPrice(line: OrderLine): number {
    const total = (this.isLineByWeight(line) ? this.priceInputs[line.id] : null) 
      ?? line.finalLineTotal 
      ?? line.estimatedLineTotal 
      ?? 0;
    const qty = (this.isLineByWeight(line) ? this.qtyInputs[line.id] : null) 
      ?? line.quantityUnits 
      ?? 1;
    if (qty <= 0) return total;
    return Math.round((total / qty) * 100) / 100;
  }

  calculatePriceFromWeight(line: OrderLine, grams: number, qtyUnits?: number): number {
    const unitPriceKg = line.unitPriceSnapshot || 0;
    const qty = qtyUnits ?? this.qtyInputs[line.id] ?? line.quantityUnits ?? 1;
    const prepCost = (line.preparationPriceSnapshot || 0) * qty;
    const modCost = (line.modifiers?.reduce((sum, m) => sum + (m.priceSnapshot || 0), 0) || 0) * qty;
    const fishCost = (grams / 1000) * unitPriceKg;
    return Math.round((fishCost + prepCost + modCost) * 100) / 100;
  }

  calculateWeightFromPrice(line: OrderLine, price: number, qtyUnits?: number): number {
    const unitPriceKg = line.unitPriceSnapshot || 0;
    if (unitPriceKg <= 0) return 0;
    const qty = qtyUnits ?? this.qtyInputs[line.id] ?? line.quantityUnits ?? 1;
    const prepCost = (line.preparationPriceSnapshot || 0) * qty;
    const modCost = (line.modifiers?.reduce((sum, m) => sum + (m.priceSnapshot || 0), 0) || 0) * qty;
    const fishCost = Math.max(0, price - prepCost - modCost);
    return Math.round((fishCost / unitPriceKg) * 1000);
  }

  onQtyChanged(line: OrderLine, qty: number | null) {
    const validQty = Math.max(1, Number(qty) || 1);
    this.qtyInputs[line.id] = validQty;
    const currentGrams = this.weightInputs[line.id] || line.actualWeightGrams || line.estimatedWeightGrams || 500;
    this.priceInputs[line.id] = this.calculatePriceFromWeight(line, currentGrams, validQty);
  }

  onWeightChanged(line: OrderLine, grams: number | null) {
    const validGrams = Math.max(0, Number(grams) || 0);
    this.weightInputs[line.id] = validGrams;
    const newPrice = this.calculatePriceFromWeight(line, validGrams);
    this.priceInputs[line.id] = newPrice;
  }

  onPriceChanged(line: OrderLine, price: number | null) {
    const validPrice = Math.max(0, Number(price) || 0);
    this.priceInputs[line.id] = validPrice;
    const newGrams = this.calculateWeightFromPrice(line, validPrice);
    this.weightInputs[line.id] = newGrams;
  }

  getCalculatedOrderTotal(order: Order): number {
    let subtotal = 0;
    order.orderLines?.forEach(l => {
      if (this.isLineByWeight(l)) {
        subtotal += this.priceInputs[l.id] ?? l.finalLineTotal ?? l.estimatedLineTotal ?? 0;
      } else {
        subtotal += l.finalLineTotal ?? l.estimatedLineTotal ?? 0;
      }
    });
    return Math.round((subtotal + (order.deliveryFee || 0)) * 100) / 100;
  }

  saveActualWeights(order: Order) {
    const items = order.orderLines
      .filter(l => this.isLineByWeight(l))
      .map(l => ({
        orderLineId: l.id,
        actualWeightGrams: this.weightInputs[l.id] || l.estimatedWeightGrams || 500,
        quantityUnits: this.qtyInputs[l.id] || l.quantityUnits || 1
      }));

    if (items.length === 0) {
      this.toast.info('الطلب لا يحتوي على أصناف بالوزن.');
      return;
    }

    this.adminService.updateActualWeights(order.id, items, 'الإدارة', 'تم تحديث الوزن الفعلي والعدد وإعادة احتساب الفاتورة').subscribe({
      next: (updated: Order) => {
        this.toast.success(`تم حفظ الأوزان والكميات بنجاح. الإجمالي الجديد: ${updated.finalTotal || updated.estimatedTotal} ج.م`);
        this.selectedOrder.set(updated);
        this.initBuffers(updated);
        this.loadOrders();
      },
      error: () => this.toast.error('فشل حفظ الأوزان الفعلية.')
    });
  }

  updateOrderStatus(orderId: number, status: OrderStatus) {
    this.adminService.updateOrderStatus(orderId, status).subscribe({
      next: updated => {
        this.toast.success(`تم تحديث حالة الطلب #${updated.orderNumber} إلى ${this.getStatusLabel(status)}`);
        this.selectedOrder.set(updated);
        this.loadOrders();
      },
      error: () => this.toast.error('حدث خطأ أثناء تحديث حالة الطلب.')
    });
  }

  resendNotification(orderId: number) {
    this.adminService.resendNotification(orderId).subscribe({
      next: () => this.toast.success('تمت إعادة إرسال إشعار الواتساب للعميل بنجاح 💬'),
      error: () => this.toast.error('فشل إرسال إشعار الواتساب.')
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Placed: 'تم استلام الطلب',
      AwaitingConfirmation: 'بانتظار التأكيد',
      Confirmed: 'تم التأكيد',
      Preparing: 'قيد الطهي والتجهيز',
      ReadyForPickup: 'جاهز للاستلام',
      OutForDelivery: 'خرج للتوصيل',
      Completed: 'تم التسليم بنجاح',
      Cancelled: 'ملغي',
      Rejected: 'مرفوض'
    };
    return map[status] || status;
  }

  printOrder(order: Order) {
    window.print();
  }
}
