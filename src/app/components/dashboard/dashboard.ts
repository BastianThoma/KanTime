import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { WorkdayService } from '../../state/workday/workday.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { selectAllTasks } from '../../state/task/task.selectors';
import { Task } from '../../state/task/task.model';
import { selectWorkdays } from '../../state/workday/workday.selectors';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  async loadYesterdayWorked() {
    const userId = 'testuser';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().slice(0, 10);
    const workdays = await this.workdayService.getWorkdays(userId);
    const yesterdayWorkdays = workdays.filter(wd => wd.date === yDate);
    this.lastWorkdayDate = yesterdayWorkdays.length > 0 ? yesterdayWorkdays[0].date : null;
    const workSections = yesterdayWorkdays.flatMap(wd => wd.sections.filter(s => s.type === 'work'));
    this.lastWorkedTime = workSections.reduce(
      (sum, s) => sum + Math.floor(((s.end ?? Date.now()) - s.start) / 1000),
      0
    );
    this.lastWorkedTaskIds = Array.from(
      new Set(
        workSections
          .map(s => s.taskId)
          .filter((id): id is string => typeof id === 'string' && !!id)
      )
    );
    // Task-Titel aus Store holen
    this.store.select(selectAllTasks).subscribe(tasks => {
      this.lastWorkedTasks = this.lastWorkedTaskIds.map(taskId => {
        const found = tasks.find(t => t.id === taskId);
        return found ? found.title : taskId;
      });
    });
  }
  loadTodayWorked = async () => {
    const userId = 'testuser';
    const todayIso = new Date().toISOString().slice(0, 10);
    const workdays = await this.workdayService.getWorkdays(userId);
    const todayWorkdays = workdays.filter((wd) => wd.date === todayIso);
    let totalSeconds = 0;
    if (todayWorkdays.length > 0) {
      const workSections = todayWorkdays.flatMap(wd => wd.sections.filter(s => s.type === 'work'));
      console.log('Alle Work-Abschnitte heute (alle Workdays):', workSections);
      totalSeconds = workSections
        .reduce(
          (sum, s) =>
            sum + Math.floor(((s.end ?? Date.now()) - s.start) / 1000),
          0
        );
      this.todayWorked = totalSeconds;
      console.log('Arbeitszeit heute (Sekunden, alle Workdays):', totalSeconds);
    } else {
      console.log('Kein Workday für heute gefunden.');
    }
  };
  todayWorked: number = 0;
  topTasks: Task[] = [];
  lastWorkdayDate: string | null = null;
  totalWorkedAll: Observable<string>;
  upcomingTasks: Task[] = [];
  lastWorkedTime: number = 0;
  lastWorkedTaskIds: string[] = [];
  lastWorkedTasks: string[] = [];

  constructor(private store: Store, private workdayService: WorkdayService) {
    // Daten beim Initialisieren laden
    this.store.dispatch({ type: '[Task] Load Tasks' });
    this.store.dispatch({ type: '[Workday] Load Workdays' });

    this.totalWorkedAll = this.store
      .select(selectAllTasks)
      .pipe(
        map((tasks) =>
          this.formatMinutes(
            tasks.reduce((sum, t) => sum + (t.totalTrackedTime || 0) * 1000, 0)
          )
        )
      );

    this.store.select(selectAllTasks).subscribe((tasks) => {
      this.topTasks = tasks
        .filter((t) => t.status === 'in-progress')
        .sort((a, b) => (b.totalTrackedTime || 0) - (a.totalTrackedTime || 0))
        .slice(0, 3);
      this.upcomingTasks = tasks
        .filter((t) => !!(t as any).deadline)
        .sort((a, b) => ((a as any).deadline || 0) - ((b as any).deadline || 0))
        .slice(0, 3);
    });

    this.store.select(selectWorkdays).subscribe(() => {
      this.loadTodayWorked();
      this.loadYesterdayWorked();
    });
    // Task-Titel aus Store holen
    this.store.select(selectAllTasks).subscribe(tasks => {
      this.lastWorkedTasks = this.lastWorkedTaskIds.map(taskId => {
        const found = tasks.find(t => t.id === taskId);
        return found ? found.title : taskId;
      });
    });
  }

  formatDate(date: string | number): string {
    if (!date) return '-';
    const d = new Date(typeof date === 'string' ? date : Number(date));
    return d.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  formatMinutes(ms: number): string {
    if (!ms) return '0 min';
    const min = Math.round(ms / 60000);
    return `${min} min`;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0 Sek.';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (h > 0) parts.push(h + ' Std');
    if (m > 0) parts.push(m + ' min');
    if (s > 0 || parts.length === 0) parts.push(s + ' Sek');
    return parts.join(' ');
  }
}
