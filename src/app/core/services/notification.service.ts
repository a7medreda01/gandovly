import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  toasts = signal<ToastMessage[]>([]);

  show(text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', durationMs = 4000) {
    const id = 'toast_' + Math.random().toString(36).substring(2, 8);
    const msg: ToastMessage = { id, type, text };

    this.toasts.update(list => [...list, msg]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  success(text: string) {
    this.show(text, 'success');
  }

  error(text: string) {
    this.show(text, 'error');
  }

  info(text: string) {
    this.show(text, 'info');
  }

  warning(text: string) {
    this.show(text, 'warning');
  }

  remove(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
