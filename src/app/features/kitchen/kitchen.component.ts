import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderLine, OrderStatus } from '../../core/models/models';

import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent],
  templateUrl: './kitchen.component.html',
  styleUrl: './kitchen.component.scss'
})
export class KitchenComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(NotificationService);

  orders = signal<Order[]>([]);
  isLoading = signal<boolean>(false);
  selectedOrder = signal<Order | null>(null);

  // Live Elapsed Timer
  currentTime = signal<Date>(new Date());
  private timerInterval?: any;

  // Bi-directional weight & price buffers
  qtyInputs: { [orderLineId: number]: number } = {};
  weightInputs: { [orderLineId: number]: number } = {};
  priceInputs: { [orderLineId: number]: number } = {};

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
  }

  getElapsedTime(createdAt: string | Date | undefined): string {
    if (!createdAt) return '';
    const now = this.currentTime().getTime();
    const created = new Date(createdAt).getTime();
    const diffSec = Math.max(0, Math.floor((now - created) / 1000));

    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);

    if (hours > 0) {
      return `${hours}س ${minutes}د`;
    }
    if (minutes > 0) {
      return `${minutes} دقيقة`;
    }
    return `الآن (<1 د)`;
  }

  getElapsedMinutes(createdAt: string | Date | undefined): number {
    if (!createdAt) return 0;
    const now = this.currentTime().getTime();
    const created = new Date(createdAt).getTime();
    return Math.floor((now - created) / 60000);
  }

  getTimerClass(createdAt: string | Date | undefined): string {
    const mins = this.getElapsedMinutes(createdAt);
    if (mins >= 35) return 'timer-critical';
    if (mins >= 20) return 'timer-warning';
    return 'timer-normal';
  }

  formatScheduledDate(scheduledFor: string | Date | undefined): string {
    if (!scheduledFor) return '';
    try {
      const d = new Date(scheduledFor);
      return d.toLocaleDateString('ar-EG', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(scheduledFor);
    }
  }

  loadOrders() {
    this.isLoading.set(true);
    this.adminService.getKitchenOrders().subscribe({
      next: (ords: Order[]) => {
        this.orders.set(ords || []);
        // Initialize weight & price buffers
        ords?.forEach(o => this.initOrderBuffers(o));
        // If an order was currently selected in modal, update its reference
        if (this.selectedOrder()) {
          const fresh = ords?.find(o => o.id === this.selectedOrder()!.id);
          if (fresh) {
            this.selectedOrder.set(fresh);
            this.initOrderBuffers(fresh);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  initOrderBuffers(order: Order) {
    order.orderLines?.forEach(l => {
      if (this.isLineByWeight(l)) {
        this.qtyInputs[l.id] = l.quantityUnits || 1;
        const initialGrams = l.actualWeightGrams || l.estimatedWeightGrams || 500;
        this.weightInputs[l.id] = initialGrams;
        const initialPrice = l.finalLineTotal || l.estimatedLineTotal || this.calculatePriceFromWeight(l, initialGrams);
        this.priceInputs[l.id] = Math.round(initialPrice * 100) / 100;
      }
    });
  }

  openOrderModal(order: Order) {
    this.initOrderBuffers(order);
    this.selectedOrder.set(order);
  }

  closeOrderModal() {
    this.selectedOrder.set(null);
  }

  hasWeightItems(order: Order): boolean {
    return order.orderLines?.some(l => this.isLineByWeight(l)) || false;
  }

  isLineByWeight(line: OrderLine): boolean {
    return line.pricingType === 'ByWeight';
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

  getCalculatedOrderSubtotal(order: Order): number {
    let subtotal = 0;
    order.orderLines?.forEach(l => {
      if (this.isLineByWeight(l)) {
        subtotal += this.priceInputs[l.id] ?? l.finalLineTotal ?? l.estimatedLineTotal ?? 0;
      } else {
        subtotal += l.finalLineTotal ?? l.estimatedLineTotal ?? 0;
      }
    });
    return Math.round(subtotal * 100) / 100;
  }

  updateStatus(order: Order, newStatus: OrderStatus) {
    this.adminService.updateOrderStatus(order.id, newStatus, 'تحديث من شاشة المطبخ', 'المطبخ').subscribe({
      next: () => {
        this.toast.success(`تم تحديث حالة الطلب #${order.orderNumber} إلى ${this.getStatusLabel(newStatus)}`);
        this.loadOrders();
      },
      error: () => {
        this.toast.error('حدث خطأ أثناء تحديث الحالة.');
      }
    });
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

    this.adminService.updateActualWeights(order.id, items, 'المطبخ', 'تم إدخال الوزن الفعلي والعدد من شاشة المطبخ').subscribe({
      next: (updated: Order) => {
        this.toast.success(`تم تسجيل الأوزان وتحديث إجمالي الفاتورة: ${updated.finalTotal || updated.estimatedTotal} ج.م`);
        this.initOrderBuffers(updated);
        this.loadOrders();
      },
      error: () => {
        this.toast.error('فشل حفظ الأوزان الفعلية.');
      }
    });
  }

  getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case 'Placed': return 'جديد';
      case 'AwaitingConfirmation': return 'بانتظار التأكيد';
      case 'Confirmed': return 'تم التأكيد';
      case 'Preparing': return 'قيد الطهي';
      case 'ReadyForPickup': return 'جاهز للاستلام';
      case 'OutForDelivery': return 'خرج للتوصيل';
      case 'Completed': return 'مكتمل';
      case 'Cancelled': return 'ملغي';
      default: return status;
    }
  }

  printOrderTicket(order: Order) {
    window.print();
  }
}
