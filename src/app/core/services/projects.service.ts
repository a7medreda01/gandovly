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
      map(res => res.data),
      catchError(err => {
        console.warn('Failed to load projects from API, using fallback data', err);
        return of(this.getFallbackProjects(pageNumber, pageSize, domain));
      })
    );
  }

  private getFallbackProjects(pageNumber: number, pageSize: number, domain?: string): PaginatedProjectsResult {
    let list: ProjectItem[] = [
      {
        id: 'p-01',
        name: 'سوبر ماركت وكارفور البركة',
        businessDomain: 'Supermarket',
        domainLabel: 'سوبر ماركت وبقالة',
        subdomain: 'super',
        customDomain: 'supermarket1.runasp.net',
        url: 'https://super.mecart.app',
        relativeUrl: '/store',
        thumbnail: '/assets/images/banners/hero-desktop.jpg',
        productsCount: 1037,
        isLive: true,
        status: 'Active',
        createdAt: new Date().toISOString()
      },
      {
        id: 'p-02',
        name: 'مطاعم وكافيهات قصر الشام',
        businessDomain: 'Restaurant',
        domainLabel: 'مطاعم ومأكولات',
        subdomain: 'sham',
        url: 'https://sham.mecart.app',
        thumbnail: '/assets/images/branding/platter-family.jpg',
        productsCount: 85,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'p-03',
        name: 'صيدليات رعاية والشفاء التخصصية',
        businessDomain: 'Pharmacy',
        domainLabel: 'صيدلية ومستحضرات',
        subdomain: 'shefaa',
        url: 'https://shefaa.mecart.app',
        productsCount: 320,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
      },
      {
        id: 'p-04',
        name: 'الرواد لقطع غيار ومعدات السيارات',
        businessDomain: 'AutoParts',
        domainLabel: 'قطع غيار ومعدات',
        subdomain: 'alrowad',
        url: 'https://alrowad.mecart.app',
        productsCount: 540,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
      },
      {
        id: 'p-05',
        name: 'سمارت تك للأجهزة الذكية والإلكترونيات',
        businessDomain: 'Electronics',
        domainLabel: 'إلكترونيات وأجهزة',
        subdomain: 'smarttech',
        url: 'https://smarttech.mecart.app',
        productsCount: 190,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
      },
      {
        id: 'p-06',
        name: 'إيليجانت للأزياء والموضة العصرية',
        businessDomain: 'GeneralRetail',
        domainLabel: 'أزياء وتجارة عامة',
        subdomain: 'elegant',
        url: 'https://elegant.mecart.app',
        productsCount: 210,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
      },
      {
        id: 'p-07',
        name: 'هايبر ماركت الوادي الأخضر',
        businessDomain: 'Supermarket',
        domainLabel: 'سوبر ماركت وبقالة',
        subdomain: 'alwadi',
        url: 'https://alwadi.mecart.app',
        productsCount: 820,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
      },
      {
        id: 'p-08',
        name: 'برجر وفرايز كلاسيك هاوس',
        businessDomain: 'Restaurant',
        domainLabel: 'مطاعم ومأكولات',
        subdomain: 'burgerhouse',
        url: 'https://burgerhouse.mecart.app',
        productsCount: 45,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString()
      },
      {
        id: 'p-09',
        name: 'صيدلية ومستحضرات تجميل ابن سينا',
        businessDomain: 'Pharmacy',
        domainLabel: 'صيدلية ومستحضرات',
        subdomain: 'ibnsina',
        url: 'https://ibnsina.mecart.app',
        productsCount: 410,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 16).toISOString()
      },
      {
        id: 'p-10',
        name: 'أوتو إكسبريس لزيوت وفلاتر السيارات',
        businessDomain: 'AutoParts',
        domainLabel: 'قطع غيار ومعدات',
        subdomain: 'autoexpress',
        url: 'https://autoexpress.mecart.app',
        productsCount: 280,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 18).toISOString()
      },
      {
        id: 'p-11',
        name: 'إلكترو ستور مصر للموبايلات واللابتوب',
        businessDomain: 'Electronics',
        domainLabel: 'إلكترونيات وأجهزة',
        subdomain: 'electrostore',
        url: 'https://electrostore.mecart.app',
        productsCount: 160,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
      },
      {
        id: 'p-12',
        name: 'مودا كيدز لملابس ومستلزمات الأطفال',
        businessDomain: 'GeneralRetail',
        domainLabel: 'أزياء وتجارة عامة',
        subdomain: 'modakids',
        url: 'https://modakids.mecart.app',
        productsCount: 310,
        isLive: true,
        status: 'Active',
        createdAt: new Date(Date.now() - 86400000 * 22).toISOString()
      }
    ];

    if (domain && domain !== 'all') {
      list = list.filter(p => p.businessDomain.toLowerCase() === domain.toLowerCase());
    }

    const totalCount = list.length;
    const startIndex = (pageNumber - 1) * pageSize;
    const items = list.slice(startIndex, startIndex + pageSize);

    return {
      items,
      pageNumber,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  }
}

