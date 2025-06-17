import { createAction, props } from '@ngrx/store';

export const startWorkDay = createAction(
  '[Time] Start Work Day',
  props<{ taskId: string }>()
);

export const pauseWork = createAction('[Time] Pause Work');

export const resumeWork = createAction('[Time] Resume Work');

export const stopWorkDay = createAction('[Time] Stop Work Day');

export const tickTime = createAction(
  '[Time] Tick Time',
  props<{ now: number }>()
);
