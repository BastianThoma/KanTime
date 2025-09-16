import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { TimeSection } from '../../state/time/time.model';
import { selectTimeState } from '../../state/time/time.selectors';
import { startSection, endSection, stopWorkDay } from '../../state/time/time.actions';
import { combineLatest, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { WorkdayService } from '../../state/workday/workday.service';
import { loadTasks } from '../../state/task/task.actions';
import { OnDestroy } from '@angular/core';
@Component({
  selector: 'app-workday-tracker',
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './workday-tracker.html',
  styleUrl: './workday-tracker.scss',
})
export class WorkdayTracker implements OnDestroy {
  private workdayService = inject(WorkdayService);
  ngOnInit() {
    this.store.dispatch(loadTasks());
    this.timeState$.subscribe((state) => {
      this.updateSectionWidths(state.sections);
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // Live Timer Methods
  private startTimer(): void {
    this.sessionStartTime = Date.now();
    this.currentSessionTime = 0;
    
    this.timerInterval = window.setInterval(() => {
      if (this.sessionStartTime) {
        this.currentSessionTime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
    this.currentSessionTime = 0;
    this.sessionStartTime = undefined;
  }

  formatSessionTime(): string {
    const hours = Math.floor(this.currentSessionTime / 3600);
    const minutes = Math.floor((this.currentSessionTime % 3600) / 60);
    const seconds = this.currentSessionTime % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
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
    // TODO: User-ID aus Firebase Auth holen, sobald Auth integriert ist
    const userId = 'testuser';
    const workday = {
      date: new Date().toISOString().slice(0, 10),
      sections: cleanSections,
      userId,
    };
    this.workdayService.saveWorkday(workday);
    this.trackerStatus = 'stopped';
    this.hasPausedOnce = false;
    this.stopTimer(); // Timer stoppen und resetten
  }
}
