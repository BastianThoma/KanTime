import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { interval, map, switchMap, takeUntil, withLatestFrom, filter } from 'rxjs';
import * as TimeActions from './time.actions';
import { selectIsWorking, selectIsPaused } from './time.selectors';

@Injectable()
export class TimeEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);

  tick$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimeActions.startWorkDay, TimeActions.resumeWork),
      switchMap(() =>
        interval(1000).pipe(
          withLatestFrom(
            this.store.select(selectIsWorking),
            this.store.select(selectIsPaused)
          ),
          filter(([_, isWorking, isPaused]) => isWorking && !isPaused),
          map(() => TimeActions.tickTime({ now: Date.now() })),
          takeUntil(
            this.actions$.pipe(
              ofType(TimeActions.pauseWork, TimeActions.stopWorkDay)
            )
          )
        )
      )
    )
  );
}
