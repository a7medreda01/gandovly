import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-admin-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-reset-password.component.html',
  styleUrls: ['./admin-reset-password.component.scss']
})
export class AdminResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(NotificationService);

  token = signal<string>('');
  isVerifying = signal<boolean>(true);
  isTokenValid = signal<boolean>(false);
  errorMessage = signal<string>('');
  
  userInfo = signal<{ username: string; fullName: string; email?: string; isInvite: boolean } | null>(null);

  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  showPassword = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSuccess = signal<boolean>(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const t = params['token'] || '';
      this.token.set(t);
      if (!t) {
        this.isVerifying.set(false);
        this.isTokenValid.set(false);
        this.errorMessage.set('الرابط غير صحيح أو لا يحتوي على رمز التحقق.');
        return;
      }
      this.verifyToken(t);
    });
  }

  verifyToken(t: string): void {
    this.isVerifying.set(true);
    this.auth.verifyResetToken(t).subscribe({
      next: (res) => {
        this.isVerifying.set(false);
        if (res && res.valid) {
          this.isTokenValid.set(true);
          this.userInfo.set(res);
        } else {
          this.isTokenValid.set(false);
          this.errorMessage.set('رابط الاستعادة غير صالح أو انتهت صلاحيته.');
        }
      },
      error: (err) => {
        this.isVerifying.set(false);
        this.isTokenValid.set(false);
        this.errorMessage.set(err?.error?.message || 'رابط الاستعادة منتهي الصلاحية أو غير صحيح. يرجى طلب رابط جديد.');
      }
    });
  }

  onSubmit(): void {
    const pwd = this.newPassword().trim();
    const confirm = this.confirmPassword().trim();

    if (!pwd || pwd.length < 6) {
      this.toast.error('يجب ألا تقل كلمة المرور عن 6 أحرف.');
      return;
    }

    if (pwd !== confirm) {
      this.toast.error('كلمتا المرور غير متطابقتين.');
      return;
    }

    this.isSubmitting.set(true);
    this.auth.resetPassword(this.token(), pwd).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
        this.toast.success('تم حفظ كلمة المرور الجديدة بنجاح.');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toast.error(err?.error?.message || 'حدث خطأ أثناء حفظ كلمة المرور.');
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/admin/login']);
  }
}

