import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  WhatsAppAccount,
  WhatsAppGatewaySettings,
  WhatsAppCampaign,
  WhatsAppCampaignDetail,
  CreateCampaignRequest,
  ExcelImportResult,
  MarketingContact,
  PostDeliverySettings
} from '../../../core/models/models';
import {
  formatEgyptDateTime,
  formatEgyptTime,
  formatEgyptTimeWithSeconds,
  formatEgyptDate
} from '../../../shared/utils/date-utils';

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

  readonly formatEgyptDateTime = formatEgyptDateTime;
  readonly formatEgyptTime = formatEgyptTime;
  readonly formatEgyptTimeWithSeconds = formatEgyptTimeWithSeconds;
  readonly formatEgyptDate = formatEgyptDate;

  // Active Tab
  activeTab = signal<'campaigns' | 'accounts' | 'gateway' | 'post_delivery' | 'contacts'>('campaigns');

  // ------------------------------------------
  // MULTI-SESSION ACCOUNTS STATE
  // ------------------------------------------
  accounts = signal<WhatsAppAccount[]>([]);
  isLoadingAccounts = signal<boolean>(false);

  // Add Account Modal
  showAddAccountModal = signal<boolean>(false);
  newAccountDisplayName: string = '';
  newAccountSessionId: string = '';
  isCreatingAccount = signal<boolean>(false);

  // Account Connect / QR Modal
  selectedAccountForConnect = signal<WhatsAppAccount | null>(null);
  selectedAccountQrUrl = signal<string | null>(null);
  isLoadingAccountQr = signal<boolean>(false);
  accountPairPhone: string = '';
  accountPairingCode = signal<string | null>(null);
  isRequestingAccountPairCode = signal<boolean>(false);

  // Status & QR State (Main Gateway Legacy / Fast View)
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
    cashierNotificationDelaySeconds: 3,
    defaultNotificationSessionId: 'default'
  });
  isSavingSettings = signal<boolean>(false);

  // Pairing Code Alternative (Default Session)
  pairPhone: string = '';
  pairingCode = signal<string | null>(null);
  isRequestingPairCode = signal<boolean>(false);

  // Test Message
  testPhone: string = '';
  testSessionId: string = 'default';
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
    sessionId: 'default',
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
    sessionId: 'default',
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
    this.loadAccounts();
    this.refreshStatusAndQr();
    this.loadGatewaySettings();
    this.loadCampaigns();
    this.loadContactsStats();
    this.loadPostDeliverySettings();

    // Auto-poll status every 6 seconds while on page
    this.pollInterval = setInterval(() => {
      this.refreshStatusSilently();
      if (this.activeTab() === 'accounts') {
        this.refreshAccountsSilently();
      }
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

  setTab(tab: 'campaigns' | 'accounts' | 'gateway' | 'post_delivery' | 'contacts') {
    this.activeTab.set(tab);
    if (tab === 'accounts') {
      this.loadAccounts();
    } else if (tab === 'campaigns') {
      this.loadCampaigns();
      this.loadAccounts();
      this.loadContactsStats();
    } else if (tab === 'contacts') {
      this.loadContacts();
      this.loadContactsStats();
    } else if (tab === 'post_delivery') {
      this.loadPostDeliverySettings();
    }
  }

  // ------------------------------------------
  // MULTI-SESSION ACCOUNTS LOGIC
  // ------------------------------------------
  loadAccounts() {
    this.isLoadingAccounts.set(true);
    this.adminService.getWhatsAppAccounts().subscribe({
      next: (res: any) => {
        this.isLoadingAccounts.set(false);
        const list = res?.data || res || [];
        this.accounts.set(list);
      },
      error: () => {
        this.isLoadingAccounts.set(false);
      }
    });
  }

  refreshAccountsSilently() {
    this.adminService.getWhatsAppAccounts().subscribe({
      next: (res: any) => {
        const list = res?.data || res || [];
        this.accounts.set(list);

        // If connect modal open, refresh current account status
        const current = this.selectedAccountForConnect();
        if (current) {
          const updated = list.find((a: WhatsAppAccount) => a.sessionId === current.sessionId);
          if (updated) {
            this.selectedAccountForConnect.set(updated);
            if (updated.connectionStatus === 'connected' && current.connectionStatus !== 'connected') {
              this.toast.success(`تم ربط رقم "${updated.displayName}" بنجاح! 🎉`);
            }
          }
        }
      }
    });
  }

  hasConnectedAccount(): boolean {
    return this.accounts().some(a => a.connectionStatus === 'connected');
  }

  getAccountDisplayName(sessionId?: string): string {
    if (!sessionId) return 'الرقم الافتراضي';
    const acc = this.accounts().find(a => a.sessionId === sessionId);
    if (!acc) return sessionId;
    return acc.displayName + (acc.phoneNumber ? ` (${acc.phoneNumber})` : '');
  }

  openAddAccountModal() {
    this.newAccountDisplayName = '';
    this.newAccountSessionId = '';
    this.showAddAccountModal.set(true);
  }

  closeAddAccountModal() {
    this.showAddAccountModal.set(false);
  }

  submitCreateAccount() {
    if (!this.newAccountDisplayName.trim()) {
      this.toast.error('يرجى كتابة اسم تعريفي لرقم الواتساب الجديد (مثل: رقم العروض 1)');
      return;
    }

    this.isCreatingAccount.set(true);
    this.adminService.createWhatsAppAccount({
      displayName: this.newAccountDisplayName.trim(),
      sessionId: this.newAccountSessionId.trim() || undefined
    }).subscribe({
      next: (res: any) => {
        this.isCreatingAccount.set(false);
        this.showAddAccountModal.set(false);
        this.toast.success('تم إنشاء حساب الواتساب بنجاح! جاري فتح نافذة الربط...');
        this.loadAccounts();

        const created = res?.data || res;
        if (created) {
          setTimeout(() => this.openConnectAccountModal(created), 500);
        }
      },
      error: (err: any) => {
        this.isCreatingAccount.set(false);
        this.toast.error(err?.error?.message || 'فشل إنشاء الحساب.');
      }
    });
  }

  openConnectAccountModal(account: WhatsAppAccount) {
    this.selectedAccountForConnect.set(account);
    this.accountPairPhone = '';
    this.accountPairingCode.set(null);
    this.selectedAccountQrUrl.set(null);
    this.refreshAccountQr(account.sessionId);
  }

  closeConnectAccountModal() {
    this.selectedAccountForConnect.set(null);
    this.selectedAccountQrUrl.set(null);
    this.accountPairingCode.set(null);
    this.loadAccounts();
  }

  refreshAccountQr(sessionId: string) {
    this.isLoadingAccountQr.set(true);
    this.adminService.getWhatsAppAccountQr(sessionId).subscribe({
      next: (res: any) => {
        this.isLoadingAccountQr.set(false);
        const data = res?.data || res;
        this.selectedAccountQrUrl.set(data?.qrDataUrl || null);
      },
      error: () => {
        this.isLoadingAccountQr.set(false);
      }
    });
  }

  requestAccountPairCode() {
    const acc = this.selectedAccountForConnect();
    if (!acc) return;

    let phone = this.accountPairPhone.trim().replace(/[^\d]/g, '');
    if (!phone) {
      this.toast.error('يرجى إدخال رقم الهاتف لطلب كود الاقتران.');
      return;
    }

    this.isRequestingAccountPairCode.set(true);
    this.adminService.requestWhatsAppAccountPairCode(acc.sessionId, phone).subscribe({
      next: (res: any) => {
        this.isRequestingAccountPairCode.set(false);
        const data = res?.data || res;
        if (data?.pairingCode) {
          this.accountPairingCode.set(data.pairingCode);
          this.toast.success('تم استخراج كود الاقتران بنجاح! أدخله في تطبيق واتساب بالهاتف.');
        } else {
          this.toast.error(data?.message || 'تعذر جلب كود الاقتران.');
        }
      },
      error: (err: any) => {
        this.isRequestingAccountPairCode.set(false);
        this.toast.error(err?.error?.message || 'حدث خطأ أثناء طلب كود الاقتران.');
      }
    });
  }

  setDefaultAccount(account: WhatsAppAccount) {
    this.adminService.setDefaultWhatsAppAccount(account.sessionId).subscribe({
      next: () => {
        this.toast.success(`تم تعيين رقم "${account.displayName}" كرقم افتراضي لجميع إشعارات النظام والطلبات ⭐`);
        this.loadAccounts();
        this.loadGatewaySettings();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'فشل تعيين الرقم الافتراضي.');
      }
    });
  }

  logoutAccount(account: WhatsAppAccount) {
    if (!confirm(`هل أنت متأكد من رغبتك في تسجيل خروج وفصل رقم "${account.displayName}"؟`)) return;

    this.adminService.logoutWhatsAppAccount(account.sessionId).subscribe({
      next: () => {
        this.toast.success(`تم تسجيل خروج رقم "${account.displayName}" بنجاح.`);
        this.loadAccounts();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'فشل تسجيل الخروج.');
      }
    });
  }

  restartAccount(account: WhatsAppAccount) {
    this.adminService.restartWhatsAppAccount(account.sessionId).subscribe({
      next: () => {
        this.toast.success(`جاري إعادة تشغيل جلسة "${account.displayName}"...`);
        setTimeout(() => this.loadAccounts(), 1500);
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'فشل إعادة التشغيل.');
      }
    });
  }

  deleteAccount(account: WhatsAppAccount) {
    if (!confirm(`هل أنت متأكد من حذف رقم "${account.displayName}" بالكامل؟`)) return;

    this.adminService.deleteWhatsAppAccount(account.sessionId).subscribe({
      next: () => {
        this.toast.success(`تم حذف رقم "${account.displayName}" بنجاح.`);
        this.loadAccounts();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'فشل حذف الحساب.');
      }
    });
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
    // Select default notification session or first available account
    const defaultAcc = this.accounts().find(a => a.isDefaultNotifications) || this.accounts()[0];
    this.newCampaign = {
      title: 'عرض جديد - ' + new Date().toLocaleDateString('ar-EG'),
      messageTemplate: 'أهلاً بك يا {الاسم} 🐟🌊\nعروض أسماك جندوفلي اليومية وصلت! خصم خاص ووجبات سي فود طازجة بتوصيل سريع حتى باب بيتك. اطلب الآن واستمتع بالطعم الأصلي 💙',
      sessionId: defaultAcc?.sessionId || 'default',
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
    if (this.newCampaign.dailyLimit < 1) {
      this.toast.error('العدد المستهدف يجب أن يكون 1 على الأقل');
      return;
    }

    this.isCreatingCampaign.set(true);
    this.adminService.createWhatsAppCampaign(this.newCampaign).subscribe({
      next: () => {
        this.isCreatingCampaign.set(false);
        this.showCreateCampaignModal.set(false);
        this.toast.success('تم إنشاء المهمة بنجاح وبدأت في الجدولة والإرسال الآمن! 🚀');
        this.loadCampaigns();
        this.loadContactsStats();
      },
      error: (err: any) => {
        this.isCreatingCampaign.set(false);
        this.toast.error(err?.error?.message || 'فشل إنشاء المهمة');
      }
    });
  }

  pauseCampaign(campaignId: number, event?: Event) {
    event?.stopPropagation();
    this.adminService.pauseWhatsAppCampaign(campaignId).subscribe({
      next: () => {
        this.toast.info('تم إيقاف المهمة مؤقتاً ⏸️');
        this.loadCampaigns();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'فشل إيقاف المهمة');
      }
    });
  }

  resumeCampaign(campaignId: number, event?: Event) {
    event?.stopPropagation();
    this.adminService.resumeWhatsAppCampaign(campaignId).subscribe({
      next: () => {
        this.toast.success('تم استئناف المهمة بنجاح ▶️');
        this.loadCampaigns();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'فشل استئناف المهمة');
      }
    });
  }

  cancelCampaign(campaignId: number, event?: Event) {
    event?.stopPropagation();
    if (!confirm('هل أنت متأكد من إلغاء هذه المهمة نهائياً؟')) return;

    this.adminService.cancelWhatsAppCampaign(campaignId).subscribe({
      next: () => {
        this.toast.warning('تم إلغاء المهمة ⏹️');
        this.loadCampaigns();
      },
      error: (err: any) => {
        this.toast.error(err?.error?.message || 'فشل إلغاء المهمة');
      }
    });
  }

  viewCampaignDetails(c: WhatsAppCampaign) {
    this.isLoadingCampaignDetail.set(true);
    this.selectedCampaign.set(null);
    this.adminService.getWhatsAppCampaignDetails(c.id).subscribe({
      next: (detail: any) => {
        this.isLoadingCampaignDetail.set(false);
        this.selectedCampaign.set(detail?.data || detail);
      },
      error: () => {
        this.isLoadingCampaignDetail.set(false);
        this.toast.error('تعذر جلب تفاصيل وسجل المهمة');
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
    this.isUploadingSheet.set(true);
    this.importPreview.set(null);

    this.adminService.previewContactsSheet(file).subscribe({
      next: (res: any) => {
        this.isUploadingSheet.set(false);
        this.importPreview.set(res?.data || res);
        this.toast.info(`تم فحص الشيت: وجدنا ${res?.data?.validCount || 0} أرقام صالحة`);
      },
      error: (err: any) => {
        this.isUploadingSheet.set(false);
        this.toast.error(err?.error?.message || 'فشل فحص الملف. تأكد من صيغة Excel أو CSV');
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
        const count = res?.data?.importedCount || res?.importedCount || 0;
        this.toast.success(`تم استيراد وحفظ ${count} عميل بنجاح في قاعدة البيانات! 🎉`);
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
      sessionId: c.sessionId || 'default',
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
      next: () => {
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
  // GATEWAY & CONNECTION LOGIC
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
    this.adminService.sendWhatsAppTestMessage(this.testPhone.trim(), this.testMessage.trim(), this.testSessionId).subscribe({
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
