import { Injectable, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
@Injectable({providedIn:'root'})
export class StoreDomainResolver {
  private http = new HttpClient(inject(HttpBackend));
  readonly slug = this.http.get<{data:{slug:string}}>(environment.apiUrl + '/public/store-domain', {params:{host:window.location.hostname}}).pipe(map(result=>result.data.slug), shareReplay({bufferSize:1,refCount:false}));
}
