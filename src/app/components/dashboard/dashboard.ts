import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { selectTotalWorked } from '../../state/time/time.selectors';
import { selectAllTasks } from '../../state/task/task.selectors';
import { Task } from '../../state/task/task.model';
import { Workday } from '../../state/workday/workday.model';
import { selectWorkdays } from '../../state/workday/workday.selectors';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  todayWorked: Observable<string>;
  topTasks: Task[] = [];
  lastWorkday: Workday | null = null;
  totalWorkedAll: Observable<string>;
  upcomingTasks: Task[] = [];

  constructor(private store: Store) {
    // Daten beim Initialisieren laden
    this.store.dispatch({ type: '[Task] Load Tasks' });
    this.store.dispatch({ type: '[Workday] Load Workdays' });

    this.todayWorked = this.store.select(selectTotalWorked).pipe(
      map(ms => this.formatMinutes(ms))
    );

    this.totalWorkedAll = this.store.select(selectAllTasks).pipe(
      map(tasks => this.formatMinutes(tasks.reduce((sum, t) => sum + (t.totalTrackedTime || 0) * 1000, 0)))
    );

    this.store.select(selectAllTasks).subscribe(tasks => {
      this.topTasks = tasks
        .filter(t => t.status === 'in-progress')
        .sort((a, b) => (b.totalTrackedTime || 0) - (a.totalTrackedTime || 0))
        .slice(0, 3);
      this.upcomingTasks = tasks
        .filter(t => !!(t as any).deadline)
        .sort((a, b) => ((a as any).deadline || 0) - ((b as any).deadline || 0))
        .slice(0, 3);
    });

    this.store.select(selectWorkdays).subscribe(workdays => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yDate = yesterday.toISOString().slice(0, 10);
      const wds = workdays as Workday[];
      this.lastWorkday = wds.filter((wd: Workday) => wd.date === yDate)[0] || null;
    });
  }

  formatDate(date: string | number): string {
    if (!date) return '-';
    const d = new Date(typeof date === 'string' ? date : Number(date));
    return d.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
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
