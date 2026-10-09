import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { SettingsService } from '../../core/services/settings.service';
import { StatusTimelineComponent } from '../../shared/components/status-timeline/status-timeline.component';
import { Order } from '../../core/models/models';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusTimelineComponent],
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.scss'
})
export class OrderTrackingComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  readonly settingsService = inject(SettingsService);
  private readonly route = inject(ActivatedRoute);

  searchTokenInput: string = '';
  order = signal<Order | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.searchTokenInput = token;
        this.lookupOrder(token);
      }
    });
  }

  lookupOrder(tokenToSearch?: string) {
    const token = tokenToSearch || this.searchTokenInput.trim();
    if (!token) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.getOrderByTrackingToken(token).subscribe({
      next: (ord: Order) => {
        this.order.set(ord);
        this.isLoading.set(false);
      },
      error: (_err: unknown) => {
        this.order.set(null);
        this.errorMessage.set('لم يتم العثور على الطلب بالرمز المدخل. يرجى التأكد من الرمز.');
        this.isLoading.set(false);
      }
    });
  }

  hasWeightedItems(): boolean {
    const ord = this.order();
    if (!ord?.orderLines) return false;
    return ord.orderLines.some(
      l => (l.estimatedWeightGrams != null && l.estimatedWeightGrams > 0) ||
           (l.actualWeightGrams != null && l.actualWeightGrams > 0)
    );
  }
}
