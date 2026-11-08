import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
  actionText?: string;
  actionCallback?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  toasts = signal<ToastMessage[]>([]);

  show(
    text: any,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    durationMs = 4000,
    actionText?: string,
    actionCallback?: () => void
  ) {
    let cleanText = text;
    if (cleanText && typeof cleanText === 'object') {
      cleanText = cleanText.message || (Array.isArray(cleanText.errors) ? cleanText.errors.join(' - ') : '') || cleanText.title || '';
    }
    if (typeof cleanText === 'string' && cleanText.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(cleanText.trim());
        if (parsed.message) cleanText = parsed.message;
        else if (Array.isArray(parsed.errors) && parsed.errors.length) cleanText = parsed.errors.join(' - ');
        else if (parsed.title) cleanText = parsed.title;
      } catch {}
    }

    const id = 'toast_' + Math.random().toString(36).substring(2, 8);
    const msg: ToastMessage = { id, type, text: String(cleanText || ''), actionText, actionCallback };

    this.toasts.update(list => [...list, msg]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  success(text: string, actionText?: string, actionCallback?: () => void) {
    this.show(text, 'success', 4000, actionText, actionCallback);
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
