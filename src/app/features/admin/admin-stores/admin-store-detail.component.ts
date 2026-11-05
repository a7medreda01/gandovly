import { Component, inject, computed, effect, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminStoresComponent } from './admin-stores.component';
@Component({standalone:true,imports:[CommonModule,RouterLink,FormsModule],templateUrl:'./admin-store-detail.component.html',styleUrl:'./admin-store-detail.component.scss'})
export class AdminStoreDetailComponent extends AdminStoresComponent {
private readonly dialogEffect=effect(onCleanup=>{
 if(!this.supportLoginUrl())return;
 const previous=document.activeElement as HTMLElement|null;
 const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
 const timer=setTimeout(()=>document.querySelector<HTMLElement>('.support-dialog')?.focus(),0);
 onCleanup(()=>{clearTimeout(timer);document.body.style.overflow=overflow;previous?.focus();});
});
@HostListener('document:keydown',['$event']) onDialogKey(event:KeyboardEvent){
 if(!this.supportLoginUrl())return;
 if(event.key==='Escape'){event.preventDefault();this.supportLoginUrl.set(null);}
 if(event.key==='Tab'){
 const elements=Array.from(document.querySelectorAll<HTMLElement>('.support-dialog a,.support-dialog button'));
 const first=elements[0],last=elements[elements.length-1];
 if(event.shiftKey&&(document.activeElement===first||document.activeElement?.classList.contains('support-dialog'))){event.preventDefault();last?.focus();}
 else if(!event.shiftKey&&(document.activeElement===last||document.activeElement?.classList.contains('support-dialog'))){event.preventDefault();first?.focus();}
 }
}
private readonly detailApi=inject(ApiService);
private readonly notice=inject(NotificationService);
editing=false; saving=false;
domainInput=''; domainBusy=false; domainProof:any=null;
prepareDomain(){const s=this.store();if(!s||this.domainBusy)return;this.domainBusy=true;this.domainProof=null;this.detailApi.post<any>('admin/tenants/'+s.id+'/custom-domain/challenge',{domain:this.domainInput}).subscribe({next:r=>{this.domainBusy=false;this.domainProof=r;this.domainInput=r.domain;},error:e=>{this.domainBusy=false;this.notice.error(e.error?.message||'تعذر إنشاء التحقق');}});}
verifyDomain(){const s=this.store();if(!s||!this.domainProof||this.domainBusy)return;this.domainBusy=true;this.detailApi.post<any>('admin/tenants/'+s.id+'/custom-domain/verify',this.domainProof).subscribe({next:()=>{this.domainBusy=false;this.domainProof=null;this.loadStores();this.notice.success('تم التحقق وربط الدومين');},error:e=>{this.domainBusy=false;this.notice.error(e.error?.message||'تعذر التحقق');}});}
draft={name:'',plan:'Growth',ownerPhone:'',ownerEmail:''};
editDetails(){const s=this.store();if(s){this.draft={name:s.name,plan:s.plan,ownerPhone:s.ownerPhone||'',ownerEmail:s.ownerEmail||''};this.editing=true;}}
saveDetails(){const s=this.store();if(!s||this.saving)return;this.saving=true;this.detailApi.put<boolean>('admin/tenants/'+s.id+'/details',this.draft).subscribe({next:()=>{this.saving=false;this.editing=false;this.loadStores();this.notice.success('تم حفظ بيانات سجل المتجر.');},error:e=>{this.saving=false;this.notice.error(e.error?.message||'تعذر حفظ البيانات');}});}
readonly sections=[{path:'settings',label:'الإعدادات والهوية والدومين'},{path:'catalog',label:'المنتجات والأقسام والخيارات'},{path:'orders',label:'الطلبات'},{path:'delivery-zones',label:'مناطق التوصيل'},{path:'reports',label:'التقارير'},{path:'analytics',label:'الإحصائيات'},{path:'notifications',label:'الإشعارات وواتساب'}];
openSection(path:string){const s=this.store();if(!s)return;this.detailApi.post<{loginPath:string}>('admin/tenants/'+s.id+'/support-access',{}).subscribe({next:r=>{const url=new URL(r.loginPath,new URL(this.ownerLoginUrl(s)).origin);url.searchParams.set('section',path);this.supportLoginUrl.set(url.href);},error:()=>this.notice.error('تعذر إنشاء جلسة الدعم. اختر متجرًا نشطًا.')});}
private readonly route=inject(ActivatedRoute);
readonly store=computed(()=>this.stores().find(s=>s.id===this.route.snapshot.paramMap.get('id')));
}