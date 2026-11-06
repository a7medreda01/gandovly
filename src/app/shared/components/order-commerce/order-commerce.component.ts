import { signal } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';import { finalize } from 'rxjs';
import { Component, Input, inject } from '@angular/core';import { CommonModule } from '@angular/common';import { CommerceService } from '../../../core/services/commerce.service';import { Order } from '../../../core/models/models';import { NotificationService } from '../../../core/services/notification.service';
@Component({selector:'app-order-commerce',standalone:true,imports:[CommonModule],templateUrl:'./order-commerce.component.html',styleUrl:'../product-commerce/product-commerce.component.scss'})
export class OrderCommerceComponent{
 private readonly cdr=inject(ChangeDetectorRef);
 @Input() order?:Order|null;@Input() inquiryToken='';readonly service=inject(CommerceService);private toast=inject(NotificationService);private readonly dataState=signal<any>(null);get data(){return this.dataState();}set data(v:any){this.dataState.set(v);}private readonly inquiryState=signal<any>(null);get inquiry(){return this.inquiryState();}set inquiry(v:any){this.inquiryState.set(v);}private readonly busyState=signal(false);get busy(){return this.busyState();}set busy(v:boolean){this.busyState.set(v);}
 ngOnChanges(){this.refresh();}
 refresh(){if(this.order?.publicTrackingToken)this.service.access(this.order.publicTrackingToken).pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:r=>this.data=r,error:()=>this.data=null});if(this.inquiryToken)this.service.inquiryStatus(this.inquiryToken).pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:r=>this.inquiry=r,error:()=>this.inquiry=null});}
 replace(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file||!this.order)return;this.busy=true;this.service.uploadPrescription(file,this.order.publicTrackingToken).pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:()=>{this.busy=false;this.refresh();this.toast.success('تم رفع نسخة جديدة للمراجعة');},error:e=>{this.busy=false;this.toast.error(e.error?.message||'تعذر الرفع');}});}
}
