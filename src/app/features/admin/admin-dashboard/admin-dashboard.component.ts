import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
@Component({ selector: 'app-admin-dashboard', standalone: true, imports: [CommonModule, RouterLink], templateUrl: './admin-dashboard.component.html', styleUrl: './admin-dashboard.component.scss' })
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  stores = signal<any[]>([]);
  isLoading = signal(true);
  error = signal('');
  totalProducts = computed(() => this.stores().reduce((sum, store) => sum + store.productsCount, 0));
  activeStores = computed(() => this.stores().filter(store => store.status === 'Active').length);
  ngOnInit() { this.loadStats(); }
  loadStats() {
    this.isLoading.set(true);
    this.error.set('');
    this.api.get<any[]>('admin/tenants').subscribe({
      next: stores => { this.stores.set(stores); this.isLoading.set(false); },
      error: () => { this.error.set('تعذر تحميل الإحصائيات. أعد المحاولة.'); this.isLoading.set(false); }
    });
  }
}
