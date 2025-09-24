import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadingService implements PreloadingStrategy {
  
  preload(route: Route, fn: () => Observable<any>): Observable<any> {
    // Nur Dashboard preloaden, andere on-demand
    if (route.path === '') {
      // Dashboard sofort preloaden
      return fn();
    } else {
      // Andere Routes nur bei Hover/Idle preloaden
      return timer(2000).pipe(mergeMap(() => fn()));
    }
  }
}