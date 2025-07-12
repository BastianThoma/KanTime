import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TaskService } from './task.service';
import * as TaskActions from './task.actions';
import { switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Task } from './task.model';

@Injectable()
export class TaskEffects {
  private actions$ = inject(Actions);
  private taskService = inject(TaskService);
  private store = inject(Store);
  constructor() {}

  // Tasks aus Firestore laden
  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.loadTasks),
      switchMap(() =>
        this.taskService.getTasks().pipe(
          map((tasks: Task[]) => TaskActions.loadTasksSuccess({ tasks })),
          catchError((error) => of(TaskActions.loadTasksFailure({ error })))
        )
      )
    )
  );

  // Task-Status in Firestore aktualisieren
  moveTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.moveTask),
      switchMap(({ id, status }) =>
        this.taskService.updateTask(id, { status }).then(
          () => TaskActions.moveTaskSuccess({ id, status }),
          (error) => TaskActions.moveTaskFailure({ error })
        )
      )
    )
  );
}
