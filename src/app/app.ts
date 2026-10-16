import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SettingsService } from './core/services/settings.service';
import { ApiService } from './core/services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit, OnDestroy {
  title = 'أسماك جندوفلي';
  private modalObserver?: MutationObserver;
  private routerSub?: Subscription;

  private router = inject(Router);
  private apiService = inject(ApiService);

  constructor(
    private settingsService: SettingsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Load dynamic restaurant settings & theme variables
    this.settingsService.loadSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.settingsService.applyTheme(settings);
        }
      },
      error: (err) => {
        console.warn('Could not load dynamic settings initially:', err);
      }
    });

    // Global Modal & Drawer Scroll Lock
    if (isPlatformBrowser(this.platformId)) {
      const checkModals = () => {
        const hasOpenModal = !!document.querySelector('.modal-backdrop, .drawer-backdrop, .ui-modal-backdrop, [class*="modal-backdrop"]');
        if (hasOpenModal) {
          document.body.classList.add('modal-open');
          document.documentElement.classList.add('modal-open');
        } else {
          document.body.classList.remove('modal-open');
          document.documentElement.classList.remove('modal-open');
        }
      };

      this.modalObserver = new MutationObserver(() => checkModals());
      this.modalObserver.observe(document.body, { childList: true, subtree: true });

      // Initialize Customer Visit Analytics Tracking
      this.initVisitTracking();
    }
  }

  private initVisitTracking(): void {
    try {
      let visitorToken = localStorage.getItem('gandofly_vid');
      if (!visitorToken) {
        visitorToken = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        localStorage.setItem('gandofly_vid', visitorToken);
      }

      let lastRecordedUrl = '';
      let lastRecordedTime = 0;

      const recordUrlVisit = (url: string) => {
        if (!url || url.startsWith('/admin') || url.startsWith('/kitchen')) {
          return;
        }

        const now = Date.now();
        if (url === lastRecordedUrl && (now - lastRecordedTime) < 5000) {
          return;
        }

        lastRecordedUrl = url;
        lastRecordedTime = now;

        const width = window.innerWidth;
        const deviceType = width < 768 ? 'Mobile' : width < 1024 ? 'Tablet' : 'Desktop';

        const ua = navigator.userAgent;
        let browser = 'Other';
        if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

        this.apiService.post('api/v1/storefront/analytics/record-visit', {
          visitorToken,
          path: url,
          referrer: document.referrer || '',
          deviceType,
          browser
        }).subscribe({
          error: () => {
            // Silently swallow analytics errors
          }
        });
      };

      // Initial page visit
      setTimeout(() => {
        const currentPath = window.location.pathname;
        recordUrlVisit(currentPath);
      }, 1200);

      // Route change events
      this.routerSub = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          recordUrlVisit(event.urlAfterRedirects || event.url);
        });
    } catch {
      // Swallowed
    }
  }

  ngOnDestroy(): void {
    if (this.modalObserver) {
      this.modalObserver.disconnect();
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
  }
}
