import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TaskService } from './task.service';
import * as TaskActions from './task.actions';
import * as TimeActions from '../time/time.actions';
import { switchMap, map, catchError, withLatestFrom, filter, mergeMap, delay } from 'rxjs/operators';
import { selectCurrentTask, selectTotalWorked } from '../time/time.selectors';
import { selectAllTasks } from './task.selectors';
import { of, from } from 'rxjs';
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
      delay(100), // Kurze Verzögerung für Firebase-Initialisierung
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
          (error: any) => TaskActions.moveTaskFailure({ error })
        )
      )
    )
  );

  // Tracked Time nach Stop synchronisieren
  updateTrackedTime$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimeActions.stopWorkDay),
      withLatestFrom(
        this.store.select(selectAllTasks)
      ),
      filter(([action, tasks]: [{ type: string; totalWorked: number; taskId: string }, Task[]]) => !!action.taskId && action.totalWorked > 0),
      switchMap(([action, tasks]: [{ type: string; totalWorked: number; taskId: string }, Task[]]) => {
        const task = tasks.find(t => t.id === action.taskId);
        const previousTracked = task?.totalTrackedTime ?? 0;
        const newTracked = previousTracked + Math.floor(action.totalWorked / 1000);
        console.log('updateTrackedTime$', { taskId: action.taskId, previousTracked, newTracked, task, totalWorked: action.totalWorked });
        return from(
          this.taskService.updateTask(action.taskId!, { totalTrackedTime: newTracked }).then(() => [
            TaskActions.updateTrackedTime({ id: action.taskId!, totalTrackedTime: newTracked }),
            TaskActions.loadTasks()
          ])
        ).pipe(
          mergeMap(actions => actions)
        );
      })
    )
  );
}
