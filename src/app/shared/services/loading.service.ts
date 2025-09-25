import { Injectable, signal } from '@angular/core';

export interface LoadingState {
  [key: string]: boolean;
}

/**
 * Loading Service für zentrale Verwaltung von Loading-States
 * Ermöglicht granulare Loading-Anzeigen für verschiedene Operationen
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingStates = signal<LoadingState>({});

  /**
   * Alle Loading-States als readonly Signal
   */
  readonly loadingStates$ = this.loadingStates.asReadonly();

  /**
   * Setzt Loading-State für einen bestimmten Key
   */
  setLoading(key: string, loading: boolean): void {
    this.loadingStates.update(states => ({
      ...states,
      [key]: loading
    }));
  }

  /**
   * Prüft ob ein bestimmter Key gerade lädt
   */
  isLoading(key: string): boolean {
    return this.loadingStates()[key] || false;
  }

  /**
   * Prüft ob irgendwas gerade lädt
   */
  isAnyLoading(): boolean {
    const states = this.loadingStates();
    return Object.values(states).some(loading => loading);
  }

  /**
   * Führt eine Async-Operation mit automatischem Loading-State aus
   */
  async withLoading<T>(key: string, operation: () => Promise<T>): Promise<T> {
    this.setLoading(key, true);
    try {
      const result = await operation();
      return result;
    } finally {
      this.setLoading(key, false);
    }
  }

  /**
   * Entfernt einen Loading-State komplett
   */
  clearLoading(key: string): void {
    this.loadingStates.update(states => {
      const newStates = { ...states };
      delete newStates[key];
      return newStates;
    });
  }

  /**
   * Entfernt alle Loading-States
   */
  clearAllLoading(): void {
    this.loadingStates.set({});
  }

  /**
   * Gibt alle aktiven Loading-Keys zurück
   */
  getActiveLoadingKeys(): string[] {
    const states = this.loadingStates();
    return Object.keys(states).filter(key => states[key]);
  }
}