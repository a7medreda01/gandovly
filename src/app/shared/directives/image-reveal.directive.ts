import { afterNextRender, Directive, ElementRef, inject, signal } from '@angular/core';

@Directive({
  selector: 'img[appImageReveal]',
  host: {
    '[class.image-pending]': '!ready()',
    '(load)': 'ready.set(true)',
    '(error)': 'ready.set(true)'
  }
})
export class ImageRevealDirective {
  readonly ready = signal(false);
  private readonly image = inject<ElementRef<HTMLImageElement>>(ElementRef);

  constructor() {
    afterNextRender(() => {
      if (this.image.nativeElement.complete) this.ready.set(true);
    });
  }
}
