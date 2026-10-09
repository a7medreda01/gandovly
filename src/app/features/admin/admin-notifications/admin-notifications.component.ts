import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WhatsAppGatewaySettings } from '../../../core/models/models';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.scss']
})
export class AdminNotificationsComponent implements OnInit {
  config: WhatsAppGatewaySettings = {
    isEnabled: false,
    baseUrl: 'http://whatsservice.runasp.net',
    hasApiKeyConfigured: false,
    sendOnOrderConfirmed: true,
    sendOnKitchenWeighed: true,
    sendOnOutForDelivery: true,
    sendOnOrderCompleted: true,
    sendOnOrderCancelled: true
  };

  testPhone = '';
  testMessage = 'مرحباً بكم من أسماك جندوفلي! هذه رسالة تجريبية لتأكيد نجاح ربط بوابة WhatsApp الذاتية.';

  loading = signal(false);
  saving = signal(false);
  testing = signal(false);

  constructor(
    private adminService: AdminService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading.set(true);
    this.adminService.getGatewaySettings().subscribe({
      next: (res) => {
        if (res) {
          this.config = { ...res };
        }
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('فشل تحميل إعدادات بوابة الإشعارات');
        this.loading.set(false);
      }
    });
  }

  saveConfig(): void {
    this.saving.set(true);
    this.adminService.updateGatewaySettings(this.config).subscribe({
      next: (res) => {
        this.config = { ...res };
        this.notify.success('تم حفظ إعدادات بوابة الإشعارات بنجاح');
        this.saving.set(false);
      },
      error: () => {
        this.notify.error('حدث خطأ أثناء حفظ الإعدادات');
        this.saving.set(false);
      }
    });
  }

  sendTest(): void {
    if (!this.testPhone || !this.testMessage) {
      this.notify.warning('يرجى كتابة رقم الهاتف ونص الرسالة');
      return;
    }

    this.testing.set(true);
    this.adminService.sendTestNotification(this.testPhone, this.testMessage).subscribe({
      next: (success) => {
        if (success) {
          this.notify.success('تم إرسال الرسالة التجريبية بنجاح عبر بوابة الواتساب الذاتية');
        } else {
          this.notify.warning('تعذر إرسال الرسالة (تأكد من تشغيل واتساب وربط الجلسة)');
        }
        this.testing.set(false);
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'فشل إرسال الرسالة التجريبية');
        this.testing.set(false);
      }
    });
  }
}
