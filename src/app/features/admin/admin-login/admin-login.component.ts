import { isPlatformContext } from '../../../core/services/store-context';
import { SettingsService } from '../../../core/services/settings.service';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent implements OnInit {
  readonly platformLogin = isPlatformContext();
  readonly settingsService = inject(SettingsService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(NotificationService);
  private readonly router = inject(Router);

  ngOnInit() {
    if (typeof window !== 'undefined' && window.location.hash.includes('session=')) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const rawSession = hashParams.get('session');
        if (rawSession) {
          const session = JSON.parse(decodeURIComponent(rawSession));
          if (session && session.token) {
            this.authService.setAdminSession(session);
            const returnUrl = hashParams.get('returnUrl') || '/admin/orders';
            const cleanHash = window.location.hash.replace(/[#&]?session=[^&]*/, '').replace(/^#/, '');
            history.replaceState(null, '', window.location.pathname + window.location.search + (cleanHash ? '#' + cleanHash : ''));
            this.toast.success(`مرحباً بك مجدداً ${session.fullName || session.usernameOrPhone || ''}`);
            this.router.navigateByUrl(returnUrl);
            return;
          }
        }
      } catch (e) {
        console.warn('Cross-domain hash login failed', e);
      }
    }
  }

  username: string = '';
  password: string = '';
  showPassword = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  // Forgot password
  showForgotModal = signal<boolean>(false);
  forgotInput = signal<string>('');
  isForgotSubmitting = signal<boolean>(false);
  forgotResult = signal<{ sent: boolean; resetLink?: string; maskedEmail?: string; message?: string } | null>(null);

  toggleShowPassword() {
    this.showPassword.update(v => !v);
  }

  openForgotModal() {
    this.forgotInput.set(this.username || '');
    this.forgotResult.set(null);
    this.showForgotModal.set(true);
  }

  closeForgotModal() {
    this.showForgotModal.set(false);
  }

  submitForgotPassword() {
    const val = this.forgotInput().trim();
    if (!val) {
      this.toast.error('أدخل اسم المستخدم أو البريد الإلكتروني.');
      return;
    }

    this.isForgotSubmitting.set(true);
    this.authService.forgotPassword(val).subscribe({
      next: (res: any) => {
        this.isForgotSubmitting.set(false);
        this.forgotResult.set({
          sent: true,
          maskedEmail: res?.data?.maskedEmail || res?.maskedEmail,
          message: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح.'
        });
        this.toast.success('تم إرسال رابط الاستعادة إلى بريدك الإلكتروني.');
      },
      error: (err) => {
        this.isForgotSubmitting.set(false);
        this.toast.error(err?.error?.message || 'تعذر معالجة الطلب.');
      }
    });
  }

  copyLink(link: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => this.toast.success('تم نسخ الرابط.')).catch(() => {});
    }
  }

  login() {
    if (!this.username.trim() || !this.password.trim()) {
      this.toast.error('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    this.isLoading.set(true);
    this.authService.adminLogin(this.username.trim(), this.password).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.toast.success('تم تسجيل الدخول بنجاح إلى لوحة الإدارة.');
        if (res.isPlatformAdmin) {
          this.router.navigate(['/admin/stores']);
        } else {
          const host = window.location.hostname.toLowerCase();
          const targetSlug = res.tenantSlug;
          if ((host === 'mecart.app' || host === 'www.mecart.app') && targetSlug) {
            const sessionData = encodeURIComponent(JSON.stringify(res));
            window.location.href = `https://${targetSlug}.mecart.app/admin/orders#session=${sessionData}`;
          } else if (targetSlug && !host.includes(targetSlug) && (host === 'localhost' || host === '127.0.0.1')) {
            this.router.navigate(['/admin/orders'], { queryParams: { tenant: targetSlug } });
          } else {
            this.router.navigate(['/admin/orders']);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    });
  }
}
