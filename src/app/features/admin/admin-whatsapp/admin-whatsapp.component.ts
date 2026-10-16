import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  WhatsAppGatewaySettings,
  WhatsAppCampaign,
  WhatsAppCampaignDetail,
  CreateCampaignRequest,
  ExcelImportResult,
  MarketingContact,
  PostDeliverySettings
} from '../../../core/models/models';

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

  // Active Tab
  activeTab = signal<'campaigns' | 'gateway' | 'post_delivery' | 'contacts'>('campaigns');

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

  // ------------------------------------------
  // CAMPAIGNS & MARKETING STATE
  // ------------------------------------------
  campaigns = signal<WhatsAppCampaign[]>([]);
  isLoadingCampaigns = signal<boolean>(false);
  selectedCampaign = signal<WhatsAppCampaignDetail | null>(null);
  isLoadingCampaignDetail = signal<boolean>(false);

  // New Campaign Form
  showCreateCampaignModal = signal<boolean>(false);
  isCreatingCampaign = signal<boolean>(false);
  newCampaign: CreateCampaignRequest = {
    title: '',
    messageTemplate: 'أهلاً بك يا {الاسم} 🐟🌊\nعروض أسماك جندوفلي اليومية وصلت! خصم خاص ووجبات سي فود طازجة بتوصيل سريع حتى باب بيتك. اطلب الآن واستمتع بالطعم الأصلي 💙',
    intervalMinutes: 5,
    dailyLimit: 50,
    excludePreviouslyMessaged: true
  };

  // Edit Campaign Form
  showEditCampaignModal = signal<boolean>(false);
  isUpdatingCampaign = signal<boolean>(false);
  editCampaignData = {
    id: 0,
    title: '',
    messageTemplate: '',
    intervalMinutes: 5,
    dailyLimit: 50
  };

  // Web Customers Sync
  isSyncingWebCustomers = signal<boolean>(false);

  // Sheet Upload & Contacts Import
  showImportModal = signal<boolean>(false);
  selectedFile: File | null = null;
  selectedFileName = signal<string | null>(null);
  importPreview = signal<ExcelImportResult | null>(null);
  isUploadingSheet = signal<boolean>(false);
  isConfirmingImport = signal<boolean>(false);

  // Contacts
  contacts = signal<MarketingContact[]>([]);
  totalContacts = signal<number>(0);
  contactsPage = signal<number>(1);
  contactSearch: string = '';
  isLoadingContacts = signal<boolean>(false);
  contactsStats = signal<{
    totalContacts: number;
    messagedContacts: number;
    freshContacts: number;
    webCustomersCount: number;
  }>({
    totalContacts: 0,
    messagedContacts: 0,
    freshContacts: 0,
    webCustomersCount: 0
  });

  // Post Delivery Follow-up Settings
  postDeliverySettings = signal<PostDeliverySettings>({
    isEnabled: true,
    delayHours: 24,
    messageTemplate: 'أهلاً بك يا {اسم_العميل} 🐟🌊، نتمنى أن تكون وجبتك من أسماك جندوفلي نالت إعجابك! نسعد دائماً بخدمتك ويهمنا جداً رأيك وتقييمك لطلبك #{رقم_الطلب}. نسعد بطلبك القادم دائماً! 💙'
  });
  isSavingPostDelivery = signal<boolean>(false);

  private pollInterval: any = null;

  ngOnInit() {
    this.refreshStatusAndQr();
    this.loadGatewaySettings();
    this.loadCampaigns();
    this.loadContactsStats();
    this.loadPostDeliverySettings();

    // Auto-poll status every 6 seconds while on page
    this.pollInterval = setInterval(() => {
      this.refreshStatusSilently();
      // If campaigns tab active, refresh campaign progress
      if (this.activeTab() === 'campaigns') {
        this.refreshCampaignsSilently();
      }
    }, 6000);
  }

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  setTab(tab: 'campaigns' | 'gateway' | 'post_delivery' | 'contacts') {
    this.activeTab.set(tab);
    if (tab === 'campaigns') {
      this.loadCampaigns();
      this.loadContactsStats();
    } else if (tab === 'contacts') {
      this.loadContacts();
      this.loadContactsStats();
    } else if (tab === 'post_delivery') {
      this.loadPostDeliverySettings();
    }
  }

  // ------------------------------------------
  // CAMPAIGNS LOGIC
  // ------------------------------------------
  loadCampaigns() {
    this.isLoadingCampaigns.set(true);
    this.adminService.getWhatsAppCampaigns().subscribe({
      next: (list: any) => {
        this.isLoadingCampaigns.set(false);
        this.campaigns.set(list?.data || list || []);
      },
      error: () => {
        this.isLoadingCampaigns.set(false);
      }
    });
  }

  refreshCampaignsSilently() {
    this.adminService.getWhatsAppCampaigns().subscribe({
      next: (list: any) => {
        this.campaigns.set(list?.data || list || []);
        // If viewing details, also refresh details
        const selected = this.selectedCampaign();
        if (selected) {
          this.adminService.getWhatsAppCampaignDetails(selected.id).subscribe({
            next: (detail: any) => {
              this.selectedCampaign.set(detail?.data || detail);
            }
          });
        }
      }
    });
  }

  openCreateCampaignModal() {
    this.newCampaign = {
      title: 'عرض جديد - ' + new Date().toLocaleDateString('ar-EG'),
      messageTemplate: 'أهلاً بك يا {الاسم} 🐟🌊\nعروض أسماك جندوفلي اليومية وصلت! خصم خاص ووجبات سي فود طازجة بتوصيل سريع حتى باب بيتك. اطلب الآن واستمتع بالطعم الأصلي 💙',
      intervalMinutes: 5,
      dailyLimit: 50,
      excludePreviouslyMessaged: true
    };
    this.showCreateCampaignModal.set(true);
  }

  closeCreateCampaignModal() {
    this.showCreateCampaignModal.set(false);
  }

  insertPlaceholder(placeholder: string) {
    this.newCampaign.messageTemplate += ' ' + placeholder + ' ';
  }

  insertPostDeliveryPlaceholder(placeholder: string) {
    const current = this.postDeliverySettings();
    this.postDeliverySettings.set({
      ...current,
      messageTemplate: current.messageTemplate + ' ' + placeholder + ' '
    });
  }

  submitCreateCampaign() {
    if (!this.newCampaign.title.trim()) {
      this.toast.error('يرجى إدخال عنوان أو اسم المهمة');
      return;
    }
    if (!this.newCampaign.messageTemplate.trim()) {
      this.toast.error('يرجى كتابة نص الرسالة أو العرض');
      return;
    }
    if (this.newCampaign.intervalMinutes < 1) {
      this.toast.error('الفاصل الزمني يجب أن يكون دقيقة واحدة على الأقل');
      return;
    }

    this.isCreatingCampaign.set(true);
    this.adminService.createWhatsAppCampaign(this.newCampaign).subscribe({
      next: (res: any) => {
        this.isCreatingCampaign.set(false);
        this.showCreateCampaignModal.set(false);
        this.toast.success('تم إنشاء المهمة وجدولة الرسائل بنجاح! 🚀');
        this.loadCampaigns();
        this.loadContactsStats();
      },
      error: (err: any) => {
        this.isCreatingCampaign.set(false);
        this.toast.error(err?.error?.message || 'فشل إنشاء المهمة');
      }
    });
  }

  pauseCampaign(id: number, event?: Event) {
    event?.stopPropagation();
    this.adminService.pauseWhatsAppCampaign(id).subscribe({
      next: () => {
        this.toast.success('تم إيقاف المهمة مؤقتاً ⏸️');
        this.loadCampaigns();
      },
      error: () => this.toast.error('تعذر إيقاف المهمة')
    });
  }

  resumeCampaign(id: number, event?: Event) {
    event?.stopPropagation();
    this.adminService.resumeWhatsAppCampaign(id).subscribe({
      next: () => {
        this.toast.success('تم استئناف المهمة بنجاح ▶️');
        this.loadCampaigns();
      },
      error: () => this.toast.error('تعذر استئناف المهمة')
    });
  }

  cancelCampaign(id: number, event?: Event) {
    event?.stopPropagation();
    if (!confirm('هل أنت متأكد من إلغاء هذه المهمة نهائياً؟')) return;

    this.adminService.cancelWhatsAppCampaign(id).subscribe({
      next: () => {
        this.toast.success('تم إلغاء المهمة ⏹️');
        this.loadCampaigns();
      },
      error: () => this.toast.error('تعذر إلغاء المهمة')
    });
  }

  viewCampaignDetails(campaign: WhatsAppCampaign) {
    this.isLoadingCampaignDetail.set(true);
    this.adminService.getWhatsAppCampaignDetails(campaign.id).subscribe({
      next: (res: any) => {
        this.isLoadingCampaignDetail.set(false);
        this.selectedCampaign.set(res?.data || res);
      },
      error: () => {
        this.isLoadingCampaignDetail.set(false);
        this.toast.error('تعذر تحميل تفاصيل وسجل المهمة');
      }
    });
  }

  closeCampaignDetails() {
    this.selectedCampaign.set(null);
  }

  // ------------------------------------------
  // SHEET IMPORT LOGIC
  // ------------------------------------------
  openImportModal() {
    this.selectedFile = null;
    this.selectedFileName.set(null);
    this.importPreview.set(null);
    this.showImportModal.set(true);
  }

  closeImportModal() {
    this.showImportModal.set(false);
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.selectedFile = file;
    this.selectedFileName.set(file.name);
    this.uploadAndPreviewSheet(file);
  }

  uploadAndPreviewSheet(file: File) {
    this.isUploadingSheet.set(true);
    this.importPreview.set(null);

    this.adminService.previewContactsSheet(file).subscribe({
      next: (preview: ExcelImportResult) => {
        this.isUploadingSheet.set(false);
        this.importPreview.set(preview);
        this.toast.success(`تم فحص الشيت: وجد ${preview.validCount} رقم صالح من إجمالي ${preview.totalRowsFound}.`);
      },
      error: (err: any) => {
        this.isUploadingSheet.set(false);
        this.toast.error(err?.error?.message || 'فشل فحص وقراءة ملف الإكسيل.');
      }
    });
  }

  confirmImportSheet() {
    if (!this.selectedFile) return;

    this.isConfirmingImport.set(true);
    this.adminService.importContactsSheet(this.selectedFile).subscribe({
      next: (res: any) => {
        this.isConfirmingImport.set(false);
        this.showImportModal.set(false);
        this.toast.success(res?.message || 'تم حفظ العملاء بنجاح في قاعدة البيانات! 🎉');
        this.loadContactsStats();
        if (this.activeTab() === 'contacts') {
          this.loadContacts();
        }
      },
      error: (err: any) => {
        this.isConfirmingImport.set(false);
        this.toast.error(err?.error?.message || 'حدث خطأ أثناء استيراد البيانات.');
      }
    });
  }

  // ------------------------------------------
  // EDIT CAMPAIGN LOGIC
  // ------------------------------------------
  openEditCampaignModal(c: WhatsAppCampaign, event?: Event) {
    event?.stopPropagation();
    this.editCampaignData = {
      id: c.id,
      title: c.title,
      messageTemplate: c.messageTemplate,
      intervalMinutes: c.intervalMinutes,
      dailyLimit: c.dailyLimit || 50
    };
    this.showEditCampaignModal.set(true);
  }

  closeEditCampaignModal() {
    this.showEditCampaignModal.set(false);
  }

  insertEditPlaceholder(placeholder: string) {
    this.editCampaignData.messageTemplate += ' ' + placeholder + ' ';
  }

  submitUpdateCampaign() {
    if (!this.editCampaignData.title.trim()) {
      this.toast.error('يرجى إدخال عنوان أو اسم المهمة');
      return;
    }
    if (!this.editCampaignData.messageTemplate.trim()) {
      this.toast.error('يرجى إدخال نص الرسالة أو العرض');
      return;
    }
    if (this.editCampaignData.intervalMinutes < 1) {
      this.toast.error('الفاصل الزمني يجب أن يكون دقيقة واحدة على الأقل');
      return;
    }

    this.isUpdatingCampaign.set(true);
    this.adminService.updateWhatsAppCampaign(this.editCampaignData.id, this.editCampaignData).subscribe({
      next: () => {
        this.isUpdatingCampaign.set(false);
        this.showEditCampaignModal.set(false);
        this.toast.success('تم حفظ وتعديل بيانات المهمة بنجاح! ✏️');
        this.loadCampaigns();
      },
      error: (err: any) => {
        this.isUpdatingCampaign.set(false);
        this.toast.error(err?.error?.message || 'فشل تعديل المهمة');
      }
    });
  }

  isCampaignCompleted(c: WhatsAppCampaign): boolean {
    return c.status === 'Completed' || (c.totalTargetCount > 0 && (c.sentCount + (c.failedCount || 0)) >= c.totalTargetCount);
  }

  // ------------------------------------------
  // WEB CUSTOMERS SYNC
  // ------------------------------------------
  syncWebCustomers() {
    this.isSyncingWebCustomers.set(true);
    this.adminService.syncWebCustomers().subscribe({
      next: (res: any) => {
        this.isSyncingWebCustomers.set(false);
        this.toast.success(res?.message || 'تمت مزامنة عملاء الموقع والطلبات بنجاح! 🎉');
        this.loadContactsStats();
        if (this.activeTab() === 'contacts') {
          this.loadContacts();
        }
      },
      error: (err: any) => {
        this.isSyncingWebCustomers.set(false);
        this.toast.error(err?.error?.message || 'فشل مزامنة عملاء الموقع');
      }
    });
  }

  // ------------------------------------------
  // CONTACTS LIST LOGIC
  // ------------------------------------------
  loadContactsStats() {
    this.adminService.getWhatsAppDashboardStats().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (data) this.contactsStats.set(data);
      }
    });
  }

  loadContacts(page: number = 1) {
    this.isLoadingContacts.set(true);
    this.contactsPage.set(page);

    this.adminService.getMarketingContacts(page, 30, this.contactSearch).subscribe({
      next: (res: any) => {
        this.isLoadingContacts.set(false);
        const data = res?.data || res;
        this.contacts.set(data?.items || []);
        this.totalContacts.set(data?.totalCount || 0);
      },
      error: () => {
        this.isLoadingContacts.set(false);
      }
    });
  }

  onSearchContacts() {
    this.loadContacts(1);
  }

  // ------------------------------------------
  // POST-DELIVERY FOLLOW-UP SETTINGS
  // ------------------------------------------
  loadPostDeliverySettings() {
    this.adminService.getPostDeliverySettings().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (data) {
          this.postDeliverySettings.set(data);
        }
      }
    });
  }

  savePostDeliverySettings() {
    if (!this.postDeliverySettings().messageTemplate.trim()) {
      this.toast.error('يرجى كتابة نص رسالة المتابعة');
      return;
    }

    this.isSavingPostDelivery.set(true);
    this.adminService.updatePostDeliverySettings(this.postDeliverySettings()).subscribe({
      next: (res: any) => {
        this.isSavingPostDelivery.set(false);
        this.toast.success('تم حفظ إعدادات رسائل ما بعد استلام الطلب بنجاح! 💾');
      },
      error: (err: any) => {
        this.isSavingPostDelivery.set(false);
        this.toast.error(err?.error?.message || 'فشل حفظ الإعدادات');
      }
    });
  }

  // ------------------------------------------
  // GATEWAY & CONNECTION LOGIC (EXISTING)
  // ------------------------------------------
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
    let phone = this.pairPhone.trim().replace(/[^\d]/g, '');
    if (!phone) {
      this.toast.error('يرجى إدخال رقم هاتف المطعم.');
      return;
    }

    if (phone.startsWith('00')) phone = phone.substring(2);
    if (phone.startsWith('01') && phone.length === 11) {
      phone = '20' + phone.substring(1);
    } else if ((phone.startsWith('10') || phone.startsWith('11') || phone.startsWith('12') || phone.startsWith('15')) && phone.length === 10) {
      phone = '20' + phone;
    }

    if (this.connectionStatus() === 'offline') {
      this.toast.error('خادم الواتساب غير متصل حالياً. يرجى التأكد من تشغيل الخادم أو تحديث الرابط.');
      return;
    }

    this.isRequestingPairCode.set(true);
    this.adminService.requestWhatsAppPairCode(phone).subscribe({
      next: (res: any) => {
        this.isRequestingPairCode.set(false);
        const data = res?.data || res;
        if (data?.pairingCode) {
          this.pairingCode.set(data.pairingCode);
          this.toast.success('تم إنشاء كود الاقتران بنجاح! أدخله في تطبيق واتساب بالهاتف.');
        } else {
          const msg = data?.message || 'تعذر جلب كود الاقتران.';
          if (msg === 'Connection Closed') {
            this.toast.error('تم إغلاق الاتصال من خادم واتساب. اضغط على زر "إعادة تشغيل الجلسة" أدناه ثم حاول مجدداً.');
          } else {
            this.toast.error(msg);
          }
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
      next: () => {
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
