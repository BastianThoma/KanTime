import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { SelectivePreloadingService } from './shared/services/selective-preloading.service';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { timeReducer } from './state/time/time.reducer';
import { TimeEffects } from './state/time/time.effects';
import { taskReducer } from './state/task/task.reducer';
import { TaskEffects } from './state/task/task.effects';
import { workdayReducer } from './state/workday/workday.reducer';
import { isDevMode } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideRouter(routes, withPreloading(SelectivePreloadingService)),
    provideStore({ time: timeReducer, task: taskReducer, workday: workdayReducer }),
    provideEffects(TimeEffects, TaskEffects),
    // DevTools nur in Development Mode
    ...(isDevMode() ? [provideStoreDevtools({ maxAge: 25 })] : []),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
  ],
};
