import { createAction, props } from '@ngrx/store';
import { Workday } from './workday.model';

export const startWorkday = createAction('[Workday] Start', props<{ start: number }>());
export const endWorkday = createAction('[Workday] End', props<{ end: number }>());
export const startSection = createAction('[Workday] Start Section', props<{ start: number; sectionType: 'work' | 'pause'; taskId?: string }>());
export const endSection = createAction('[Workday] End Section', props<{ end: number }>());
export const setActiveTask = createAction('[Workday] Set Active Task', props<{ taskId: string }>());

export const loadWorkdays = createAction('[Workday] Load Workdays');
export const loadWorkdaysSuccess = createAction('[Workday] Load Workdays Success', props<{ workdays: Workday[] }>());
export const loadWorkdaysFailure = createAction('[Workday] Load Workdays Failure', props<{ error: any }>());

export const saveWorkday = createAction('[Workday] Save Workday', props<{ workday: Workday }>());
export const saveWorkdaySuccess = createAction('[Workday] Save Workday Success', props<{ workday: Workday }>());
export const saveWorkdayFailure = createAction('[Workday] Save Workday Failure', props<{ error: any }>());
