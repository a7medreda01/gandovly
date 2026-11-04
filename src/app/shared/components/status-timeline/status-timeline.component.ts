import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderStatus, OrderType } from '../../../core/models/models';

@Component({
  selector: 'app-status-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-timeline.component.html',
  styleUrl: './status-timeline.component.scss'
})
export class StatusTimelineComponent {
  @Input({ required: true }) currentStatus!: OrderStatus;
  @Input() orderType: OrderType = 'Delivery';

  get steps() {
    const isDelivery = this.orderType === 'Delivery';
    return [
      {
        key: 'Placed',
        label: 'تم الاستلام',
        desc: 'تم تسجيل طلبك بنجاح وجاري إرساله للمستودع والعمليات',
        icon: 'bi-receipt-cutoff'
      },
      {
        key: 'Confirmed',
        label: 'تم التأكيد',
        desc: 'تمت مراجعة الطلب والموافقة على التجهيز',
        icon: 'bi-patch-check-fill'
      },
      {
        key: 'Preparing',
        label: 'التجهيز والتغليف',
        desc: 'جاري تجهيز وتعبئة المنتجات وفحص الجودة بعناية',
        icon: 'bi-box-seam'
      },
      {
        key: isDelivery ? 'OutForDelivery' : 'ReadyForPickup',
        label: isDelivery ? 'خرج للتوصيل' : 'جاهز للاستلام',
        desc: isDelivery ? 'مندوب التوصيل في الطريق إلى عنوانك' : 'طلبك جاهز تماماً للاستلام من الفرع',
        icon: isDelivery ? 'bi-truck' : 'bi-shop'
      },
      {
        key: 'Completed',
        label: 'تم التسليم بنجاح',
        desc: 'نسعد دائماً بخدمتكم ونتمنى لكم تجربة تسوق رائعة!',
        icon: 'bi-check2-all'
      }
    ];
  }

  get currentStepInfo() {
    const s = this.steps.find(step => this.isStepCurrent(step.key));
    return s || this.steps[0];
  }

  isStepCompleted(stepKey: string): boolean {
    const statusOrder = ['Placed', 'AwaitingConfirmation', 'Confirmed', 'Preparing', 'ReadyForPickup', 'OutForDelivery', 'Completed'];
    const currentIndex = statusOrder.indexOf(this.currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);
    return currentIndex >= stepIndex && currentIndex !== -1;
  }

  isStepCurrent(stepKey: string): boolean {
    if (this.currentStatus === 'AwaitingConfirmation' && stepKey === 'Placed') return true;
    return this.currentStatus === stepKey;
  }
}
