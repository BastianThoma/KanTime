
import { createReducer, on } from '@ngrx/store';
import { initialTimeState, TimeState, TimeSection } from './time.model';
import * as TimeActions from './time.actions';

export const timeReducer = createReducer(
  initialTimeState,
  on(TimeActions.startWorkDay, (state: TimeState, { taskId }) => ({
    ...state,
    isWorking: true,
    isPaused: false,
    startTime: Date.now(),
    pauseTime: null,
    currentTaskId: taskId,
    totalWorked: 0,
  })),
  on(TimeActions.pauseWork, (state: TimeState) => ({
    ...state,
    isPaused: true,
    pauseTime: Date.now(),
  })),
  on(TimeActions.resumeWork, (state: TimeState) => ({
    ...state,
    isPaused: false,
    totalWorked:
      state.totalWorked + (Date.now() - (state.pauseTime ?? Date.now())),
    pauseTime: null,
  })),
  on(TimeActions.stopWorkDay, (state: TimeState) => ({
    ...initialTimeState,
  })),
  on(TimeActions.tickTime, (state: TimeState, { now }) => {
    if (!state.isWorking || state.isPaused || !state.startTime) return state;
    return {
      ...state,
      totalWorked: state.totalWorked + (now - state.startTime),
      startTime: now,
    };
  }),
  on(TimeActions.startSection, (state: TimeState, { start, sectionType, taskId }) => ({
    ...state,
    sections: [
      ...state.sections,
      { start, end: null, type: sectionType, taskId } as TimeSection,
    ],
  })),
  on(TimeActions.endSection, (state: TimeState, { end }) => ({
    ...state,
    sections: state.sections.map(
      (section: TimeSection, idx: number, arr: TimeSection[]) =>
        idx === arr.length - 1 && section.end === null
          ? { ...section, end }
          : section
    ),
  }))
)
