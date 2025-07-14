import { Component, computed, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import {
  selectIsWorking,
  selectIsPaused,
  selectTotalWorked,
} from '../../state/time/time.selectors';
import * as TimeActions from '../../state/time/time.actions';
import { RouterModule } from '@angular/router';
import { selectAllTasks } from '../../state/task/task.selectors';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private store = inject(Store);

  isWorking = this.store.selectSignal(selectIsWorking);
  isPaused = this.store.selectSignal(selectIsPaused);
  totalWorked = this.store.selectSignal(selectTotalWorked);

  tasks$ = this.store.select(selectAllTasks);
  selectedTaskId: string | null = null;

  constructor() {
    this.store.dispatch({ type: '[Task] Load Tasks' });
  }

  start() {
    if (this.selectedTaskId) {
      this.store.dispatch(
        TimeActions.startWorkDay({ taskId: this.selectedTaskId })
      );
    }
  }

  pause() {
    this.store.dispatch(TimeActions.pauseWork());
  }

  resume() {
    this.store.dispatch(TimeActions.resumeWork());
  }

  stop() {
    console.log('Dashboard stop()', { selectedTaskId: this.selectedTaskId, totalWorked: this.totalWorked() });
    this.store.dispatch(TimeActions.stopWorkDay({ totalWorked: this.totalWorked(), taskId: this.selectedTaskId! }));
  }

  format(ms: number): string {
    const sec = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / 60000) % 60;
    const hr = Math.floor(ms / 3600000);
    return `${hr.toString().padStart(2, '0')}:${min
      .toString()
      .padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
}
