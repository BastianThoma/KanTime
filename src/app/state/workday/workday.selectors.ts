import { createFeatureSelector, createSelector } from '@ngrx/store';
import { Workday } from './workday.model';
import { WorkdayState } from '../workday/workday.reducer';

export const selectWorkdayState = createFeatureSelector<WorkdayState>('workday');

export const selectWorkdays = createSelector(
  selectWorkdayState,
  (state: WorkdayState) => (state && state.workdays ? state.workdays as Workday[] : [])
);
