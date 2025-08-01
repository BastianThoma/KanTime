export const startSection = createAction(
  '[Time] Start Section',
  props<{ start: number; sectionType: 'work' | 'pause'; taskId?: string }>()
);

export const endSection = createAction(
  '[Time] End Section',
  props<{ end: number }>()
);
import { createAction, props } from '@ngrx/store';

export const startWorkDay = createAction(
  '[Time] Start Work Day',
  props<{ taskId: string }>()
);

export const pauseWork = createAction('[Time] Pause Work');

export const resumeWork = createAction('[Time] Resume Work');

export const stopWorkDay = createAction('[Time] Stop Work Day', props<{ totalWorked: number; taskId: string }>());

export const tickTime = createAction(
  '[Time] Tick Time',
  props<{ now: number }>()
);
