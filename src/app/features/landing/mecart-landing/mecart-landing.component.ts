import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
export class MecartLandingComponent implements OnInit {
  readonly language = inject(LanguageService);
  private readonly projectsService = inject(ProjectsService);

  readonly runxLogo = RUNX_LOGO_BASE64;
  readonly metrics = PLATFORM_METRICS;
  readonly industries = PLATFORM_INDUSTRIES;

  readonly liveProjectsCount = signal<number | null>(null);
  readonly whatsappUrl = computed(() => buildWhatsAppUrl(this.language.currentLang()));

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

  onCardPointerMove(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }
}
