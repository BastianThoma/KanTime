import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeState, TimeSection } from '../../state/time/time.model';
import { selectTimeState } from '../../state/time/time.selectors';
import { startSection, endSection, stopWorkDay } from '../../state/time/time.actions';
import { WorkdayService } from '../../state/workday/workday.service';
import { loadTasks } from '../../state/task/task.actions';
@Component({
  selector: 'app-workday-tracker',
  imports: [CommonModule, FormsModule],
  templateUrl: './workday-tracker.html',
  styleUrl: './workday-tracker.scss',
})
export class WorkdayTracker {
  private workdayService = inject(WorkdayService);
  ngOnInit() {
    this.store.dispatch(loadTasks());
    this.timeState$.subscribe((state) => {
      this.updateSectionWidths(state.sections);
    });
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
    }
  }
  pauseWorkday() {
    this.store.dispatch(endSection({ end: Date.now() }));
    this.store.dispatch(
      startSection({ start: Date.now(), sectionType: 'pause' })
    );
    this.trackerStatus = 'paused';
    this.hasPausedOnce = true;
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
    }
  }
  stopWorkday() {
    this.store.dispatch(endSection({ end: Date.now() }));
    // Workday speichern
    this.timeState$
      .subscribe((state) => {
        let tasks: any[] = [];
        this.tasks$.subscribe((t) => (tasks = t)).unsubscribe();
        const cleanSections = state.sections.map((section) => {
          const s: any = { ...section };
          if (s.taskId === undefined) delete s.taskId;
          if (s.taskId) {
            const found = tasks.find((task) => task.id === s.taskId);
            s.taskTitle = found ? found.title : s.taskId;
          }
          return s;
        });

        // TrackedTime für Tasks berechnen und updaten
        const trackedTimeMap: { [id: string]: number } = {};
        cleanSections.forEach((section) => {
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
      })
      .unsubscribe();
    this.trackerStatus = 'stopped';
    this.hasPausedOnce = false;
  }
}
