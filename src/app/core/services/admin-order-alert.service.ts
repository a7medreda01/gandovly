import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, Subscription, timer } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';

export interface LatestOrderAlert {
  latestOrderId: number;
  orderNumber: string;
  customerName?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  pendingCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrderAlertService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);

  private readonly apiUrl = environment.apiUrl;
  private pollSub?: Subscription;
  private lastKnownOrderId: number | null = null;
  private audioCtx: AudioContext | null = null;

  // Signals for state
  readonly isSupported = typeof window !== 'undefined' && 'Notification' in window;
  readonly permission = signal<NotificationPermission>(
    this.isSupported ? Notification.permission : 'denied'
  );
  readonly isSoundEnabled = signal<boolean>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('mecart_admin_order_sound') !== 'false' : true
  );
  readonly pendingCount = signal<number>(0);
  readonly latestNewOrder = signal<LatestOrderAlert | null>(null);

  // Observable event when a new order arrives
  readonly newOrder$ = new Subject<LatestOrderAlert>();

  constructor() {
    if (this.isSupported) {
      this.permission.set(Notification.permission);
    }
    this.initPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.audioCtx?.close().catch(() => {});
  }

  // --- Notification Permission & Sound Toggles ---

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    // Unlock AudioContext on user interaction
    this.ensureAudioContext();

    try {
      const perm = await Notification.requestPermission();
      this.permission.set(perm);
      if (perm === 'granted') {
        this.playOrderChime();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  toggleSound(): boolean {
    const next = !this.isSoundEnabled();
    this.isSoundEnabled.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mecart_admin_order_sound', String(next));
    }
    if (next) {
      this.playOrderChime();
    }
    return next;
  }

  dismissLatestAlert(): void {
    this.latestNewOrder.set(null);
  }

  viewLatestOrder(): void {
    const alert = this.latestNewOrder();
    this.dismissLatestAlert();
    if (alert) {
      this.router.navigate(['/admin/orders'], { queryParams: { orderId: alert.latestOrderId } });
    }
  }

  // --- Web Audio Chime (Offline, Zero-Asset, Pleasant Chime) ---

  private ensureAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  playOrderChime(): void {
    if (!this.isSoundEnabled()) return;

    // Mobile vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch { /* Ignore vibration errors */ }
    }

    try {
      const ctx = this.ensureAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1: E5 (659.25 Hz)
      this.playTone(ctx, 659.25, now, 0.35, 0.25);
      // Tone 2: C5 (523.25 Hz) (Classic melodic cash-register / order chime)
      this.playTone(ctx, 523.25, now + 0.18, 0.45, 0.3);
      // Tone 3: G5 (783.99 Hz) High sparkle
      this.playTone(ctx, 783.99, now + 0.36, 0.6, 0.35);
    } catch {
      // Fallback: Audio synthesis suppressed or unallowed
    }
  }

  private playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, maxGain: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(maxGain, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  testChime(): void {
    this.ensureAudioContext();
    this.playOrderChime();
  }

  // --- Browser Notification Dispatch ---

  private showBrowserNotification(order: LatestOrderAlert): void {
    if (!this.isSupported || this.permission() !== 'granted') return;

    const currency = this.settingsService.settings()?.currencySymbol || 'ج.م';
    const storeName = this.settingsService.settings()?.restaurantName || 'متجرك';
    const title = `🔔 طلب جديد #${order.orderNumber || order.latestOrderId}`;
    const body = `العميل: ${order.customerName || 'عميل المتجر'} | الإجمالي: ${order.totalAmount} ${currency}`;
    const icon = this.settingsService.settings()?.logoUrl || '/favicon.png';

    const options: any = {
      body,
      icon,
      badge: '/favicon.png',
      tag: `mecart-order-${order.latestOrderId}`,
      renotify: true,
      requireInteraction: true,
      data: { orderId: order.latestOrderId }
    };

    // If Service Worker is active on mobile, use registration.showNotification for best mobile background integration
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, options).catch(() => {
          this.fallbackNotification(title, options, order.latestOrderId);
        });
      }).catch(() => {
        this.fallbackNotification(title, options, order.latestOrderId);
      });
    } else {
      this.fallbackNotification(title, options, order.latestOrderId);
    }
  }

  private fallbackNotification(title: string, options: NotificationOptions, orderId: number): void {
    try {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        try { window.focus(); } catch {}
        this.router.navigate(['/admin/orders'], { queryParams: { orderId } });
        notif.close();
      };
    } catch { /* System notification failure */ }
  }

  // --- Polling Lifecycle ---

  initPolling(): void {
    if (this.pollSub) return;

    // Check every 15 seconds when authenticated as admin
    this.pollSub = timer(1000, 15000).pipe(
      filter(() => this.auth.currentAdmin() !== null),
      switchMap(() => this.http.get<{ success: boolean; data?: LatestOrderAlert }>(`${this.apiUrl}/admin/orders/latest-alert`))
    ).subscribe({
      next: (res) => {
        if (!res?.success || !res.data) return;

        const data = res.data;
        this.pendingCount.set(data.pendingCount || 0);

        // First initialization: capture baseline without alerting
        if (this.lastKnownOrderId === null) {
          this.lastKnownOrderId = data.latestOrderId;
          return;
        }

        // New order detected!
        if (data.latestOrderId > this.lastKnownOrderId) {
          this.lastKnownOrderId = data.latestOrderId;
          this.handleNewOrder(data);
        }
      },
      error: () => {
        // Silent backoff on polling error (e.g. transient network drop)
      }
    });
  }

  private handleNewOrder(data: LatestOrderAlert): void {
    // 1. Play audio chime
    this.playOrderChime();

    // 2. Dispatch browser notification
    this.showBrowserNotification(data);

    // 3. Set visual in-app banner alert
    this.latestNewOrder.set(data);

    // 4. Notify active subscribers (e.g. AdminOrdersComponent to reload list)
    this.newOrder$.next(data);
  }

  stopPolling(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = undefined;
    }
  }
}
