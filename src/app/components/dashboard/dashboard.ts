import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { WorkdayService } from '../../state/workday/workday.service';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { selectAllTasks } from '../../state/task/task.selectors';
import { Task } from '../../state/task/task.model';
import { selectWorkdays } from '../../state/workday/workday.selectors';

type TaskStatus = 'todo' | 'in-progress' | 'done';

interface WeeklyData {
  label: string;
  hours: number;
  isToday: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  todayWorked: number = 0;
  topTasks: Task[] = [];
  allTasks: Task[] = []; // Neue Property für alle Tasks
  lastWorkdayDate: string | null = null;
  totalWorkedAll: Observable<string>;
  upcomingTasks: Task[] = [];
  lastWorkedTime: number = 0;
  lastWorkedTaskIds: string[] = [];
  lastWorkedTasks: string[] = [];
  weeklyData: WeeklyData[] = [];

  // Cache für stabile Werte
  private cachedProductivityData = {
    completedToday: 0,
    focusRatio: 0,
    lastCalculated: 0
  };

  constructor(
    private store: Store, 
    private workdayService: WorkdayService,
    private cdr: ChangeDetectorRef
  ) {
    this.totalWorkedAll = this.store
      .select(selectAllTasks)
      .pipe(
        map((tasks) =>
          this.formatMinutes(
            tasks.reduce((sum, t) => sum + (t.totalTrackedTime || 0) * 1000, 0)
          )
        )
      );
  }

  ngOnInit(): void {
    // Daten beim Initialisieren laden
    this.store.dispatch({ type: '[Task] Load Tasks' });
    this.store.dispatch({ type: '[Workday] Load Workdays' });

    // Alle Subscriptions mit takeUntil für proper cleanup
    this.store.select(selectAllTasks)
      .pipe(takeUntil(this.destroy$))
      .subscribe((tasks) => {
        this.allTasks = tasks; // Alle Tasks speichern
        this.topTasks = tasks
          .filter((t) => t.status === 'in-progress')
          .sort((a, b) => (b.totalTrackedTime || 0) - (a.totalTrackedTime || 0))
          .slice(0, 3);
        this.upcomingTasks = tasks
          .filter((t) => !!(t as any).deadline)
          .sort((a, b) => ((a as any).deadline || 0) - ((b as any).deadline || 0))
          .slice(0, 3);
          
        // Produktivitätsdaten neu berechnen wenn sich Tasks ändern
        this.updateProductivityCache();
        
        // Auch Workday-Daten neu laden, da sich durch Task-Updates die Zeiten ändern können
        this.loadTodayWorked();
        this.loadWeeklyData();
        
        // Change Detection triggern nach Task-Updates
        this.cdr.detectChanges();
        
        // Task-Titel aktualisieren
        this.lastWorkedTasks = this.lastWorkedTaskIds.map(taskId => {
          const found = tasks.find(t => t.id === taskId);
          return found ? found.title : taskId;
        });
        
        // Change Detection manuell triggern
        this.cdr.detectChanges();
      });

    this.store.select(selectWorkdays)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadTodayWorked();
        this.loadYesterdayWorked();
        this.loadWeeklyData();
        // Change Detection nach Datenladung triggern
        this.cdr.detectChanges();
      });

    // Initial load der Workday-Daten
    this.loadTodayWorked();
    this.loadYesterdayWorked();
    this.loadWeeklyData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadYesterdayWorked() {
    try {
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
      
      // Change Detection triggern nach Datenladung
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading yesterday worked:', error);
    }
  }

  loadTodayWorked = async () => {
    try {
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
        // Nur beim ersten Aufruf loggen, um Spam zu vermeiden
        if (this.todayWorked === 0) {
          console.log('Kein Workday für heute gefunden.');
        }
      }
      
      // Change Detection triggern nach Datenladung
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading today worked:', error);
    }
  };

  async loadWeeklyData() {
    try {
      const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
      const today = new Date();
      const weekData: WeeklyData[] = [];
      const userId = 'testuser';

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
        const dateIso = date.toISOString().slice(0, 10);
        
        // Echte Daten aus dem Workday Service holen
        const workdays = await this.workdayService.getWorkdays(userId);
        const dayWorkdays = workdays.filter(wd => wd.date === dateIso);
        
        let totalSeconds = 0;
        if (dayWorkdays.length > 0) {
          const workSections = dayWorkdays.flatMap(wd => wd.sections.filter(s => s.type === 'work'));
          totalSeconds = workSections.reduce(
            (sum, s) => sum + Math.floor(((s.end ?? Date.now()) - s.start) / 1000),
            0
          );
        }
        
        weekData.push({
          label: days[dayIndex],
          hours: Math.round((totalSeconds / 3600) * 10) / 10,
          isToday: i === 0
        });
      }

      this.weeklyData = weekData;
      
      // Change Detection triggern nach Datenladung
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  }

  // Analytics Methods
  getTodayProgress(): number {
    const targetSeconds = 8 * 60 * 60; // 8 hours in seconds
    return Math.min(100, Math.round((this.todayWorked / targetSeconds) * 100));
  }

  getMaxWeeklyHours(): number {
    return Math.max(...this.weeklyData.map(d => d.hours), 8);
  }

  getProductivityScore(): number {
    const completedToday = this.getCompletedTasksToday();
    const focusRatio = this.getFocusTimeRatio();
    const timeProgress = Math.min(this.getTodayProgress(), 100);
    
    // Weighted average of different productivity factors
    return Math.round((completedToday * 0.3 + focusRatio * 0.4 + timeProgress * 0.3));
  }

  private updateProductivityCache(): void {
    const now = Date.now();
    // Cache für 1 Minute, um Schwankungen zu vermeiden
    if (now - this.cachedProductivityData.lastCalculated > 60000) {
      // Berechne echte Werte basierend auf Tasks
      const completedTasks = this.allTasks.filter(task => task.status === 'done').length;
      const totalTasks = this.allTasks.length;
      
      this.cachedProductivityData.completedToday = Math.min(completedTasks, 8);
      this.cachedProductivityData.focusRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      this.cachedProductivityData.lastCalculated = now;
    }
  }

  getCompletedTasksToday(): number {
    this.updateProductivityCache();
    return this.cachedProductivityData.completedToday;
  }

  getFocusTimeRatio(): number {
    this.updateProductivityCache();
    return Math.max(60, this.cachedProductivityData.focusRatio); // Mindestens 60%
  }

  getTaskCount(status: TaskStatus): number {
    return this.allTasks.filter(task => task.status === status).length; // Alle Tasks verwenden
  }

  getTaskPercentage(status: TaskStatus): number {
    const total = this.allTasks.length; // Alle Tasks verwenden
    if (total === 0) return 0;
    return Math.round((this.getTaskCount(status) / total) * 100);
  }

  getTaskProgress(task: Task): number {
    // Seit estimatedTime nicht verfügbar ist, verwenden wir totalTrackedTime als Basis
    // Für Demo-Zwecke: 100% bei mehr als 2 Stunden Arbeit
    const targetTime = 2 * 60 * 60; // 2 Stunden in Sekunden
    if (!task.totalTrackedTime) return 0;
    return Math.min(100, Math.round((task.totalTrackedTime / targetTime) * 100));
  }

  getTimeChange(): string {
    const diff = this.todayWorked - this.lastWorkedTime;
    const hours = Math.abs(diff) / 3600;
    const sign = diff >= 0 ? '+' : '-';
    return `${sign}${hours.toFixed(1)}h`;
  }

  getWeeklyAverage(): string {
    if (this.weeklyData.length === 0) return '0h';
    const totalHours = this.weeklyData.reduce((sum, day) => sum + day.hours, 0);
    const avgHours = totalHours / this.weeklyData.length;
    return `${avgHours.toFixed(1)}h`;
  }

  getUrgentTasks(): Task[] {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    return this.upcomingTasks.filter(task => {
      const deadline = (task as any).deadline;
      return deadline && new Date(deadline) <= threeDaysFromNow;
    });
  }

  isOverdue(task: Task): boolean {
    const deadline = (task as any).deadline;
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  getDeadlineText(task: Task): string {
    const deadline = (task as any).deadline;
    if (!deadline) return '';
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} Tage überfällig`;
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Morgen';
    return `in ${diffDays} Tagen`;
  }

  getUrgencyClass(task: Task): string {
    const deadline = (task as any).deadline;
    if (!deadline) return '';
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'warning';
    return 'normal';
  }

  exportData(): void {
    const data = {
      todayWorked: this.todayWorked,
      weeklyData: this.weeklyData,
      tasks: this.topTasks,
      productivity: this.getProductivityScore()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `kantime-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Utility Methods
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
