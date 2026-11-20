import { afterNextRender, Directive, ElementRef, inject, Input, OnDestroy, signal } from '@angular/core';

@Directive({
  selector: '[appScrollAnimate]',
  standalone: true,
  host: {
    '[class.scroll-animated]': 'true',
    '[class.in-view]': 'inView()'
  }
})
export class ScrollAnimateDirective implements OnDestroy {
  @Input('appScrollAnimate') threshold: number | string = 0.01;

  readonly inView = signal(false);
  private readonly el = inject(ElementRef);
  private observer?: IntersectionObserver;
  private fallbackTimeout?: any;

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined') {
        this.inView.set(true);
        return;
      }

      const nativeEl = this.el?.nativeElement as HTMLElement;
      if (!nativeEl) {
        this.inView.set(true);
        return;
      }

      // 1. Immediate Visibility Check: If element is in viewport or close to it, reveal immediately!
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      const rect = nativeEl.getBoundingClientRect();
      if (rect.top <= vh + 120) {
        this.inView.set(true);
        return;
      }

      // 2. Safety Fallback: Never keep a section invisible forever
      this.fallbackTimeout = setTimeout(() => {
        if (!this.inView()) {
          this.inView.set(true);
        }
      }, 1800);

      if (!('IntersectionObserver' in window)) {
        this.inView.set(true);
        return;
      }

      const numThreshold = (typeof this.threshold === 'number' ? this.threshold : parseFloat(this.threshold as string)) || 0.01;

      // Positive rootMargin so animation begins 120px BEFORE entering screen
      this.observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.inView.set(true);
            this.cleanup();
            break;
          }
        }
      }, {
        threshold: numThreshold,
        rootMargin: '120px 0px 80px 0px'
      });

      this.observer.observe(nativeEl);
    });
  }

  private cleanup() {
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
