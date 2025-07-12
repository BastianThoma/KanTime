import { createAction, props } from '@ngrx/store';
import { Task } from './task.model';

export const loadTasks = createAction('[Task] Load Tasks');

export const loadTasksSuccess = createAction(
  '[Task] Load Tasks Success',
  props<{ tasks: Task[] }>()
);

export const loadTasksFailure = createAction(
  '[Task] Load Tasks Failure',
  props<{ error: any }>()
);

export const moveTaskSuccess = createAction(
  '[Task] Move Task Success',
  props<{ id: string; status: Task['status'] }>()
);

export const moveTaskFailure = createAction(
  '[Task] Move Task Failure',
  props<{ error: any }>()
);

export const addTask = createAction('[Task] Add Task', props<{ task: Task }>());

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
