import { createReducer, on } from '@ngrx/store';
import * as WorkdayActions from './workday.actions';
import { Workday } from './workday.model';

export interface WorkdayState {
  workdays: Workday[];
  loading: boolean;
  error: any;
}

export const initialState: WorkdayState = {
  workdays: [],
  loading: false,
  error: null,
};

export const workdayReducer = createReducer(
  initialState,
  on(WorkdayActions.loadWorkdays, state => ({ ...state, loading: true })),
  on(WorkdayActions.loadWorkdaysSuccess, (state, { workdays }) => ({ ...state, loading: false, workdays })),
  on(WorkdayActions.loadWorkdaysFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(WorkdayActions.saveWorkday, state => ({ ...state, loading: true })),
  on(WorkdayActions.saveWorkdaySuccess, (state, { workday }) => ({ ...state, loading: false, workdays: [...state.workdays, workday] })),
  on(WorkdayActions.saveWorkdayFailure, (state, { error }) => ({ ...state, loading: false, error })),
);
