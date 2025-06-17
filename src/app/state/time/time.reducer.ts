import { createReducer, on } from '@ngrx/store';
import { initialTimeState } from './time.model';
import * as TimeActions from './time.actions';

export const timeReducer = createReducer(
  initialTimeState,

  on(TimeActions.startWorkDay, (state, { taskId }) => ({
    ...state,
    isWorking: true,
    isPaused: false,
    startTime: Date.now(),
    pauseTime: null,
    currentTaskId: taskId,
    totalWorked: 0,
  })),

  on(TimeActions.pauseWork, (state) => ({
    ...state,
    isPaused: true,
    pauseTime: Date.now(),
  })),

  on(TimeActions.resumeWork, (state) => ({
    ...state,
    isPaused: false,
    totalWorked: state.totalWorked + (Date.now() - (state.pauseTime ?? Date.now())),
    pauseTime: null,
  })),

  on(TimeActions.stopWorkDay, (state) => ({
    ...initialTimeState,
  })),

  on(TimeActions.tickTime, (state, { now }) => {
    if (!state.isWorking || state.isPaused || !state.startTime) return state;
    return {
      ...state,
      totalWorked: state.totalWorked + (now - state.startTime),
      startTime: now,
    };
  })
);
