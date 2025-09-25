import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Toast-Service für benutzerfreundliche Benachrichtigungen
 * Unterstützt verschiedene Toast-Typen und automatisches Ausblenden
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = signal<ToastMessage[]>([]);
  
  /**
   * Alle aktiven Toast-Nachrichten
   */
  readonly toasts$ = this.toasts.asReadonly();

  /**
   * Zeigt eine Erfolgs-Toast an
   */
  success(message: string, duration: number = 3000): void {
    this.showToast({
      type: 'success',
      message,
      duration
    });
  }

  /**
   * Zeigt eine Fehler-Toast an
   */
  error(message: string, duration: number = 5000): void {
    this.showToast({
      type: 'error',
      message,
      duration
    });
  }

  /**
   * Zeigt eine Warn-Toast an
   */
  warning(message: string, duration: number = 4000): void {
    this.showToast({
      type: 'warning',
      message,
      duration
    });
  }

  /**
   * Zeigt eine Info-Toast an
   */
  info(message: string, duration: number = 3000): void {
    this.showToast({
      type: 'info',
      message,
      duration
    });
  }

  /**
   * Zeigt eine Toast mit Action-Button an
   */
  showWithAction(
    type: ToastMessage['type'], 
    message: string, 
    actionLabel: string, 
    actionHandler: () => void,
    duration: number = 6000
  ): void {
    this.showToast({
      type,
      message,
      duration,
      action: {
        label: actionLabel,
        handler: actionHandler
      }
    });
  }

  /**
   * Entfernt eine Toast-Nachricht
   */
  removeToast(id: string): void {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Entfernt alle Toast-Nachrichten
   */
  clearAll(): void {
    this.toasts.set([]);
  }

  /**
   * Private Methode zum Anzeigen einer Toast
   */
  private showToast(toast: Omit<ToastMessage, 'id'>): void {
    const id = this.generateId();
    const newToast: ToastMessage = { ...toast, id };
    
    this.toasts.update(toasts => [...toasts, newToast]);

    // Auto-remove nach Duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, toast.duration);
    }
  }

  /**
   * Generiert eine eindeutige ID
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}