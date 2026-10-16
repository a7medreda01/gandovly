import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);

  get baseUrl(): string {
    return (environment.apiUrl || '').replace(/\/+$/, '');
  }

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    const cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/^api\/v1\/?/i, '');
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}/${cleanEndpoint}`, { params: httpParams })
      .pipe(map(res => res.data));
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    const cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/^api\/v1\/?/i, '');
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}/${cleanEndpoint}`, body)
      .pipe(map(res => res.data));
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    const cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/^api\/v1\/?/i, '');
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}/${cleanEndpoint}`, body)
      .pipe(map(res => res.data));
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    const cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/^api\/v1\/?/i, '');
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}/${cleanEndpoint}`, body)
      .pipe(map(res => res.data));
  }

  delete<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    const cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/^api\/v1\/?/i, '');
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}/${cleanEndpoint}`, { params: httpParams })
      .pipe(map(res => res.data));
  }
}
