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
        desc: 'تم تسجيل طلبك بنجاح وجاري إرساله للمطبخ',
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
        label: 'التحضير والطهي',
        desc: 'السمك طازة في التتبيل والطهي بالفرن أو الشواية',
        icon: 'bi-fire'
      },
      {
        key: isDelivery ? 'OutForDelivery' : 'ReadyForPickup',
        label: isDelivery ? 'خرج للتوصيل' : 'جاهز للاستلام',
        desc: isDelivery ? 'الطيار في الطريق إليك ومعه الطلب ساخن' : 'طلبك جاهز تماماً للاستلام من الفرع',
        icon: isDelivery ? 'bi-bicycle' : 'bi-bag-check-fill'
      },
      {
        key: 'Completed',
        label: 'تم التسليم',
        desc: 'بالهناء والشفاء! نتشرف دائماً بخدمتكم',
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
