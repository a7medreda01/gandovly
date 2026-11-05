import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ProjectItem {
  id: string;
  name: string;
  businessDomain: string;
  domainLabel: string;
  subdomain: string;
  customDomain?: string;
  url: string;
  relativeUrl?: string;
  thumbnail?: string;
  productsCount: number;
  isLive: boolean;
  status: string;
  createdAt: string;
}

export interface PaginatedProjectsResult {
  items: ProjectItem[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  getProjects(pageNumber: number = 1, pageSize: number = 10, domain?: string): Observable<PaginatedProjectsResult> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (domain && domain !== 'all') {
      params = params.set('domain', domain);
    }

    return this.http.get<{ success: boolean; data: PaginatedProjectsResult }>(this.baseUrl, { params }).pipe(
      map(res => ({ ...res.data, items: res.data.items.map(project => ({ ...project,
        domainLabel: ({Supermarket:'سوبر ماركت وبقالة',Restaurant:'مطاعم وكافيهات',Pharmacy:'صيدليات ومستحضرات',AutoParts:'قطع غيار ومستلزمات',Electronics:'إلكترونيات وأجهزة',GeneralRetail:'محلات وتجارة عامة'} as Record<string,string>)[project.businessDomain] || project.domainLabel
      })) })),
      catchError(() => of({ items: [], pageNumber, pageSize, totalCount: 0, totalPages: 0 }))
    );
  }

}
