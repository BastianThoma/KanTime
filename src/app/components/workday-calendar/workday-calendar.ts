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
    this.workdayService.getWorkdays(userId).then(workdays => {
      this.workdays = workdays;
      this.cdr.detectChanges();
      console.log('Geladene Workdays:', workdays);
    });
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
}
