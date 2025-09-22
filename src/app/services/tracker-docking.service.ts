import { Injectable, signal, computed } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface DockingState {
  isDocked: boolean;
  isVisible: boolean;
  isMobile: boolean;
  isFullscreen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TrackerDockingService {
  private readonly STORAGE_KEY = 'workday-tracker-docking-state';
  private readonly MOBILE_BREAKPOINT = 768;

  // Signal für Docking State
  private dockingState = signal<DockingState>({
    isDocked: false,
    isVisible: true,
    isMobile: this.checkIsMobile(),
    isFullscreen: false
  });

  // Public read-only access
  public readonly state = this.dockingState.asReadonly();

  // Computed properties für einfachen Zugriff
  public readonly isDocked = computed(() => this.state().isDocked);
  public readonly isVisible = computed(() => this.state().isVisible);
  public readonly isMobile = computed(() => this.state().isMobile);
  public readonly isFullscreen = computed(() => this.state().isFullscreen);

  constructor() {
    this.loadStateFromStorage();
    this.setupResponsiveListener();
  }

  /**
   * Tracker andocken/parken
   */
  dockTracker(): void {
    this.updateState({
      isDocked: true,
      isVisible: false, // Tracker verschwindet, nur Zeit in Navbar
      isFullscreen: false
    });
    this.saveStateToStorage();
  }

  /**
   * Tracker maximieren/entdocken
   */
  undockTracker(): void {
    const isMobile = this.checkIsMobile();
    this.updateState({
      isDocked: false,
      isVisible: true,
      isFullscreen: isMobile // Auf Mobile gleich Fullscreen
    });
    this.saveStateToStorage();
  }

  /**
   * Toggle zwischen gedockt und entdockt
   */
  toggleDocking(): void {
    if (this.isDocked()) {
      this.undockTracker();
    } else {
      this.dockTracker();
    }
  }

  /**
   * Fullscreen für Mobile
   */
  openFullscreen(): void {
    if (this.isMobile()) {
      this.updateState({
        isDocked: false,
        isVisible: true,
        isFullscreen: true
      });
    }
  }

  /**
   * Fullscreen schließen (Mobile)
   */
  closeFullscreen(): void {
    if (this.isMobile()) {
      this.updateState({
        isDocked: true,
        isVisible: false,
        isFullscreen: false
      });
    }
  }

  /**
   * Reset zu Standard-Zustand basierend auf Device
   */
  resetToDefault(): void {
    const isMobile = this.checkIsMobile();
    this.updateState({
      isDocked: isMobile, // Mobile standardmäßig gedockt
      isVisible: !isMobile, // Desktop standardmäßig sichtbar
      isMobile: isMobile,
      isFullscreen: false
    });
    this.saveStateToStorage();
  }

  /**
   * Prüft ob aktuell Mobile Device
   */
  private checkIsMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < this.MOBILE_BREAKPOINT;
  }

  /**
   * State aktualisieren
   */
  private updateState(partial: Partial<DockingState>): void {
    this.dockingState.update(current => ({
      ...current,
      ...partial,
      isMobile: this.checkIsMobile()
    }));
  }

  /**
   * Responsive Listener für Breakpoint Changes
   */
  private setupResponsiveListener(): void {
    if (typeof window === 'undefined') return;

    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const wasMobile = this.isMobile();
        const isMobile = this.checkIsMobile();
        
        if (wasMobile !== isMobile) {
          // Device-Typ hat sich geändert - State anpassen
          if (isMobile) {
            // Zu Mobile gewechselt - standardmäßig docken
            this.updateState({
              isDocked: true,
              isVisible: false,
              isFullscreen: false
            });
          } else {
            // Zu Desktop gewechselt - entdocken falls gewünscht
            this.updateState({
              isDocked: this.isDocked(), // Behalte aktuellen Zustand
              isVisible: !this.isDocked(),
              isFullscreen: false
            });
          }
          this.saveStateToStorage();
        }
      });
  }

  /**
   * State aus localStorage laden
   */
  private loadStateFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedState = JSON.parse(stored) as Partial<DockingState>;
        const isMobile = this.checkIsMobile();
        
        // State mit aktueller Mobile-Detection kombinieren
        this.updateState({
          ...parsedState,
          isMobile,
          // Auf Mobile: immer gedockt starten, außer explizit anders gesetzt
          isDocked: isMobile ? (parsedState.isDocked ?? true) : (parsedState.isDocked ?? false),
          isVisible: isMobile ? false : !parsedState.isDocked,
          isFullscreen: false // Fullscreen nie persisitieren
        });
      } else {
        // Kein gespeicherter State - Standard setzen
        this.resetToDefault();
      }
    } catch (error) {
      // Could not load tracker docking state from localStorage
      this.resetToDefault();
    }
  }

  /**
   * State in localStorage speichern
   */
  private saveStateToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stateToSave = {
        isDocked: this.isDocked(),
        isVisible: this.isVisible(),
        // isFullscreen nicht speichern - immer false beim Laden
        // isMobile nicht speichern - wird dynamisch ermittelt
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      // Could not save tracker docking state to localStorage
    }
  }
}