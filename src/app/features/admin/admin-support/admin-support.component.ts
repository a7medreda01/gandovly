import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-support', standalone: true, imports: [RouterLink],
  template: `<main class="support-entry"><h1>دخول دعم المتجر</h1>@if (error()) { <p role="alert">{{ error() }}</p><a routerLink="/admin/login">تسجيل الدخول</a> } @else { <p role="status">جاري التحقق من رابط الدعم المؤقت…</p> }</main>`,
  styles: [`.support-entry { max-width: 550px; margin: 15vh auto; padding: 32px; background: white; border: 1px solid #e2e8f0; border-radius: 16px; }`]
})
export class AdminSupportComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  error = signal('');
  ngOnInit() {
    const code = new URLSearchParams(this.route.snapshot.fragment || '').get('support');
    // Remove the single-use code from browser history before exchanging it.
    this.router.navigate([], { relativeTo: this.route, fragment: undefined, replaceUrl: true, queryParamsHandling: 'preserve' });
    if (!code) { this.error.set('رابط الدعم غير صالح. افتح جلسة جديدة من لوحة المنصة.'); return; }
    this.auth.startSupportSession(code).subscribe({
      next: () => this.router.navigate(['/admin/orders'], { replaceUrl: true, queryParamsHandling: 'preserve' }),
      error: () => this.error.set('الرابط مستخدم بالفعل أو انتهت صلاحيته. أنشئ رابط دعم جديدًا من لوحة المنصة.')
    });
  }
}
