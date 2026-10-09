import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { SettingsService } from './core/services/settings.service';

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
    }
  }

  ngOnDestroy(): void {
    if (this.modalObserver) {
      this.modalObserver.disconnect();
    }
    if (isPlatformBrowser(this.platformId)) {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
  }
}
