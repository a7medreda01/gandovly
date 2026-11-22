import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { RUNX_LOGO_BASE64 } from '../../../core/constants/runx-logo.base64';
import { buildWhatsAppUrl } from './platform-content';

@Component({
  selector: 'app-platform-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './platform-footer.component.html',
  styleUrl: './platform-footer.component.scss'
})
export class PlatformFooterComponent {
  readonly language = inject(LanguageService);
  readonly runxLogo = RUNX_LOGO_BASE64;
  readonly whatsappUrl = computed(() => buildWhatsAppUrl(this.language.currentLang()));
}
