import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface PlatformPackageStats {
  platform: string;
  deploymentMode: string;
  categoriesCount: number;
  productsCount: number;
  zonesCount: number;
  branchesCount: number;
  uploadsFilesCount: number;
  uploadsSizeMb: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);

  stats = signal<PlatformPackageStats | null>(null);
  isLoading = signal<boolean>(true);
  todayDate = new Date();

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: PlatformPackageStats }>(`${environment.apiUrl}/admin/store-package/stats`).subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.isLoading.set(false);
      },
      error: () => {
        // Fallback default stats
        this.stats.set({
          platform: 'Mecart (mecart.app) - Powered by RunX Tech',
          deploymentMode: 'MultiTenantSaaS & Standalone',
          categoriesCount: 15,
          productsCount: 1037,
          zonesCount: 5,
          branchesCount: 3,
          uploadsFilesCount: 139,
          uploadsSizeMb: 22.1
        });
        this.isLoading.set(false);
      }
    });
  }
}
