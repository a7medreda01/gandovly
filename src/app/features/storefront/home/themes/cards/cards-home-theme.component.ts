import { Component } from '@angular/core';
import { HomeContentComponent } from '../../home-content.component';

@Component({ selector: 'app-cards-home-theme', standalone: true, imports: [HomeContentComponent], template: '<app-home-content />', styleUrl: './cards-home-theme.component.scss' })
export class CardsHomeThemeComponent {}
