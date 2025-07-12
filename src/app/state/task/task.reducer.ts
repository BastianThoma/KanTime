import { createReducer, on } from '@ngrx/store';
import { Task } from './task.model';
import * as TaskActions from './task.actions';

export interface TaskState {
  tasks: Task[];
}

const initialState: TaskState = {
  tasks: []
};

export const taskReducer = createReducer(
  initialState,

  on(TaskActions.addTask, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task]
  })),

  on(TaskActions.updateTask, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map(t =>
      t.id === task.id ? { ...t, ...task, updatedAt: Date.now() } : t
    )
  })),

  on(TaskActions.deleteTask, (state, { id }) => ({
    ...state,
    tasks: state.tasks.filter(t => t.id !== id)
  })),

  on(TaskActions.moveTask, (state, { id, status }) => ({
    ...state,
    tasks: state.tasks.map(t =>
      t.id === id ? { ...t, status, updatedAt: Date.now() } : t
    )
  })),
  on(TaskActions.moveTask, (state, { id, status }) => ({
    ...state,
    tasks: state.tasks.map(t =>
      t.id === id ? { ...t, status, updatedAt: Date.now() } : t
    )
  })),

  on(TaskActions.updateTrackedTime, (state, { id, totalTrackedTime }) => ({
    ...state,
    tasks: state.tasks.map(t =>
      t.id === id ? { ...t, totalTrackedTime, updatedAt: Date.now() } : t
    )
  })),

  on(TaskActions.loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks: tasks
  }))
);
