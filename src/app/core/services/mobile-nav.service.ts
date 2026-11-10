import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MobileNavService {
  private readonly router = inject(Router);
  readonly isOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.close();
      });
  }

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  toggle() {
    this.isOpen.update(v => !v);
  }
}

