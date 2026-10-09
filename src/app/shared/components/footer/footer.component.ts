import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
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
  currentYear = new Date().getFullYear();
  readonly tiktokUrl = 'https://www.tiktok.com/@gandofly111';
}
