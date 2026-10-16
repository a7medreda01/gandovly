import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { SalesReport, WeightVarianceReport } from '../../../core/models/models';

import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, LoadingStateComponent],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss'
})
export class AdminReportsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  activeTab: 'sales' | 'variance' = 'sales';
  salesReport = signal<SalesReport | null>(null);
  varianceReport = signal<WeightVarianceReport[]>([]);
  isLoading = signal<boolean>(false);

  getMaxSoldQuantity(): number {
    const list = this.salesReport()?.topSellingProducts;
    if (!list || list.length === 0) return 1;
    return Math.max(...list.map(p => p.quantitySold), 1);
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.adminService.getSalesReport().subscribe(s => this.salesReport.set(s));
    this.adminService.getWeightVarianceReport().subscribe(v => {
      this.varianceReport.set(v || []);
      this.isLoading.set(false);
    });
  }
}
