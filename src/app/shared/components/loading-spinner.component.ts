import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Loading Spinner Komponente
 * Zeigt verschiedene Loading-Zustände an
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-spinner" [class]="'loading-spinner--' + size">
      @if (overlay) {
        <div class="loading-overlay">
          <div class="spinner-container">
            <div class="spinner"></div>
            @if (text) {
              <p class="loading-text">{{ text }}</p>
            }
          </div>
        </div>
      } @else {
        <div class="spinner-container">
          <div class="spinner"></div>
          @if (text) {
            <p class="loading-text">{{ text }}</p>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './loading-spinner.component.scss'
})
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() text?: string;
  @Input() overlay: boolean = false;
}