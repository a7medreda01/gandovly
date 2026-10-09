import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WhatsAppGatewaySettings } from '../../../core/models/models';

@Component({
  selector: 'app-admin-whatsapp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-whatsapp.component.html',
  styleUrl: './admin-whatsapp.component.scss'
})
export class AdminWhatsAppComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(NotificationService);

  // Status & QR State
  connectionStatus = signal<'connected' | 'qr_ready' | 'connecting' | 'disconnected' | 'offline'>('connecting');
  connectedPhone = signal<string | null>(null);
  qrDataUrl = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  queueLength = signal<number>(0);

  lastErrorMessage = signal<string | null>(null);

  // Notification Triggers Settings
  gatewaySettings = signal<WhatsAppGatewaySettings>({
    isEnabled: true,
    baseUrl: 'http://whatsservice.runasp.net',
    hasApiKeyConfigured: false,
    sendOnOrderPlaced: true,
    sendOnOrderConfirmed: true,
    sendOnKitchenWeighed: true,
    sendOnOutForDelivery: true,
    sendOnOrderCompleted: true,
    sendOnOrderCancelled: true,
    notifyCashierOnNewOrder: true,
    cashierWhatsAppNumber: '01000000000',
    cashierNotificationDelaySeconds: 3
  });
  isSavingSettings = signal<boolean>(false);

  // Pairing Code Alternative
  pairPhone: string = '';
  pairingCode = signal<string | null>(null);
  isRequestingPairCode = signal<boolean>(false);

  // Test Message
  testPhone: string = '';
  testMessage: string = 'تجربة إرسال رسالة من منصة أسماك جندوفلي 🐟🌊 - بوابة الواتساب الذاتية تعمل بنجاح!';
  isSendingTest = signal<boolean>(false);

  private pollInterval: any = null;

  ngOnInit() {
    this.refreshStatusAndQr();
    this.loadGatewaySettings();
    // Auto-poll status every 5 seconds while on page
    this.pollInterval = setInterval(() => {
      this.refreshStatusSilently();
    }, 5000);
  }

  loadGatewaySettings() {
    this.adminService.getGatewaySettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.gatewaySettings.set({
            ...this.gatewaySettings(),
            ...settings
          });
        }
      },
      error: () => {}
    });
  }

  saveGatewayUrl() {
    if (!this.gatewaySettings().baseUrl.trim()) {
      this.toast.error('يرجى إدخال رابط خادم الواتساب.');
      return;
    }
    this.isSavingSettings.set(true);
    this.adminService.updateGatewaySettings(this.gatewaySettings()).subscribe({
      next: (updated) => {
        this.isSavingSettings.set(false);
        this.gatewaySettings.set(updated);
        this.toast.success('تم تحديث رابط خادم الواتساب! جاري فحص الاتصال...');
        setTimeout(() => this.refreshStatusAndQr(), 1000);
      },
      error: () => {
        this.isSavingSettings.set(false);
        this.toast.error('فشل حفظ رابط الخادم.');
      }
    });
  }

  saveNotificationTriggers() {
    this.isSavingSettings.set(true);
    this.adminService.updateGatewaySettings(this.gatewaySettings()).subscribe({
      next: (updated) => {
        this.isSavingSettings.set(false);
        this.gatewaySettings.set(updated);
        this.toast.success('تم حفظ إعدادات إرسال إشعارات الواتساب بنجاح! 💾');
      },
      error: () => {
        this.isSavingSettings.set(false);
        this.toast.error('حدث خطأ أثناء حفظ إعدادات الإشعارات.');
      }
    });
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  refreshStatusAndQr() {
    this.isLoading.set(true);
    this.adminService.getWhatsAppQr().subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        const data = res?.data || res;
        if (data?.status === 'offline') {
          this.connectionStatus.set('offline');
          this.lastErrorMessage.set(data?.error || null);
        } else {
          this.connectionStatus.set(data?.status || 'disconnected');
          this.connectedPhone.set(data?.connectedPhone || null);
          this.qrDataUrl.set(data?.qrDataUrl || null);
          this.lastErrorMessage.set(null);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.connectionStatus.set('offline');
        this.lastErrorMessage.set(err?.error?.message || err?.message || 'تعذر الاتصال بالخادم');
      }
    });
  }

  refreshStatusSilently() {
    this.adminService.getWhatsAppStatus().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        const prevStatus = this.connectionStatus();
        const newStatus = data?.status || 'disconnected';

        this.connectionStatus.set(newStatus);
        this.connectedPhone.set(data?.connectedPhone || null);
        this.queueLength.set(data?.queueLength || 0);

        // If status changed or qr was updated, reload QR
        if (newStatus === 'qr_ready' && (!this.qrDataUrl() || prevStatus !== 'qr_ready')) {
          this.refreshQrOnly();
        }
      },
      error: () => {
        this.connectionStatus.set('offline');
      }
    });
  }

  refreshQrOnly() {
    this.adminService.getWhatsAppQr().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        this.qrDataUrl.set(data?.qrDataUrl || null);
      }
    });
  }

  requestPairingCode() {
    if (!this.pairPhone.trim()) {
      this.toast.error('يرجى إدخال رقم هاتف المطعم.');
      return;
    }

    if (this.connectionStatus() === 'offline') {
      this.toast.error('خادم الواتساب غير متصل حالياً. يرجى التأكد من تشغيل الخادم أو تحديث الرابط.');
      return;
    }

    this.isRequestingPairCode.set(true);
    this.adminService.requestWhatsAppPairCode(this.pairPhone.trim()).subscribe({
      next: (res: any) => {
        this.isRequestingPairCode.set(false);
        const data = res?.data || res;
        if (data?.pairingCode) {
          this.pairingCode.set(data.pairingCode);
          this.toast.success('تم إنشاء كود الاقتران بنجاح! أدخله في تطبيق واتساب بالهاتف.');
        } else {
          this.toast.error(data?.message || 'تعذر جلب كود الاقتران.');
        }
      },
      error: (err: any) => {
        this.isRequestingPairCode.set(false);
        this.toast.error(err?.error?.message || 'حدث خطأ أثناء طلب كود الاقتران.');
      }
    });
  }

  logoutSession() {
    if (!confirm('هل أنت متأكد من رغبتك في تسجيل الخروج وقطع ارتباط رقم الواتساب؟')) return;

    this.isLoading.set(true);
    this.adminService.logoutWhatsApp().subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('تم تسجيل الخروج بنجاح. جاري تجهيز كود QR جديد...');
        setTimeout(() => this.refreshStatusAndQr(), 1500);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.toast.error(err?.error?.message || 'فشل تسجيل الخروج.');
      }
    });
  }

  restartGateway() {
    this.isLoading.set(true);
    this.adminService.restartWhatsApp().subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('جاري إعادة تشغيل محرك الواتساب...');
        setTimeout(() => this.refreshStatusAndQr(), 2000);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.toast.error(err?.error?.message || 'فشل إعادة التشغيل.');
      }
    });
  }

  sendTest() {
    if (!this.testPhone.trim() || !this.testMessage.trim()) {
      this.toast.error('يرجى إدخال رقم المستلم ونص الرسالة.');
      return;
    }

    this.isSendingTest.set(true);
    this.adminService.sendWhatsAppTestMessage(this.testPhone.trim(), this.testMessage.trim()).subscribe({
      next: (res: any) => {
        this.isSendingTest.set(false);
        this.toast.success('تم إرسال الرسالة التجريبية بنجاح عبر بوابة الواتساب الذاتية! 📲');
      },
      error: (err: any) => {
        this.isSendingTest.set(false);
        this.toast.error(err?.error?.message || 'فشل إرسال الرسالة التجريبية.');
      }
    });
  }
}
