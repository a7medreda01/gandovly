import { AfterViewInit, Directive, ElementRef, EventEmitter, HostListener, OnDestroy, Output, inject } from '@angular/core';

// A single stack coordinates nested dialogs and restores page scrolling only after the last closes.
const openDialogs: HTMLElement[] = [];
let previousOverflow = '';
@Directive({ selector: '[appStoreDialog]', standalone: true, host: { role: 'dialog', 'aria-modal': 'true', tabindex: '-1' } })
export class StoreDialogDirective implements AfterViewInit, OnDestroy {
  private readonly element: HTMLElement = inject(ElementRef).nativeElement;
  private returnFocus: HTMLElement | null = null;
  private focusTimer?: ReturnType<typeof setTimeout>;
  @Output() dialogDismiss = new EventEmitter<void>();
  ngAfterViewInit() {
    if (typeof document === 'undefined') return;
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!openDialogs.length) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    openDialogs.push(this.element);
    this.focusTimer = setTimeout(() => { if (this.element.isConnected) (this.controls()[0] || this.element).focus({ preventScroll: true }); });
  }
  private controls() {
    return Array.from(this.element.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el => el.getClientRects().length && el.getAttribute('aria-hidden') !== 'true');
  }
  @HostListener('document:keydown', ['$event']) onKey(event: KeyboardEvent) {
    if (openDialogs.at(-1) !== this.element) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.dialogDismiss.emit(); }
    if (event.key !== 'Tab') return;
    const controls = this.controls(), first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); this.element.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !this.element.contains(document.activeElement))) { event.preventDefault(); last!.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !this.element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  }
  ngOnDestroy() {
    if (typeof document === 'undefined') return;
    clearTimeout(this.focusTimer);
    const index = openDialogs.indexOf(this.element); if (index >= 0) openDialogs.splice(index, 1);
    if (!openDialogs.length) document.body.style.overflow = previousOverflow;
    if (this.returnFocus?.isConnected) this.returnFocus.focus({ preventScroll: true });
  }
}
