import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectPreviewComponent } from '../../../shared/components/project-preview/project-preview.component';
import { LanguageService } from '../../../core/services/language.service';
import { ProjectsService, ProjectItem } from '../../../core/services/projects.service';
import { AntigravityCanvasComponent } from '../shared/antigravity-canvas.component';
import { PlatformFooterComponent } from '../shared/platform-footer.component';
import { PlatformNavComponent } from '../shared/platform-nav.component';
import {
  PLATFORM_INDUSTRIES,
  buildWhatsAppUrl,
  getLocalizedDomainLabel
} from '../shared/platform-content';

@Component({
  selector: 'app-mecart-projects',
  standalone: true,
  imports: [
    RouterLink,
    ProjectPreviewComponent,
    PlatformNavComponent,
    PlatformFooterComponent,
    AntigravityCanvasComponent
  ],
  templateUrl: './mecart-projects.component.html',
  styleUrl: './mecart-projects.component.scss'
})
export class MecartProjectsComponent implements OnInit {
  readonly language = inject(LanguageService);
  private readonly projectsService = inject(ProjectsService);

  readonly whatsappUrl = computed(() => buildWhatsAppUrl(this.language.currentLang()));
  readonly skeletonSlots = [1, 2, 3, 4, 5, 6];

  readonly domains = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All' },
    ...PLATFORM_INDUSTRIES.map(i => ({ id: i.id, labelAr: i.labelAr, labelEn: i.labelEn }))
  ];

  readonly projects = signal<ProjectItem[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(9);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly selectedDomain = signal<string>('all');

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(page: number = 1): void {
    this.isLoading.set(true);
    this.currentPage.set(page);

    this.projectsService.getProjects(page, this.pageSize(), this.selectedDomain()).subscribe({
      next: res => {
        this.projects.set(res.items || []);
        this.totalCount.set(res.totalCount || 0);
        this.totalPages.set(res.totalPages || 1);
        this.isLoading.set(false);
      },
      error: () => {
        this.projects.set([]);
        this.isLoading.set(false);
      }
    });
  }

  filterByDomain(domainId: string): void {
    if (this.selectedDomain() === domainId) return;
    this.selectedDomain.set(domainId);
    this.loadProjects(1);
  }

  domainLabel(project: ProjectItem): string {
    return getLocalizedDomainLabel(
      project.businessDomain,
      project.domainLabel,
      this.language.currentLang()
    );
  }

  getSimilarWhatsAppUrl(project: ProjectItem): string {
    const label = this.domainLabel(project);
    return buildWhatsAppUrl(
      this.language.currentLang(),
      `مرحباً فريق RunX، أود طلب متجر مماثل لـ (${project.name}) في مجال (${label})`,
      `Hello RunX team, I would like a store similar to ${project.name} (${label})`
    );
  }

  getPagesArray(): number[] {
    const total = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  onCardPointerMove(event: PointerEvent): void {
    const el = event.currentTarget as HTMLElement | null;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }
}
