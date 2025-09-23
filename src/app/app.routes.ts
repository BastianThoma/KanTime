import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard),
    },
    {
        path: 'tasks',
        loadComponent: () => import('./components/taskboard/taskboard').then(m => m.Taskboard),
    },
    {
        path: 'workday-calendar',
        loadComponent: () => import('./components/workday-calendar/workday-calendar').then(m => m.WorkdayCalendar),
    },
];
