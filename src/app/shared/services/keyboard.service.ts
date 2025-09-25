import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface KeyboardEvent {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  target: EventTarget | null;
}

/**
 * Keyboard Navigation Service
 * Zentrale Verwaltung für Keyboard-Shortcuts und Navigation
 */
@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  private keyboardEvents$ = new Subject<KeyboardEvent>();

  /**
   * Observable für Keyboard-Events
   */
  readonly keyboardEvents = this.keyboardEvents$.asObservable();

  constructor() {
    this.initializeGlobalKeyboardHandler();
  }

  /**
   * Registriert globale Keyboard-Handler
   */
  private initializeGlobalKeyboardHandler(): void {
    document.addEventListener('keydown', (event: globalThis.KeyboardEvent) => {
      this.keyboardEvents$.next({
        key: event.key,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        target: event.target
      });
    });
  }

  /**
   * Prüft ob ein Keyboard-Event einem Shortcut entspricht
   */
  isShortcut(event: KeyboardEvent, key: string, modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  }): boolean {
    const { ctrl = false, shift = false, alt = false } = modifiers || {};
    
    return event.key === key &&
           event.ctrlKey === ctrl &&
           event.shiftKey === shift &&
           event.altKey === alt;
  }

  /**
   * Fokussiert das nächste/vorherige Element in der Tab-Reihenfolge
   */
  focusNextElement(direction: 'next' | 'previous' = 'next'): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = currentIndex + 1 >= focusableElements.length ? 0 : currentIndex + 1;
    } else {
      nextIndex = currentIndex - 1 < 0 ? focusableElements.length - 1 : currentIndex - 1;
    }
    
    focusableElements[nextIndex]?.focus();
  }

  /**
   * Findet alle fokussierbaren Elemente auf der Seite
   */
  private getFocusableElements(): HTMLElement[] {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    return Array.from(document.querySelectorAll(selectors)) as HTMLElement[];
  }

  /**
   * Fokussiert ein Element basierend auf einem Selektor
   */
  focusElement(selector: string): boolean {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }

  /**
   * Erstellt einen visuellen Fokus-Ring für bessere Accessibility
   */
  createFocusRing(element: HTMLElement): void {
    element.style.outline = '2px solid #00bb95';
    element.style.outlineOffset = '2px';
    element.style.borderRadius = '4px';
  }

  /**
   * Entfernt den visuellen Fokus-Ring
   */
  removeFocusRing(element: HTMLElement): void {
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.borderRadius = '';
  }

  /**
   * Verhindert Standard-Verhalten bei bestimmten Tastenkombinationen
   */
  preventDefault(event: globalThis.KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
}