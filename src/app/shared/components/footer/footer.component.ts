import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { LanguageService } from '../../../core/services/language.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly settingsService = inject(SettingsService);
  readonly languageService = inject(LanguageService);
  currentYear = new Date().getFullYear();
  get whatsappUrl() { return 'https://wa.me/' + (this.settingsService.settings().whatsapp || '').replace(/\D/g, ''); }
}
