import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectsService, ProjectItem } from '../../../core/services/projects.service';

@Component({
  selector: 'app-mecart-projects',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mecart-projects.component.html',
  styleUrls: ['./mecart-projects.component.scss']
})
export class MecartProjectsComponent implements OnInit {
  private readonly projectsService = inject(ProjectsService);

  readonly whatsappUrl = 'https://wa.me/201080225502?text=' + encodeURIComponent('مرحباً فريق RunX، أرغب في طلب خدمة متجر واستضافة سحابية على منصة MeCart');

  projects = signal<ProjectItem[]>([]);
  isLoading = signal<boolean>(true);
  currentPage = signal<number>(1);
  pageSize = signal<number>(9);
  totalCount = signal<number>(0);
  totalPages = signal<number>(1);
  selectedDomain = signal<string>('all');

  domains = [
    { id: 'all', label: 'كافة المشاريع' },
    { id: 'Supermarket', label: 'سوبر ماركت وبقالة' },
    { id: 'Restaurant', label: 'مطاعم وكافيهات' },
    { id: 'Pharmacy', label: 'صيدليات ومستحضرات' },
    { id: 'AutoParts', label: 'قطع غيار ومعدات' },
    { id: 'Electronics', label: 'إلكترونيات وأجهزة' },
    { id: 'GeneralRetail', label: 'أزياء وتجارة عامة' }
  ];

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(page: number = 1): void {
    this.isLoading.set(true);
    this.currentPage.set(page);

    this.projectsService.getProjects(page, this.pageSize(), this.selectedDomain()).subscribe({
      next: (res) => {
        this.projects.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  filterByDomain(domainId: string): void {
    this.selectedDomain.set(domainId);
    this.loadProjects(1);
  }

  getSimilarWhatsAppUrl(project: ProjectItem): string {
    const text = `مرحباً فريق RunX، أود الاستفسار عن استضافة متجر مماثل لـ (${project.name}) في مجال (${project.domainLabel})`;
    return `https://wa.me/201080225502?text=${encodeURIComponent(text)}`;
  }

  getPagesArray(): number[] {
    const total = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }
}

