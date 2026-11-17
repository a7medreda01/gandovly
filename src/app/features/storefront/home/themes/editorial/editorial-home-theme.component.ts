import { Component } from '@angular/core';
import { HomeContentComponent } from '../../home-content.component';

@Component({ selector: 'app-editorial-home-theme', standalone: true, imports: [HomeContentComponent], template: '<app-home-content />', styleUrl: './editorial-home-theme.component.scss' })
export class EditorialHomeThemeComponent {}
