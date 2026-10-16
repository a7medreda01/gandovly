import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { VisitAnalytics, PeriodTraffic, DailyVisitChartPoint, HourlyTrafficPoint, TopVisitedPage, DeviceBreakdown } from '../../../core/models/models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingStateComponent],
  templateUrl: './admin-analytics.component.html',
  styleUrl: './admin-analytics.component.scss'
})
export class AdminAnalyticsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(NotificationService);

  isLoading = signal<boolean>(false);
  activePeriod = signal<'today' | 'week' | 'month'>('week');
  analytics = signal<VisitAnalytics | null>(null);

  // Selected period summary computed
  currentPeriodData = computed<PeriodTraffic | null>(() => {
    const data = this.analytics();
    if (!data) return null;
    switch (this.activePeriod()) {
      case 'today':
        return data.today;
      case 'week':
        return data.thisWeek;
      case 'month':
        return data.thisMonth;
      default:
        return data.thisWeek;
    }
  });

  // Daily max visits for SVG chart scaling
  maxDailyVisits = computed<number>(() => {
    const data = this.analytics();
    if (!data || !data.dailyTrend || data.dailyTrend.length === 0) return 100;
    const max = Math.max(...data.dailyTrend.map(d => d.visits));
    return max > 0 ? max : 100;
  });

  // Max hourly visits for scaling
  maxHourlyVisits = computed<number>(() => {
    const data = this.analytics();
    if (!data || !data.hourlyDistribution || data.hourlyDistribution.length === 0) return 20;
    const max = Math.max(...data.hourlyDistribution.map(h => h.visits));
    return max > 0 ? max : 20;
  });

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading.set(true);
    this.adminService.getVisitAnalytics(this.activePeriod()).subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load visit analytics', err);
        this.isLoading.set(false);
        this.toast.error('فشل في جلب إحصائيات الزيارات.');
      }
    });
  }

  setPeriod(period: 'today' | 'week' | 'month'): void {
    this.activePeriod.set(period);
  }

  getBarHeightPercent(value: number, max: number): number {
    if (max <= 0) return 5;
    const percent = Math.round((value / max) * 100);
    return Math.max(6, Math.min(100, percent));
  }
}
