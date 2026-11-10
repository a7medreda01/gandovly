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
  @Input('appScrollAnimate') threshold: number | string = 0.08;

  readonly inView = signal(false);
  private readonly el = inject(ElementRef);
  private observer?: IntersectionObserver;

  constructor() {
    afterNextRender(() => {
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        this.inView.set(true);
        return;
      }

      const numThreshold = (typeof this.threshold === 'number' ? this.threshold : parseFloat(this.threshold as string)) || 0.08;

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
        rootMargin: '0px 0px -35px 0px'
      });

      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}


