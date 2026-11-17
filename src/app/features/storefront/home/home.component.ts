import { Component, inject } from '@angular/core';
import { SettingsService } from '../../../core/services/settings.service';
import { ClassicHomeThemeComponent } from './themes/classic/classic-home-theme.component';
import { CardsHomeThemeComponent } from './themes/cards/cards-home-theme.component';
import { EditorialHomeThemeComponent } from './themes/editorial/editorial-home-theme.component';
import { DiscoveryHomeThemeComponent } from './themes/discovery/discovery-home-theme.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ClassicHomeThemeComponent, CardsHomeThemeComponent, EditorialHomeThemeComponent, DiscoveryHomeThemeComponent],
  template: `@switch (homeTheme) {
    @case ('cards') { <app-cards-home-theme /> }
    @case ('editorial') { <app-editorial-home-theme /> }
    @case ('discovery') { <app-discovery-home-theme /> }
    @default { <app-classic-home-theme /> }
  }`
})
export class HomeComponent {
  private readonly settingsService = inject(SettingsService);
  get homeTheme() { return this.settingsService.settings().storeLayout?.homeTheme || 'classic'; }
}
