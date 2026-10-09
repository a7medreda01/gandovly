import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import {
  CreateOrderRequest,
  DeliveryZone,
  Order,
  OrderQuoteRequest,
  OrderQuoteResponse,
  ResolveDeliveryZoneResponse
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly api = inject(ApiService);

  getDeliveryZones() {
    return this.api.get<DeliveryZone[]>('storefront/delivery-zones');
  }

  resolveDeliveryZone(city: string, districtOrAddress: string) {
    return this.api.post<ResolveDeliveryZoneResponse>('storefront/delivery-zone/resolve', {
      city,
      districtOrAddress
    });
  }

  calculateQuote(request: OrderQuoteRequest) {
    return this.api.post<OrderQuoteResponse>('storefront/orders/quote', request);
  }

  createOrder(request: CreateOrderRequest) {
    return this.api.post<Order>('orders', request);
  }

  getOrderByTrackingToken(token: string) {
    return this.api.get<Order>(`orders/track/${token}`);
  }

  getOrderById(id: number) {
    return this.api.get<Order>(`orders/${id}`);
  }

  getOrdersByPhone(phone: string) {
    return this.api.get<Order[]>(`orders/by-phone/${encodeURIComponent(phone)}`);
  }
}
