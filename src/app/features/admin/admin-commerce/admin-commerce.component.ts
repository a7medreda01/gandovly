import { signal } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';import { finalize } from 'rxjs';
import { Component, inject } from '@angular/core';import { CommonModule } from '@angular/common';import { FormsModule } from '@angular/forms';import { CommerceService } from '../../../core/services/commerce.service';import { ApiService } from '../../../core/services/api.service';import { NotificationService } from '../../../core/services/notification.service';
@Component({standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./admin-commerce.component.html',styleUrl:'./admin-commerce.component.scss'})
export class AdminCommerceComponent{
 private readonly cdr=inject(ChangeDetectorRef);
 readonly service=inject(CommerceService);private api=inject(ApiService);private toast=inject(NotificationService);
 private readonly dataState=signal<any>(null);get data(){return this.dataState();}set data(v:any){this.dataState.set(v);}private readonly busyState=signal(false);get busy(){return this.busyState();}set busy(v:boolean){this.busyState.set(v);}private readonly errorState=signal('');get error(){return this.errorState();}set error(v:string){this.errorState.set(v);}private readonly productState=signal<any[]>([]);get products(){return this.productState();}set products(v:any[]){this.productState.set(v);}tab='resources';search='';productId=0;reference='';paymentOrderId=0;codes='';reviewNotes:Record<number,string>={};day='';
 resource:any={name:'',capacity:1,isActive:true,opensAt:'09:00',closesAt:'18:00',daysOfWeek:'0,1,2,3,4,5,6',blackouts:''};batch:any={lotNumber:'',expiresOn:'',quantity:1};
 tabs=[{id:'resources',name:'المواعيد والموارد'},{id:'prescriptions',name:'الروشتات'},{id:'inquiries',name:'السيارات والعروض'},{id:'digital',name:'الملفات والأكواد'},{id:'subscriptions',name:'الاشتراكات والدفع'},{id:'batches',name:'التشغيلات والصلاحية'}];
 ngOnInit(){this.load();this.loadProducts();}
 load(){this.error='';this.service.dashboard().pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:r=>this.data=r,error:e=>this.error=e.error?.message||'تعذر تحميل التشغيل'});}
 loadProducts(){this.api.get<any>('admin/catalog/products',{search:this.search,pageSize:50}).pipe(finalize(()=>this.cdr.markForCheck())).subscribe(r=>this.products=r.items||[]);}
 action(path:string,body:any){if(this.busy)return;this.busy=true;this.service.post(path,body).pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:()=>{this.busy=false;this.reference='';this.toast.success('تم حفظ الإجراء');this.load();},error:e=>{this.busy=false;this.toast.error(e.error?.message||'تعذر تنفيذ الإجراء');}});}
 newResource(){this.resource={name:"",capacity:1,isActive:true,opensAt:"09:00",closesAt:"18:00",daysOfWeek:"0,1,2,3,4,5,6",blackouts:""};}
 saveResource(){this.action('resources',{...this.resource,blackoutDates:this.resource.blackouts.split(/[\s,]+/).filter(Boolean)});}
 editResource(r:any){this.resource={...r,blackouts:JSON.parse(r.blackoutDatesJson||'[]').join('\n')};}
 saveBatch(){this.action('batches',{...this.batch,productId:Number(this.productId)});}
 blockBatch(b:any){this.api.patch('admin/commerce/batches/'+b.id,{isActive:b.isBlocked}).pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:()=>this.load(),error:e=>this.toast.error(e.error?.message||'تعذر التعديل')});}
 upload(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file||!this.productId)return;this.busy=true;this.service.uploadDigital(Number(this.productId),file).pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:()=>{this.busy=false;this.load();this.toast.success('تم رفع الملف الخاص');},error:e=>{this.busy=false;this.toast.error(e.error?.message||'تعذر الرفع');}});}
 assetActive(a:any){this.api.patch('admin/commerce/assets/'+a.id,{isActive:!a.isActive}).pipe(finalize(()=>this.cdr.markForCheck())).subscribe(()=>this.load());}
 saveInquiry(row:any){this.busy=true;this.api.put('admin/commerce/inquiries/'+row.id,row).pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:()=>{this.busy=false;this.load();this.toast.success('تم حفظ العرض');},error:e=>{this.busy=false;this.toast.error(e.error?.message||'تعذر الحفظ');}});}
 get bookings(){return[...(this.data?.bookings||[]),...(this.data?.inquiries||[]).filter((i:any)=>i.action==="visit"&&i.status==="Approved").map((i:any)=>({id:"visit-"+i.id,inquiryId:i.id,resourceId:i.resourceId,productNameAr:"معاينة",startsAt:i.preferredAt,endsAt:i.endsAt,quantity:1,state:i.status}))].filter((r:any)=>!this.day||new Date(r.startsAt).toLocaleDateString('en-CA')===this.day);}
 resourceName(id:number){return this.data?.resources?.find((r:any)=>r.id===id)?.name||'#'+id;}
}
