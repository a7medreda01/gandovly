import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { AntigravityCanvasComponent } from '../shared/antigravity-canvas.component';
import { PlatformFooterComponent } from '../shared/platform-footer.component';
import { PlatformNavComponent } from '../shared/platform-nav.component';
import {
  PLATFORM_INDUSTRIES,
  PLATFORM_SERVICES,
  PlatformService,
  buildWhatsAppUrl
} from '../shared/platform-content';

@Component({
  selector: 'app-mecart-services',
  standalone: true,
  imports: [
    RouterLink,
    PlatformNavComponent,
    PlatformFooterComponent,
    AntigravityCanvasComponent
  ],
  templateUrl: './mecart-services.component.html',
  styleUrl: './mecart-services.component.scss'
})
export class MecartServicesComponent {
  readonly language = inject(LanguageService);

  readonly industries = PLATFORM_INDUSTRIES;
  readonly services = PLATFORM_SERVICES;
  readonly whatsappUrl = computed(() => buildWhatsAppUrl(this.language.currentLang()));

  getServiceWhatsAppUrl(service: PlatformService): string {
    return buildWhatsAppUrl(
      this.language.currentLang(),
      `مرحباً فريق RunX، أود الاستفسار عن خدمة (${service.titleAr}) على منصة MeCart`,
      `Hello RunX team, I would like to inquire about ${service.titleEn} on MeCart`
    );
  }

  onCardPointerMove(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }
}
