import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';
import { isPlatformContext } from '../../core/services/store-context';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  readonly isPlatform = computed(() => isPlatformContext() && this.authService.currentAdmin()?.isPlatformAdmin === true);
  readonly storeName = computed(() => this.settingsService.settings().restaurantName || 'المتجر');
  readonly storeLogo = computed(() => this.settingsService.settings().logoUrl || '');
  readonly storeLinks = [
    { path: 'orders', icon: 'receipt', label: 'الطلبات' },
    { path: 'catalog', icon: 'grid', label: 'المنتجات والأقسام' },
    { path: 'delivery-zones', icon: 'geo-alt', label: 'مناطق التوصيل' },
    { path: 'reports', icon: 'bar-chart', label: 'التقارير' },
    { path: 'analytics', icon: 'graph-up', label: 'الزيارات والتحليلات' },
    { path: 'notifications', icon: 'bell', label: 'الإشعارات وواتساب' },
    { path: 'settings', icon: 'sliders', label: 'إعدادات المتجر' }
  ];
  get pageTitle(): string {
    const path = this.router.url.split('?')[0].split('/').pop();
    return ({ stores: 'المتاجر', dashboard: 'نظرة عامة', packages: 'القوالب والبيانات' } as Record<string, string>)[path || '']
      || this.storeLinks.find(link => link.path === path)?.label || 'لوحة الإدارة';
  }

  todayDate = new Date();
  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar() {
    this.isSidebarOpen = false;
  }

  logout() {
    this.authService.revokeAdminSession().subscribe({
      next: () => { this.authService.logoutAdmin(); this.router.navigate(['/admin/login']); },
      error: () => { this.authService.logoutAdmin(); this.router.navigate(['/admin/login']); }
    });
  }
}
