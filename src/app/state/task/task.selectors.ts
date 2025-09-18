import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TaskState } from './task.reducer';

export const selectTaskState = createFeatureSelector<TaskState>('task');

export const selectAllTasks = createSelector(
  selectTaskState,
  state => state.tasks
);

export const selectTasksByStatus = (status: string) =>
  createSelector(selectAllTasks, tasks =>
    tasks
      .filter(task => task.status === status)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  );
