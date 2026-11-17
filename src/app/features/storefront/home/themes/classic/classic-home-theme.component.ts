import { Component } from '@angular/core';
import { HomeContentComponent } from '../../home-content.component';

@Component({ selector: 'app-classic-home-theme', standalone: true, imports: [HomeContentComponent], template: '<app-home-content />', styleUrl: './classic-home-theme.component.scss' })
export class ClassicHomeThemeComponent {}
