import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TimeState } from './time.model';

export const selectTimeState = createFeatureSelector<TimeState>('time');

export const selectIsWorking = createSelector(
  selectTimeState,
  (state) => state.isWorking
);

export const selectIsPaused = createSelector(
  selectTimeState,
  (state) => state.isPaused
);

export const selectCurrentTask = createSelector(
  selectTimeState,
  (state) => state.currentTaskId
);

export const selectTotalWorked = createSelector(
  selectTimeState,
  (state) => state.totalWorked
);
