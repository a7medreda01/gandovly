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
  @Input('appScrollAnimate') threshold: number | string = 0;

  readonly inView = signal(false);
  private readonly el = inject(ElementRef);
  private observer?: IntersectionObserver;
  private resizeTimer?: any;

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        this.inView.set(true);
        return;
      }

      const checkCurrentVisibility = (): boolean => {
        const native = this.el.nativeElement as HTMLElement;
        if (!native) return false;
        const rect = native.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight || 800;
        // If element is already in view or immediately below the fold (within 1.25 screens)
        if (rect.top <= vh * 1.25 && rect.bottom >= -60) {
          this.inView.set(true);
          return true;
        }
        return false;
      };

      // Check immediately on render
      if (checkCurrentVisibility()) {
        return;
      }

      const numThreshold = (typeof this.threshold === 'number' ? this.threshold : parseFloat(this.threshold as string)) || 0;

      this.observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.inView.set(true);
            this.observer?.unobserve(entry.target);
            break;
          }
        }
      }, {
        threshold: numThreshold,
        rootMargin: '140px 0px 100px 0px'
      });

      this.observer.observe(this.el.nativeElement);

      // Re-verify after content / images load and expand the DOM
      this.resizeTimer = setTimeout(() => {
        if (!this.inView()) {
          if (checkCurrentVisibility()) {
            this.observer?.disconnect();
          }
        }
      }, 180);
    });
  }

  ngOnDestroy(): void {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.observer?.disconnect();
  }
}


