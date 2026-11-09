import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AdminUserItem } from '../../../core/models/models';
import { isPlatformContext } from '../../../core/services/store-context';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly toast = inject(NotificationService);

  users = signal<AdminUserItem[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  // Modals
  showAddModal = signal<boolean>(false);
  showInviteSuccessModal = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);

  createdUser = signal<{
    fullName: string;
    username: string;
    email: string;
    roleName: string;
    inviteLink: string;
    generatedPassword?: string;
  } | null>(null);

  userToDelete = signal<AdminUserItem | null>(null);

  // Add Form Model
  newUser = {
    fullName: '',
    email: '',
    username: '',
    role: 'Staff',
    password: ''
  };

  isPlatform = isPlatformContext();

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.auth.getAdminUsers().subscribe({
      next: (data) => {
        this.users.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err?.error?.message || 'تعذر تحميل قائمة المستخدمين.');
      }
    });
  }

  openAddModal(): void {
    this.newUser = {
      fullName: '',
      email: '',
      username: '',
      role: 'Staff',
      password: ''
    };
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  submitAddUser(): void {
    if (!this.newUser.fullName.trim() || !this.newUser.email.trim()) {
      this.toast.error('يرجى ملء الاسم الكامل والبريد الإلكتروني.');
      return;
    }

    this.isSaving.set(true);
    this.auth.createAdminUser(this.newUser).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.showAddModal.set(false);

        // Build absolute invite link
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const fullInviteLink = origin + (res.inviteLink.startsWith('/') ? res.inviteLink : '/' + res.inviteLink);

        this.createdUser.set({
          fullName: res.fullName,
          username: res.username,
          email: res.email,
          roleName: res.roleName,
          inviteLink: fullInviteLink,
          generatedPassword: res.generatedPassword
        });

        this.showInviteSuccessModal.set(true);
        this.toast.success('تمت إضافة المستخدم بنجاح.');
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err?.error?.message || 'حدث خطأ أثناء إضافة المستخدم.');
      }
    });
  }

  toggleUserStatus(user: AdminUserItem): void {
    if (user.id === this.auth.currentAdmin()?.userId) {
      this.toast.warning('لا يمكنك تعطيل حسابك الحالي.');
      return;
    }

    const newStatus = !user.isActive;
    this.auth.updateAdminUser(user.id, {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: newStatus
    }).subscribe({
      next: () => {
        this.toast.success(newStatus ? 'تم تفعيل الحساب.' : 'تم تعطيل الحساب.');
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'تعذر تغيير حالة الحساب.');
      }
    });
  }

  changeRole(user: AdminUserItem, newRole: string): void {
    if (user.id === this.auth.currentAdmin()?.userId) {
      this.toast.warning('لا يمكنك تغيير صلاحية حسابك الحالي.');
      return;
    }

    this.auth.updateAdminUser(user.id, {
      fullName: user.fullName,
      email: user.email,
      role: newRole,
      isActive: user.isActive
    }).subscribe({
      next: () => {
        this.toast.success('تم تحديث الرتبة والصلاحية بنجاح.');
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'تعذر تحديث الصلاحية.');
      }
    });
  }

  resendInvite(user: AdminUserItem): void {
    this.auth.resendUserInvite(user.id).subscribe({
      next: (res) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const fullLink = origin + (res.inviteLink.startsWith('/') ? res.inviteLink : '/' + res.inviteLink);

        this.createdUser.set({
          fullName: user.fullName,
          username: user.username,
          email: user.email || '',
          roleName: user.roleName,
          inviteLink: fullLink
        });
        this.showInviteSuccessModal.set(true);
        this.toast.success('تم تجديد رابط الدعوة.');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'تعذر تجديد رابط الدعوة.');
      }
    });
  }

  promptDelete(user: AdminUserItem): void {
    if (user.id === this.auth.currentAdmin()?.userId) {
      this.toast.warning('لا يمكنك حذف حسابك الحالي.');
      return;
    }
    this.userToDelete.set(user);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const user = this.userToDelete();
    if (!user) return;

    this.isSaving.set(true);
    this.auth.deleteAdminUser(user.id).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showDeleteModal.set(false);
        this.userToDelete.set(null);
        this.toast.success('تم حذف المستخدم بنجاح.');
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err?.error?.message || 'تعذر حذف المستخدم.');
      }
    });
  }

  copyToClipboard(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast.success('تم نسخ الرابط إلى الحافظة.');
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  private fallbackCopy(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.toast.success('تم نسخ الرابط بنجاح.');
    } catch {
      this.toast.error('تعذر النسخ التلقائي، يرجى نسخه يدوياً.');
    }
    document.body.removeChild(textArea);
  }

  shareViaWhatsApp(link: string, name: string): void {
    const msg = `مرحباً ${name}، تم إنشاء حساب لك في لوحة تحكم المتجر. يمكنك تفعيل حسابك وتعيين كلمة المرور عبر الرابط التالي:\n${link}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }
}
