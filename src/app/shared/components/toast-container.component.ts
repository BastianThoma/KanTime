import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../services/toast.service';

/**
 * Toast-Container Komponente
 * Zeigt Toast-Nachrichten in der oberen rechten Ecke an
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" [attr.aria-live]="'polite'" [attr.aria-atomic]="'true'">
      @for (toast of toastService.toasts$(); track toast.id) {
        <div 
          class="toast"
          [class]="'toast--' + toast.type"
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
          [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'">
          
          <div class="toast__content">
            <div class="toast__icon">
              @switch (toast.type) {
                @case ('success') { ✅ }
                @case ('error') { ❌ }
                @case ('warning') { ⚠️ }
                @case ('info') { ℹ️ }
              }
            </div>
            
            <div class="toast__message">{{ toast.message }}</div>
            
            @if (toast.action) {
              <button 
                class="toast__action"
                (click)="handleAction(toast)"
                [attr.aria-label]="toast.action.label">
                {{ toast.action.label }}
              </button>
            }
            
            <button 
              class="toast__close"
              (click)="closeToast(toast.id)"
              aria-label="Toast schließen"
              title="Schließen">
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './toast-container.component.scss'
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  protected toastService = inject(ToastService);

  ngOnInit(): void {
    // Keyboard Event Listener für ESC-Key
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Schließt eine Toast-Nachricht
   */
  closeToast(id: string): void {
    this.toastService.removeToast(id);
  }

  /**
   * Führt Toast-Action aus
   */
  handleAction(toast: ToastMessage): void {
    if (toast.action) {
      toast.action.handler();
      this.closeToast(toast.id);
    }
  }

  /**
   * Keyboard Event Handler
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      const toasts = this.toastService.toasts$();
      if (toasts.length > 0) {
        // Schließe die neueste Toast bei ESC
        this.closeToast(toasts[toasts.length - 1].id);
      }
    }
  };
}