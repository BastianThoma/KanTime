import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkdayService } from '../../state/workday/workday.service';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-workday-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workday-calendar.html',
  styleUrl: './workday-calendar.scss',
})
export class WorkdayCalendar {
  private workdayService = inject(WorkdayService);
  private cdr = inject(ChangeDetectorRef);
  private store = inject(Store);
  workdays: any[] = [];
  tasks$ = this.store.select((state: any) => state.task.tasks);

  ngOnInit() {
    // TODO: User-ID aus Firebase Auth holen, sobald Auth integriert ist
    const userId = 'testuser';
    this.loadWorkdays(userId);
  }

  async loadWorkdays(userId: string) {
    try {
      const workdays = await this.workdayService.getWorkdays(userId);
      // Sortiere Workdays nach Datum (neueste zuerst)
      this.workdays = workdays.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      this.cdr.detectChanges();
      console.log('Geladene Workdays:', this.workdays);
    } catch (error) {
      console.error('Fehler beim Laden der Workdays:', error);
      this.workdays = [];
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('de-DE');
  }

  toDate(ts: number | null | undefined): Date {
    return ts ? new Date(ts) : new Date();
  }

  getTaskTitle(taskId: string): string {
    let tasks: { id: string; title: string }[] = [];
    this.tasks$.subscribe((t: any[]) => (tasks = t)).unsubscribe();
    const found = tasks.find(task => task.id === taskId);
    return found ? found.title : taskId;
  }

  /**
   * Berechnet die Gesamtarbeitszeit für alle Work-Abschnitte eines Workdays
   */
  calculateWorkTime(sections: any[]): string {
    const workSections = sections.filter(s => s.type === 'work');
    const totalMs = workSections.reduce((sum, section) => {
      const duration = (section.end ?? Date.now()) - section.start;
      return sum + duration;
    }, 0);
    
    return this.formatDurationMs(totalMs);
  }

  /**
   * Formatiert eine Dauer zwischen zwei Timestamps
   */
  formatDuration(start: number, end: number | null): string {
    if (!end) return 'Läuft...';
    const duration = end - start;
    return this.formatDurationMs(duration);
  }

  /**
   * Formatiert Millisekunden in lesbare Zeitangabe
   */
  private formatDurationMs(ms: number): string {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    } else {
      return `${minutes}min`;
    }
  }
}
