import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss'
})
export class LoadingStateComponent {
  @Input() mode: 'spinner' | 'cards' | 'kitchen' | 'orders' | 'table' = 'spinner';
  @Input() title: string = 'جاري تحميل البيانات...';
  @Input() subtitle: string = 'برجاء الانتظار لحظات حتى اكتمال التحديث';
  @Input() icon: string = 'bi-arrow-clockwise';
  @Input() count: number = 3;
  @Input() minHeight: string = '280px';

  get repeatArray(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
