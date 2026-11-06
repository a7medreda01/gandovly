import { signal } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';import { finalize } from 'rxjs';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';import { FormsModule } from '@angular/forms';
import { Product } from '../../../core/models/models';import { CommerceService } from '../../../core/services/commerce.service';import { NotificationService } from '../../../core/services/notification.service';
@Component({selector:'app-product-commerce',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./product-commerce.component.html',styleUrl:'./product-commerce.component.scss'})
export class ProductCommerceComponent {
 private readonly cdr=inject(ChangeDetectorRef);
 @Input({required:true}) product!:Product;@Input() quantity=1;@Output() booking=new EventEmitter<any>();
 private commerce=inject(CommerceService);private toast=inject(NotificationService);
 private requestId=0;start='';end='';private readonly busyState=signal(false);get busy(){return this.busyState();}set busy(v:boolean){this.busyState.set(v);}private readonly availabilityState=signal<any>(null);get availability(){return this.availabilityState();}set availability(v:any){this.availabilityState.set(v);}name='';phone='';message='';action='quote';private readonly resultState=signal<any>(null);get result(){return this.resultState();}set result(v:any){this.resultState.set(v);}
 get config(){return this.product.commerce||{mode:'Physical'};}
 ngOnChanges(){this.reset();}
 reset(){this.requestId++;this.busy=false;this.availability=null;this.booking.emit(null);}
 check(){if(!this.start)return;const request=++this.requestId;this.busy=true;const start=new Date(this.start).toISOString();const end=this.end?new Date(this.end).toISOString():undefined;this.commerce.availability(this.product.id,start,end,this.quantity).pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:r=>{if(request!==this.requestId)return;this.busy=false;this.availability=r;if(r.available)this.booking.emit({start:r.start,end:r.end,blocks:r.blocks});},error:e=>{if(request!==this.requestId)return;this.busy=false;this.toast.error(e.error?.message||'تعذر فحص الموعد');}});}
 submit(){if(this.busy||!this.name.trim()||!this.phone.trim())return;this.busy=true;this.commerce.inquiry({productId:this.product.id,customerName:this.name,phone:this.phone,message:this.message,action:this.action,preferredAt:this.action==='visit'&&this.start?new Date(this.start).toISOString():null}).pipe(finalize(()=>this.cdr.markForCheck())).subscribe({next:r=>{this.busy=false;this.result=r;this.commerce.rememberInquiry(r.trackingToken);},error:e=>{this.busy=false;this.toast.error(e.error?.message||'تعذر إرسال الطلب');}});}
 get resultLink(){const url=new URL('/account',location.origin);const tenant=new URLSearchParams(location.search).get('tenant');if(tenant)url.searchParams.set('tenant',tenant);url.searchParams.set('inquiry',this.result?.trackingToken||'');return url.href;}
}
