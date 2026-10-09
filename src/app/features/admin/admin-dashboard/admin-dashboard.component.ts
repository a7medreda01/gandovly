import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { DashboardStats } from '../../../core/models/models';

import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingStateComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  stats = signal<DashboardStats | null>(null);
  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: s => {
        this.stats.set(s);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
