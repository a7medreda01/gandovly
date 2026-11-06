import { Injectable } from '@angular/core';
import { customerSessionKey } from './tenant-session';
@Injectable({providedIn:'root'})
export class GuestOrdersService {
 private memory:Record<string,{token:string;createdAt:number}[]>={};
 private key(){return customerSessionKey('guest_orders_v1');}
 list(){const key=this.key();try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return this.clean(rows);}catch{return this.memory[key]||[];}}
 private clean(rows:any):{token:string;createdAt:number}[]{return Array.isArray(rows)?rows.filter(r=>/^[a-f0-9]{32}$/i.test(r?.token)&&Number.isFinite(r.createdAt)&&r.createdAt>Date.now()-90*86400000).slice(0,50):[];}
 remember(token:string){if(!/^[a-f0-9]{32}$/i.test(token||''))return;const rows=[{token,createdAt:Date.now()},...this.list().filter(r=>r.token!==token)].slice(0,50);this.memory[this.key()]=rows;try{localStorage.setItem(this.key(),JSON.stringify(rows));}catch{}}
}
