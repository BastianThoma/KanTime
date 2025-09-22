import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { TimeSection } from '../../state/time/time.model';
import { selectTimeState } from '../../state/time/time.selectors';
import { startSection, endSection, stopWorkDay } from '../../state/time/time.actions';
import { combineLatest, firstValueFrom, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { WorkdayService } from '../../state/workday/workday.service';
import { loadTasks } from '../../state/task/task.actions';
import { saveWorkday, loadWorkdays } from '../../state/workday/workday.actions';
import { TrackerDockingService } from '../../services/tracker-docking.service';
@Component({
  selector: 'app-workday-tracker',
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './workday-tracker.html',
  styleUrl: './workday-tracker.scss',
})
export class WorkdayTracker implements OnInit, OnDestroy {
  private workdayService = inject(WorkdayService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  
  /** Docking Service für Tracker-Management */
  dockingService = inject(TrackerDockingService);

  ngOnInit() {
    this.store.dispatch(loadTasks());
    
    // Time State abonnieren für Timer-Updates UND Section Widths
    this.timeState$.subscribe((state) => {
      this.updateSectionWidths(state.sections);
      this.updateTimerFromState(state);
    });

    // Auf Mobile standardmäßig docken
    if (this.dockingService.isMobile() && !this.dockingService.isDocked()) {
      this.dockingService.dockTracker();
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  /**
   * Timer basierend auf NgRx State updaten
   */
  private updateTimerFromState(state: any): void {
    const hasActiveSections = state.sections.length > 0;
    const lastSection = hasActiveSections ? state.sections[state.sections.length - 1] : null;
    
    if (lastSection && !lastSection.end) {
      // Aktive Session läuft
      this.trackerStatus = lastSection.type === 'work' ? 'running' : 'paused';
      this.sessionStartTime = lastSection.start;
      this.startTimer();
    } else {
      // Keine aktive Session
      this.trackerStatus = hasActiveSections ? 'stopped' : 'idle';
      this.stopTimer();
      this.currentSessionTime = 0;
      this.sessionStartTime = undefined; // Nur hier zurücksetzen
    }
    
    // Change Detection manuell triggern
    this.cdr.detectChanges();
  }

  // Live Timer Methods
  private startTimer(): void {
    // Vorherigen Timer stoppen falls vorhanden
    this.stopTimer();
    
    // sessionStartTime wird von NgRx State gesetzt, nicht hier überschreiben
    if (this.sessionStartTime) {
      // Initiale Zeit berechnen
      this.currentSessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    }
    
    // Timer außerhalb der Angular Zone starten
    this.ngZone.runOutsideAngular(() => {
      this.timerInterval = window.setInterval(() => {
        if (this.sessionStartTime) {
          // Update innerhalb der Angular Zone ausführen
          this.ngZone.run(() => {
            if (this.sessionStartTime) { // Zusätzliche Prüfung für TypeScript
              this.currentSessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
              // Change Detection manuell triggern
              this.cdr.detectChanges();
            }
          });
        }
      }, 1000);
    });
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    // sessionStartTime NICHT hier zurücksetzen, da es vom NgRx State kommt
    this.currentSessionTime = 0;
  }

  formatSessionTime(): string {
    const hours = Math.floor(this.currentSessionTime / 3600);
    const minutes = Math.floor((this.currentSessionTime % 3600) / 60);
    const seconds = this.currentSessionTime % 60;
    
    // Immer Stunden:Minuten:Sekunden Format
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  getTaskTitle(taskId: string | undefined): string {
    let title = '';
    if (!taskId) return '';
    let tasks: any[] = [];
    this.tasks$.subscribe((t) => (tasks = t)).unsubscribe();
    const found = tasks.find((task) => task.id === taskId);
    return found ? found.title : taskId;
  }

  formatTime(timestamp: number | null | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  sectionWidths: number[] = [];

  // Berechne die Breiten der Abschnitte einmalig pro Render
  updateSectionWidths(sections: TimeSection[]) {
    const now = Date.now();
    const total =
      sections.length > 0
        ? (sections[sections.length - 1].end ?? now) - sections[0].start
        : 1;
    this.sectionWidths = sections.map((section) => {
      const start = section.start;
      const end = section.end ?? now;
      return total > 0 ? ((end - start) / total) * 100 : 0;
    });
  }
  trackerStatus: 'idle' | 'running' | 'paused' | 'stopped' = 'idle';
  private store = inject(Store);
  timeState$ = this.store.select(selectTimeState);
  tasks$ = this.store.select((state: any) => state.task.tasks);
  selectedTaskId: string | null = null;
  hasPausedOnce: boolean = false;

  // Live Timer Properties
  currentSessionTime: number = 0; // in seconds
  private timerInterval?: number;
  private sessionStartTime?: number;

  // Custom Dropdown Properties
  dropdownOpen: boolean = false;
  selectedTaskTitle: string = '';

  // Custom Dropdown Methods
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectTask(taskId: string, taskTitle: string) {
    this.selectedTaskId = taskId;
    this.selectedTaskTitle = taskTitle;
    this.dropdownOpen = false;
  }

  getSelectedTaskTitle(): string {
    if (this.selectedTaskTitle) {
      return this.selectedTaskTitle;
    }
    // Fallback: get title from tasks observable
    if (this.selectedTaskId) {
      return this.getTaskTitle(this.selectedTaskId);
    }
    return '';
  }

  trackByTaskId(index: number, task: any): string {
    return task.id;
  }

  startWorkday() {
    if (this.selectedTaskId) {
      this.store.dispatch(
        startSection({
          start: Date.now(),
          sectionType: 'work',
          taskId: this.selectedTaskId,
        })
      );
      this.trackerStatus = 'running';
      this.startTimer(); // Timer starten
    }
  }

  pauseWorkday() {
    this.store.dispatch(endSection({ end: Date.now() }));
    this.store.dispatch(
      startSection({ start: Date.now(), sectionType: 'pause' })
    );
    this.trackerStatus = 'paused';
    this.hasPausedOnce = true;
    this.startTimer(); // Timer für Pause neu starten
  }

  resumeWorkday() {
    if (this.selectedTaskId) {
      this.store.dispatch(endSection({ end: Date.now() }));
      this.store.dispatch(
        startSection({
          start: Date.now(),
          sectionType: 'work',
          taskId: this.selectedTaskId,
        })
      );
      this.trackerStatus = 'running';
      this.startTimer(); // Timer für Arbeit neu starten
    }
  }
  async stopWorkday() {
    this.store.dispatch(endSection({ end: Date.now() }));
    // Workday speichern, aber garantiert nur einmal!
    const [state, tasks] = await firstValueFrom(
      combineLatest([
        this.timeState$.pipe(take(1)),
        this.tasks$.pipe(take(1))
      ])
    );
    const cleanSections = state.sections.map((section: any) => {
      const s: any = { ...section };
      if (s.taskId === undefined) delete s.taskId;
      if (s.taskId) {
        const found = tasks.find((task: any) => task.id === s.taskId);
        s.taskTitle = found ? found.title : s.taskId;
      }
      return s;
    });

    // TrackedTime für Tasks berechnen und updaten
    const trackedTimeMap: { [id: string]: number } = {};
    cleanSections.forEach((section: any) => {
      if (section.type === 'work' && section.taskId) {
        const duration =
          section.end && section.start
            ? Math.round((section.end - section.start) / 1000)
            : 0;
        trackedTimeMap[section.taskId] =
          (trackedTimeMap[section.taskId] || 0) + duration;
      }
    });
    Object.entries(trackedTimeMap).forEach(([id, totalTrackedTime]) => {
      this.store.dispatch(
        stopWorkDay({ totalWorked: totalTrackedTime * 1000, taskId: id })
      );
    });
    
    // Tasks neu laden damit die totalTrackedTime aktualisiert wird
    this.store.dispatch(loadTasks());
    
    // TODO: User-ID aus Firebase Auth holen, sobald Auth integriert ist
    const userId = 'testuser';
    const workday = {
      date: new Date().toISOString().slice(0, 10),
      sections: cleanSections,
      userId,
    };
    
    // Workday sowohl im Service als auch im Store speichern
    this.workdayService.saveWorkday(workday);
    this.store.dispatch(saveWorkday({ workday }));
    
    // Store neu laden damit Dashboard sich aktualisiert
    this.store.dispatch(loadWorkdays());
    
    this.trackerStatus = 'stopped';
    this.hasPausedOnce = false;
    this.stopTimer(); // Timer stoppen und resetten
  }

  // ==========================================
  // Docking-bezogene Methoden
  // ==========================================

  /**
   * Tracker in Navbar parken (Desktop)
   */
  dockTracker(): void {
    this.dockingService.dockTracker();
  }

  /**
   * Fullscreen schließen (Mobile)
   */
  closeFullscreen(): void {
    this.dockingService.closeFullscreen();
  }

  /**
   * Tracker maximieren (wird von Navbar aufgerufen)
   */
  maximizeTracker(): void {
    this.dockingService.undockTracker();
  }

  /**
   * Handler für Drag Start
   */
  onDragStarted(): void {
    // Reset any previous drag-over states
    this.removeDragOverEffects();
  }

  /**
   * Handler für Drag Move - prüft ob über Docking Zone
   */
  onDragMoved(event: any): void {
    const dropZone = document.querySelector('.docking-zone');
    const tracker = document.querySelector('.workday-tracker-floating');
    
    if (dropZone && tracker) {
      const rect = dropZone.getBoundingClientRect();
      const pointer = event.pointerPosition;
      
      // Prüfen ob Mauszeiger über Docking-Zone ist
      const isOverZone = pointer.x >= rect.left && 
                        pointer.x <= rect.right && 
                        pointer.y >= rect.top && 
                        pointer.y <= rect.bottom;
      
      if (isOverZone) {
        // Über Zone - Effekte hinzufügen
        dropZone.classList.add('drag-over');
        tracker.classList.add('drag-over-dock');
      } else {
        // Nicht über Zone - Effekte entfernen
        dropZone.classList.remove('drag-over');
        tracker.classList.remove('drag-over-dock');
      }
    }
  }

  /**
   * Entfernt alle Drag-Over Effekte
   */
  private removeDragOverEffects(): void {
    const dropZone = document.querySelector('.docking-zone');
    const tracker = document.querySelector('.workday-tracker-floating');
    
    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }
    if (tracker) {
      tracker.classList.remove('drag-over-dock');
    }
  }

  /**
   * Handler für Drag Drop Events
   */
  onDragDropped(event: CdkDragEnd): void {
    // Effekte immer zurücksetzen nach dem Drop
    this.removeDragOverEffects();
    
    // Prüfen ob über Docking-Zone gedroppt wurde
    const dropZone = document.querySelector('.docking-zone');
    if (dropZone) {
      const rect = dropZone.getBoundingClientRect();
      const x = event.dropPoint.x;
      const y = event.dropPoint.y;
      
      // Prüfen ob Drop-Punkt innerhalb der Docking-Zone liegt
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        this.dockingService.dockTracker();
        console.log('Tracker wurde per Drag & Drop geparkt!');
      }
    }
  }
}
