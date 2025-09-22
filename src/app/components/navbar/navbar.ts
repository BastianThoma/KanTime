import { Component, inject, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { TrackerDockingService } from '../../services/tracker-docking.service';
import { selectTimeState } from '../../state/time/time.selectors';
import { Subscription } from 'rxjs';

/**
 * Navbar Komponente für die Hauptnavigation
 * Modernes, responsives Design mit glasmorphism Effekt
 * Inkludiert Docking-Funktionalität für Workday-Tracker
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnDestroy {
  private router = inject(Router);
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  /** Docking Service für Tracker */
  dockingService = inject(TrackerDockingService);
  
  /** Mobile Menu Toggle State */
  isMobileMenuOpen = false;

  /** Timer-bezogene Properties */
  private timeSubscription?: Subscription;
  private currentSessionTime = 0;
  private sessionStartTime?: number;
  private timerInterval?: number;
  private currentTaskTitle = '';
  private trackerStatus: 'idle' | 'running' | 'paused' | 'stopped' = 'idle';

  constructor() {
    this.subscribeToTimeState();
  }

  ngOnDestroy(): void {
    this.timeSubscription?.unsubscribe();
    this.stopNavbarTimer();
  }

  /**
   * Navigation Items mit Icons und Routen
   */
  navItems = [
    {
      label: 'Dashboard',
      route: '/',
      icon: '📊',
      description: 'Übersicht und Statistiken'
    },
    {
      label: 'Tasks',
      route: '/tasks',
      icon: '✅',
      description: 'Aufgaben verwalten'
    },
    {
      label: 'Kalender',
      route: '/workday-calendar',
      icon: '📅',
      description: 'Arbeitszeiten eintragen'
    }
  ];

  /**
   * Prüft ob die aktuelle Route aktiv ist
   * @param route - Die zu prüfende Route
   * @returns true wenn die Route aktiv ist
   */
  isActiveRoute(route: string): boolean {
    if (route === '/') {
      return this.router.url === '/';
    }
    return this.router.url.startsWith(route);
  }

  /**
   * Togglet das mobile Menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Schließt das mobile Menu beim Navigation
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  /**
   * Navigiert zu einer Route und schließt mobile Menu
   * @param route - Ziel-Route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeMobileMenu();
  }

  // ==========================================
  // Docking-bezogene Methoden
  // ==========================================

  /**
   * Prüft ob der Tracker aktive Zeit hat
   */
  trackerHasActiveTime(): boolean {
    return this.trackerStatus === 'running' || this.trackerStatus === 'paused';
  }

  /**
   * Gibt den aktuellen Timer-Display zurück
   */
  getCurrentTimerDisplay(): string {
    // Timer läuft automatisch, einfach formatieren
    return this.formatSessionTime();
  }

  /**
   * Gibt den aktuellen Task-Titel zurück
   */
  getCurrentTaskTitle(): string {
    return this.currentTaskTitle || 'Kein Task ausgewählt';
  }

  /**
   * Handler für Klick auf gedockten Timer
   */
  onDockedTimerClick(): void {
    this.dockingService.undockTracker();
  }

  /**
   * Handler für Mobile Timer Button
   */
  onMobileTimerClick(): void {
    if (this.dockingService.isDocked()) {
      this.dockingService.openFullscreen();
    } else {
      this.dockingService.closeFullscreen();
    }
  }

  /**
   * Handler für Tracker Drop in Docking Zone
   */
  onTrackerDrop(event: CdkDragDrop<any>): void {
    // Prüfen ob es sich um den Workday-Tracker handelt
    if (event.item.data?.type === 'workday-tracker') {
      // Tracker wurde in die Docking-Zone gezogen - parken
      this.dockingService.dockTracker();
    }
    // Reset drag-over state
    this.onDragExitZone();
  }

  /**
   * Handler für Drag Enter in Docking Zone
   */
  onDragEnterZone(event?: DragEvent): void {
    if (event) {
      event.preventDefault();
    }
    const zone = document.querySelector('.docking-zone');
    const tracker = document.querySelector('.workday-tracker-floating');
    
    if (zone) {
      zone.classList.add('drag-over');
    }
    if (tracker) {
      tracker.classList.add('drag-over-dock');
    }
  }

  /**
   * Handler für Drag Leave von Docking Zone
   */
  onDragLeaveZone(event: DragEvent): void {
    event.preventDefault();
    const zone = document.querySelector('.docking-zone');
    const tracker = document.querySelector('.workday-tracker-floating');
    
    if (zone) {
      zone.classList.remove('drag-over');
    }
    if (tracker) {
      tracker.classList.remove('drag-over-dock');
    }
  }

  /**
   * Handler für Drag Over in Docking Zone
   */
  onDragOverZone(event: DragEvent): void {
    event.preventDefault(); // Wichtig für Drop-Funktionalität
    const zone = document.querySelector('.docking-zone');
    const tracker = document.querySelector('.workday-tracker-floating');
    
    if (zone && !zone.classList.contains('drag-over')) {
      zone.classList.add('drag-over');
    }
    if (tracker && !tracker.classList.contains('drag-over-dock')) {
      tracker.classList.add('drag-over-dock');
    }
  }

  /**
   * Handler für Drop in Docking Zone (nativer Drop)
   */
  onDropZone(event: DragEvent): void {
    event.preventDefault();
    this.onDragExitZone();
    // Tracker parken (funktioniert mit nativem Drag & Drop)
    this.dockingService.dockTracker();
  }

  /**
   * Handler für Drag Exit von Docking Zone
   */
  onDragExitZone(): void {
    const zone = document.querySelector('.docking-zone');
    const tracker = document.querySelector('.workday-tracker-floating');
    
    if (zone) {
      zone.classList.remove('drag-over');
    }
    if (tracker) {
      tracker.classList.remove('drag-over-dock');
    }
  }

  /**
   * Formatiert die Session-Zeit
   */
  private formatSessionTime(): string {
    const hours = Math.floor(this.currentSessionTime / 3600);
    const minutes = Math.floor((this.currentSessionTime % 3600) / 60);
    const seconds = this.currentSessionTime % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Abonniert den Time State für Timer-Updates
   */
  private subscribeToTimeState(): void {
    this.timeSubscription = this.store.select(selectTimeState).subscribe(state => {
      const hasActiveSections = state.sections.length > 0;
      const lastSection = hasActiveSections ? state.sections[state.sections.length - 1] : null;
      
      if (lastSection && !lastSection.end) {
        // Aktive Session läuft - Timer für gedockten Zustand starten
        this.trackerStatus = lastSection.type === 'work' ? 'running' : 'paused';
        this.sessionStartTime = lastSection.start;
        this.startNavbarTimer(); // Timer für Live-Updates starten
        
        // Task-Titel ermitteln
        this.currentTaskTitle = lastSection.taskId || 'Unbekannte Aufgabe';
      } else {
        // Keine aktive Session
        this.trackerStatus = hasActiveSections ? 'stopped' : 'idle';
        this.stopNavbarTimer(); // Timer stoppen
        this.currentSessionTime = 0;
        this.sessionStartTime = undefined;
        this.currentTaskTitle = '';
      }
    });
  }

  /**
   * Startet den Navbar-Timer für Live-Updates
   */
  private startNavbarTimer(): void {
    // Stoppe vorherigen Timer
    this.stopNavbarTimer();
    
    // Initiale Zeit berechnen
    this.updateCurrentSessionTime();
    
    // Timer außerhalb der Angular Zone starten
    this.ngZone.runOutsideAngular(() => {
      this.timerInterval = window.setInterval(() => {
        // Update innerhalb der Angular Zone ausführen
        this.ngZone.run(() => {
          this.updateCurrentSessionTime();
          this.cdr.detectChanges(); // UI aktualisieren
        });
      }, 1000);
    });
  }

  /**
   * Stoppt den Navbar-Timer
   */
  private stopNavbarTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  /**
   * Berechnet aktuelle Session-Zeit basierend auf sessionStartTime
   */
  private updateCurrentSessionTime(): void {
    if (this.sessionStartTime) {
      this.currentSessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    }
  }
}