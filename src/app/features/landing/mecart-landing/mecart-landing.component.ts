import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { RUNX_LOGO_BASE64 } from '../../../core/constants/runx-logo.base64';
import { AntigravityCanvasComponent } from '../shared/antigravity-canvas.component';
import { PlatformFooterComponent } from '../shared/platform-footer.component';
import { PlatformNavComponent } from '../shared/platform-nav.component';
import {
  PLATFORM_INDUSTRIES,
  PLATFORM_METRICS,
  buildWhatsAppUrl
} from '../shared/platform-content';

@Component({
  selector: 'app-mecart-landing',
  standalone: true,
  imports: [
    RouterLink,
    PlatformNavComponent,
    PlatformFooterComponent,
    AntigravityCanvasComponent
  ],
  templateUrl: './mecart-landing.component.html',
  styleUrl: './mecart-landing.component.scss'
})
export class MecartLandingComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly language = inject(LanguageService);
  private readonly projectsService = inject(ProjectsService);

  readonly runxLogo = RUNX_LOGO_BASE64;
  readonly metrics = PLATFORM_METRICS;
  readonly industries = PLATFORM_INDUSTRIES;

  readonly liveProjectsCount = signal<number | null>(null);
  readonly whatsappUrl = computed(() => buildWhatsAppUrl(this.language.currentLang()));

  @ViewChild('finaleWrap') finaleWrapRef?: ElementRef<HTMLElement>;
  readonly finaleInView = signal<boolean>(false);
  private finaleObserver?: IntersectionObserver;

  ngOnInit(): void {
    this.projectsService.getProjects(1, 1).subscribe({
      next: res => {
        if (res && typeof res.totalCount === 'number' && res.totalCount > 0) {
          this.liveProjectsCount.set(res.totalCount);
        }
      },
      error: () => {
        // Fail silently when platform metrics are unavailable
      }
    });
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && this.finaleWrapRef) {
      this.finaleObserver = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.finaleInView.set(true);
            }
          }
        },
        {
          threshold: 0.15,
          rootMargin: '0px 0px -40px 0px'
        }
      );
      this.finaleObserver.observe(this.finaleWrapRef.nativeElement);
    } else {
      // Fallback for environments without observer
      this.finaleInView.set(true);
    }
  }

  ngOnDestroy(): void {
    this.finaleObserver?.disconnect();
  }

  onCardPointerMove(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }

  onFinalePointerMove(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -5;
    const rotY = ((x - cx) / cx) * 5;
    el.style.setProperty('--fx', `${x}px`);
    el.style.setProperty('--fy', `${y}px`);
    el.style.setProperty('--rot-x', `${rotX.toFixed(2)}deg`);
    el.style.setProperty('--rot-y', `${rotY.toFixed(2)}deg`);
  }

  onFinalePointerLeave(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    el.style.setProperty('--rot-x', '0deg');
    el.style.setProperty('--rot-y', '0deg');
  }
}
