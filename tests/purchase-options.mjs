import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), ts=require('../node_modules/typescript');
const decorators={Component:()=>c=>c,Input:()=>()=>{},Output:()=>()=>{},ViewChild:()=>()=>{},HostListener:()=>()=>{}};
function load(file){const module={exports:{}};const js=ts.transpileModule(fs.readFileSync('src/app/'+file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;vm.runInNewContext(js,{module,exports:module.exports,require:k=>k==='@angular/core'?decorators:new Proxy({},{get:()=>class{}}),setTimeout:()=>0,console});return module.exports;}
for(const [file,name,modal] of [['shared/components/product-detail-modal/product-detail-modal.component.ts','ProductDetailModalComponent',true],['features/storefront/product-page/product-page.component.ts','ProductPageComponent',false]]){
 const C=load(file)[name];
 const setup=()=>{const c=Object.create(C.prototype),calls=[],routes=[],settings={enableBuyNow:true};const product={id:4,nameAr:'منتج',isAvailable:true,pricingType:'PerPiece',variants:[],modifierGroups:[],preparationGroups:[]};
 Object.assign(c,{product:modal?product:()=>product,isAdding:false,isSuccess:modal?false:Object.assign(()=>false,{set(){}}),settingsService:{settings:()=>settings},cartService:{addItem:async(...a)=>{calls.push(a);return true}},router:{navigate:async(...a)=>routes.push(a)},toast:{error(){},info(){},success(){}},closeModal:{emit(){}},launchFlyingCartDot(){},piecesCount:2,orderMode:'pieces',specialInstructions:'ملاحظة',selectedPipeType:'none',multiSelectedModifiers:[],selectedModifiersByGroup:{},selectedPrepOption:null});return {c,calls,routes,settings,product};};
 const buy=c=>modal?c.onAddToCart(true):c.onAddToCart(undefined,true);
 let s=setup();await buy(s.c);assert.equal(s.calls.length,1);assert.equal(s.calls[0][1],2);assert.equal(s.calls[0][5],'ملاحظة');assert.equal(s.routes[0][0][0],'/checkout');
 s=setup();s.settings.enableBuyNow=false;await buy(s.c);assert.equal(s.calls.length,0);
 s=setup();s.product.isAvailable=false;await buy(s.c);assert.equal(s.routes.length,0);
 s=setup();s.product.variants=[{id:9}];await buy(s.c);assert.equal(s.calls.length,0);s.c.selectedVariant={id:9};await buy(s.c);assert.equal(s.calls[0][8].id,9);
 s=setup();s.c.cartService.addItem=async()=>false;await buy(s.c);assert.equal(s.routes.length,0);assert.equal(s.c.isAdding,false);
 s=setup();let resolve;s.c.cartService.addItem=()=>new Promise(r=>resolve=r);const first=buy(s.c);await buy(s.c);resolve(true);await first;assert.equal(s.routes.length,1);
 s=setup();s.settings.storeLayout={onlineOrdering:false};await buy(s.c);assert.equal(s.calls.length,0);
 console.log('PASS '+name+': selected options, disabled controls, stock rejection, duplicate clicks and checkout navigation');
}
const {WhatsAppFabComponent}=load('shared/components/whatsapp-fab/whatsapp-fab.component.ts');const fab=Object.create(WhatsAppFabComponent.prototype);let settings={phone:'01012345678',phoneCountryCode:'+20',whatsapp:'01112345678',showWhatsAppFab:true};fab.settings=()=>settings;assert.equal(fab.callPhone,'+201012345678');assert.equal(fab.targetPhone,'201112345678');settings.phone='+971 50 123 4567';assert.equal(fab.callPhone,'+971501234567');settings.showWhatsAppFab=false;assert.equal(fab.isVisible,false);assert.equal(fab.callPhone,'+971501234567');console.log('PASS independent call and WhatsApp numbers and visibility');

const {CheckoutComponent}=load('features/checkout/checkout.component.ts');
const checkout=Object.create(CheckoutComponent.prototype);let paymentSettings={};checkout.settingsService={settings:()=>paymentSettings};Object.defineProperty(checkout,'isDigitalOnly',{value:true});
for(const cod of [false,true])for(const transfer of [false,true])for(const account of ['', 'shop@instapay']){paymentSettings={paymentEnableCOD:cod,paymentEnableWalletTransfer:transfer,instaPayAccount:account};assert.equal(checkout.canPayByTransfer,transfer&&!!account);assert.equal(checkout.hasPaymentMethod,cod||(transfer&&!!account));}
console.log('PASS checkout: disabled COD stays disabled for digital carts, transfer requires an enabled account, no-method state');
