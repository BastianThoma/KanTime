import { createAction, props } from '@ngrx/store';
import { Task } from './task.model';

export const addTask = createAction(
  '[Task] Add Task',
  props<{ task: Task }>()
);

export const updateTask = createAction(
  '[Task] Update Task',
  props<{ task: Partial<Task> & { id: string } }>()
);

export const deleteTask = createAction(
  '[Task] Delete Task',
  props<{ id: string }>()
);

export const moveTask = createAction(
  '[Task] Move Task',
  props<{ id: string; status: Task['status'] }>()
);
