import { Component, inject, signal } from '@angular/core';
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
export class AdminLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly toast = inject(NotificationService);
  private readonly router = inject(Router);

  username: string = 'admin';
  password: string = 'Admin@123';
  isLoading = signal<boolean>(false);

  login() {
    if (!this.username.trim() || !this.password.trim()) {
      this.toast.error('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    this.isLoading.set(true);
    this.authService.adminLogin(this.username.trim(), this.password.trim()).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.toast.success('تم تسجيل الدخول بنجاح إلى لوحة الإدارة.');
        this.router.navigate(['/admin/dashboard']);
      },
      error: () => {
        this.isLoading.set(false);
        this.toast.error('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    });
  }
}
