import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { timeReducer } from './state/time/time.reducer';
import { TimeEffects } from './state/time/time.effects';
import { taskReducer } from './state/task/task.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideStore({ time: timeReducer, task: taskReducer }),
    provideEffects(TimeEffects),
    provideStoreDevtools({ maxAge: 25 }),
  ]
};

