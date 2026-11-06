import { NotificationService } from './notification.service';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { shareReplay } from 'rxjs';
import { customerSessionKey } from './tenant-session';
@Injectable({providedIn:'root'})
export class CommerceService {
 private toast=inject(NotificationService);
 readonly api=inject(ApiService);private http=inject(HttpClient);
 readonly presets=this.api.get<any[]>('storefront/commerce/presets').pipe(shareReplay(1));
 resources(){return this.api.get<any[]>('admin/commerce/resources');}
 dashboard(){return this.api.get<any>('admin/commerce');}
 post(path:string,body:any){return this.api.post<any>('admin/commerce/'+path,body);}
 uploadPrescription(file:File,orderToken?:string){const f=new FormData();f.append('file',file);if(orderToken)f.append('orderToken',orderToken);return this.api.post<any>('storefront/commerce/prescriptions',f);}
 uploadDigital(id:number,file:File){const f=new FormData();f.append('file',file);return this.api.post<any>('admin/commerce/products/'+id+'/files',f);}
 availability(id:number,start:string,end?:string,quantity=1){return this.api.get<any>('storefront/commerce/availability/'+id,{start,end,quantity});}
 inquiry(body:any){return this.api.post<any>('storefront/commerce/inquiries',body);}
 inquiryStatus(token:string){return this.api.get<any>('storefront/commerce/inquiries/'+token);}
 access(token:string){return this.api.get<any>('storefront/commerce/orders/'+token+'/access');}
 download(path:string,name:string){this.http.get(this.api.baseUrl+'/'+path,{responseType:'blob'}).subscribe({next:blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},error:()=>this.toast.error('تعذر تنزيل الملف. راجع صلاحية الوصول أو حالة الدفع.')} );}
 inquiryTokens():string[]{try{return JSON.parse(localStorage.getItem(customerSessionKey('guest_inquiries_v1'))||'[]').filter((s:any)=>/^[a-f0-9]{32}$/.test(s)).slice(0,30);}catch{return[];}}
 rememberInquiry(token:string){if(!/^[a-f0-9]{32}$/.test(token))return;try{localStorage.setItem(customerSessionKey('guest_inquiries_v1'),JSON.stringify([token,...this.inquiryTokens().filter(t=>t!==token)].slice(0,30)));}catch{}}
}
