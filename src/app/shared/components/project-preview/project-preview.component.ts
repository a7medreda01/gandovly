import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-project-preview', standalone: true,
  template: `<div class="preview-shell"><div class="preview-bar" aria-hidden="true"><b></b><b></b><b></b></div><div class="preview-viewport">@if (visible() && previewUrl()) {<iframe [src]="previewUrl()" [title]="'معاينة ' + name()" tabindex="-1" aria-hidden="true" loading="lazy" referrerpolicy="no-referrer"></iframe>} @else {<span class="preview-placeholder" aria-hidden="true"><i class="bi bi-shop"></i></span>}</div></div>`,
  styles: [`:host{display:block;width:100%;min-width:0}.preview-shell{position:relative;aspect-ratio:16/10;overflow:hidden;border:1px solid #e2e8f0;border-radius:14px;background:#f7f9fc}.preview-bar{height:24px;display:flex;gap:5px;align-items:center;padding-inline:10px;background:#fff;border-bottom:1px solid #edf1f5;direction:ltr}.preview-bar b{width:5px;height:5px;border-radius:50%;background:#cad3dd}.preview-viewport{position:absolute;inset:24px 0 0;overflow:hidden;pointer-events:none}.preview-viewport iframe{position:absolute;top:0;left:0;width:400%;height:400%;border:0;transform:scale(.25);transform-origin:top left;pointer-events:none;background:#fff}.preview-placeholder{display:grid;place-items:center;height:100%;color:#94a3b8;font-size:44px}`]
})
export class ProjectPreviewComponent implements AfterViewInit, OnDestroy {
  slug = input.required<string>();
  name = input('المتجر');
  visible = signal(false);
  private host = inject(ElementRef<HTMLElement>);
  private sanitizer = inject(DomSanitizer);
  private observer?: IntersectionObserver;
  // Only the existing same-origin public storefront route may be embedded.
  previewUrl = computed(() => /^[a-z0-9-]+$/.test(this.slug()) ? this.sanitizer.bypassSecurityTrustResourceUrl('/?tenant=' + encodeURIComponent(this.slug()) + '&showcase=1') : null);
  ngAfterViewInit() {
    if (typeof IntersectionObserver === 'undefined') { this.visible.set(true); return; }
    this.observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) {this.visible.set(true);this.observer?.disconnect();} }, {rootMargin:'100px'});
    this.observer.observe(this.host.nativeElement);
  }
  ngOnDestroy() { this.observer?.disconnect(); }
}
