import { Injectable, inject, signal, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SettingsService } from './settings.service';
import { customerSessionKey } from './tenant-session';
import { isPlatformContext } from './store-context';
@Injectable({providedIn:'root'})
export class MarketingPixelsService {
 private readonly settings=inject(SettingsService);
 private readonly router=inject(Router);
 private route=signal('');
 consent=signal<'accepted'|'rejected'|null>(null);
 private initialized=new Set<string>();
 private lastPage='';
 constructor(){
  if(typeof window==='undefined')return;
  try{const c=localStorage.getItem(customerSessionKey('marketing_consent_v1'));if(c==='accepted'||c==='rejected')this.consent.set(c);}catch{}
  this.route.set(this.router.url);
  this.router.events.subscribe(e=>{if(e instanceof NavigationEnd)this.route.set(e.urlAfterRedirects);});
  effect(()=>{const config=this.settings.settings();const consent=this.consent();const route=this.route();
   if(consent!=='accepted'||!this.allowed()){this.lastPage='';return;}
   this.init(config);const key=[config.metaPixelId,config.tikTokPixelId,config.snapPixelId,route].join('|');
   if(key!==this.lastPage){this.lastPage=key;this.emit('PageView',{});}
  });
 }
 configured(){const s=this.settings.settings();return !!(s.metaPixelId||s.tikTokPixelId||s.snapPixelId)&&!isPlatformContext();}
 choose(value:'accepted'|'rejected'){this.consent.set(value);try{localStorage.setItem(customerSessionKey('marketing_consent_v1'),value);}catch{}}
 preferences(){this.consent.set(null);}
 private allowed(){return typeof window!=='undefined'&&!isPlatformContext()&&!/^\/(admin|account|track)(\/|$)/.test(location.pathname)&&!new URLSearchParams(location.search).has('showcase')&&window.top===window;}
 private script(id:string,src:string){if(document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.async=true;s.src=src;document.head.appendChild(s);}
 private init(config:any){
  const w=window as any;
  if(/^[0-9]{5,30}$/.test(config.metaPixelId||'')&&!this.initialized.has('meta:'+config.metaPixelId)){
   if(!w.fbq){const f:any=function(...args:any[]){f.callMethod?f.callMethod(...args):f.queue.push(args);};f.queue=[];f.loaded=true;f.version='2.0';f.push=f;w.fbq=f;w._fbq=f;}
   w.fbq('set','autoConfig',false,config.metaPixelId);w.fbq('init',config.metaPixelId);this.initialized.add('meta:'+config.metaPixelId);this.script('store-meta-pixel','https://connect.facebook.net/en_US/fbevents.js');
  }
  if(/^[a-zA-Z0-9]{10,40}$/.test(config.tikTokPixelId||'')&&!this.initialized.has('tiktok:'+config.tikTokPixelId)){
   w.TiktokAnalyticsObject='ttq';const q=w.ttq=w.ttq||[];for(const name of ['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'])if(!q[name])q[name]=(...args:any[])=>q.push([name,...args]);
   q._i=q._i||{};q._i[config.tikTokPixelId]=[];q._i[config.tikTokPixelId]._u='https://analytics.tiktok.com/i18n/pixel/events.js';q._t=q._t||{};q._t[config.tikTokPixelId]=Date.now();q._o=q._o||{};q._o[config.tikTokPixelId]={};this.initialized.add('tiktok:'+config.tikTokPixelId);this.script('store-tiktok-pixel','https://analytics.tiktok.com/i18n/pixel/events.js?sdkid='+encodeURIComponent(config.tikTokPixelId)+'&lib=ttq');
  }
  if(/^[a-f0-9-]{36}$/i.test(config.snapPixelId||'')&&!this.initialized.has('snap:'+config.snapPixelId)){
   if(!w.snaptr){const f:any=function(...args:any[]){f.handleRequest?f.handleRequest(...args):f.queue.push(args);};f.queue=[];w.snaptr=f;}w.snaptr('init',config.snapPixelId,{});this.initialized.add('snap:'+config.snapPixelId);this.script('store-snap-pixel','https://sc-static.net/scevent.min.js');
  }
 }
 track(event:'ViewContent'|'AddToCart'|'InitiateCheckout'|'Purchase',data:{ids?:string[];value?:number;quantity?:number;orderId?:string}={}){
  if(this.consent()!=='accepted'||!this.allowed())return;
  if(event==='Purchase'){
   if(!data.orderId)return;const key=customerSessionKey('pixel_purchase_'+data.orderId);try{if(localStorage.getItem(key))return;localStorage.setItem(key,'1');}catch{if(this.initialized.has(key))return;this.initialized.add(key);}
  }
  this.init(this.settings.settings());this.emit(event,data);
 }
 private emit(event:string,data:any){
  const s=this.settings.settings();const w=window as any;
  const safeUrl=location.origin+location.pathname; // no guest tracking tokens or customer query data
  const ids=data.ids||[];const payload={content_ids:ids,content_type:'product',value:Math.max(0,Number(data.value)||0),currency:s.currencyCode||'EGP',num_items:data.quantity||1};
  if(s.metaPixelId&&w.fbq)w.fbq('trackSingle',s.metaPixelId,event,payload,event==='Purchase'?{eventID:'order_'+data.orderId}:{});
  if(s.tikTokPixelId&&w.ttq){if(event==='PageView')w.ttq.page({url:safeUrl});else w.ttq.track(event==='InitiateCheckout'?'InitiateCheckout':event==='Purchase'?'CompletePayment':event,{content_ids:ids,contents:ids.map((id:string)=>({content_id:id,content_type:'product'})),value:payload.value,currency:payload.currency,quantity:payload.num_items});}
  if(s.snapPixelId&&w.snaptr)w.snaptr('track',({PageView:'PAGE_VIEW',ViewContent:'VIEW_CONTENT',AddToCart:'ADD_CART',InitiateCheckout:'START_CHECKOUT',Purchase:'PURCHASE'} as any)[event],{item_ids:ids,price:payload.value,currency:payload.currency,number_items:payload.num_items,...(event==='Purchase'?{transaction_id:data.orderId}:{})});
 }
}
