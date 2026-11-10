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
  readonly canManageUsers = computed(() => {
    const admin = this.authService.currentAdmin();
    if (!admin) return false;
    if (admin.canManageUsers === true) return true;
    return admin.role === 'SuperAdmin' || admin.role === 'Manager' || admin.role === 'Admin' || !admin.role;
  });
  readonly storeName = computed(() => this.settingsService.settings().restaurantName || 'المتجر');
  readonly storeLogo = computed(() => this.settingsService.settings().logoUrl || '');
  readonly storeLinks = computed(() => {
    const preset = this.settingsService.settings().activityPreset;
    const domain = this.settingsService.settings().defaultDomain;

    let commerceLabel = 'تشغيل النشاط';
    let commerceIcon = 'briefcase';

    if (preset === 'furniture' || (!preset && domain === 'GeneralRetail')) {
      commerceLabel = 'المعاينات والتشغيل';
      commerceIcon = 'shop-window';
    } else if (preset === 'pharmacy' || domain === 'Pharmacy') {
      commerceLabel = 'الروشتات والتشغيل';
      commerceIcon = 'capsule';
    } else if (preset === 'grocery' || preset === 'perishable' || domain === 'Supermarket') {
      commerceLabel = 'الصلاحيات والتشغيل';
      commerceIcon = 'calendar-check';
    } else if (preset === 'restaurant' || domain === 'Restaurant') {
      commerceLabel = 'الحجوزات والتشغيل';
      commerceIcon = 'calendar-event';
    } else if (preset === 'auto-parts' || domain === 'AutoParts') {
      commerceLabel = 'طلبات القطع والتشغيل';
      commerceIcon = 'gear-wide-connected';
    } else if (preset === 'electronics' || domain === 'Electronics') {
      commerceLabel = 'الأكواد والتشغيل';
      commerceIcon = 'laptop';
    } else if (preset === 'cars') {
      commerceLabel = 'المعاينات والتقسيط';
      commerceIcon = 'car-front';
    } else {
      commerceLabel = 'تشغيل النشاط';
      commerceIcon = 'briefcase';
    }

    return [
      { path: 'orders', icon: 'receipt', label: 'الطلبات' },
      { path: 'commerce', icon: commerceIcon, label: commerceLabel },
      { path: 'catalog', icon: 'grid', label: 'المنتجات والأقسام' },
      { path: 'delivery-zones', icon: 'geo-alt', label: 'مناطق التوصيل' },
      { path: 'reports', icon: 'bar-chart', label: 'التقارير' },
      { path: 'analytics', icon: 'graph-up', label: 'الزيارات والتحليلات' },
      { path: 'notifications', icon: 'bell', label: 'الإشعارات وواتساب' },
      { path: 'settings', icon: 'sliders', label: 'إعدادات المتجر' },
      { path: 'users', icon: 'people', label: 'المستخدمين والصلاحيات' }
    ];
  });

  get pageTitle(): string {
    const path = this.router.url.split('?')[0].split('/').pop();
    return ({ stores: 'المتاجر', dashboard: 'نظرة عامة', packages: 'القوالب والبيانات', users: 'المستخدمين والصلاحيات' } as Record<string, string>)[path || '']
      || this.storeLinks().find(link => link.path === path)?.label || 'لوحة الإدارة';
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
