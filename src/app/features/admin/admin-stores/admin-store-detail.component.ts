import { Component, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminStoresComponent } from './admin-stores.component';
@Component({standalone:true,imports:[CommonModule,RouterLink,FormsModule],templateUrl:'./admin-store-detail.component.html',styleUrl:'./admin-store-detail.component.scss'})
export class AdminStoreDetailComponent extends AdminStoresComponent {
private readonly detailApi=inject(ApiService);
private readonly notice=inject(NotificationService);
editing=false; saving=false;
draft={name:'',plan:'Growth',ownerPhone:'',ownerEmail:''};
editDetails(){const s=this.store();if(s){this.draft={name:s.name,plan:s.plan,ownerPhone:s.ownerPhone||'',ownerEmail:s.ownerEmail||''};this.editing=true;}}
saveDetails(){const s=this.store();if(!s||this.saving)return;this.saving=true;this.detailApi.put<boolean>('admin/tenants/'+s.id+'/details',this.draft).subscribe({next:()=>{this.saving=false;this.editing=false;this.loadStores();this.notice.success('تم حفظ بيانات سجل المتجر.');},error:e=>{this.saving=false;this.notice.error(e.error?.message||'تعذر حفظ البيانات');}});}
readonly sections=[{path:'settings',label:'الإعدادات والهوية والدومين'},{path:'catalog',label:'المنتجات والأقسام والخيارات'},{path:'orders',label:'الطلبات'},{path:'delivery-zones',label:'مناطق التوصيل'},{path:'reports',label:'التقارير'},{path:'analytics',label:'الإحصائيات'},{path:'notifications',label:'الإشعارات وواتساب'}];
openSection(path:string){const s=this.store();if(!s)return;this.detailApi.post<{loginPath:string}>('admin/tenants/'+s.id+'/support-access',{}).subscribe({next:r=>{const url=new URL(r.loginPath,new URL(this.ownerLoginUrl(s)).origin);url.searchParams.set('section',path);this.supportLoginUrl.set(url.href);},error:()=>this.notice.error('تعذر إنشاء جلسة الدعم. اختر متجرًا نشطًا.')});}
private readonly route=inject(ActivatedRoute);
readonly store=computed(()=>this.stores().find(s=>s.id===this.route.snapshot.paramMap.get('id')));
}