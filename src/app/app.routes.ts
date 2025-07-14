import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Taskboard } from './components/taskboard/taskboard';
import { WorkdayTracker } from './components/workday-tracker/workday-tracker';

export const routes: Routes = [
    {
        path: '',
        component: Dashboard,
    },
    {
        path: 'tasks',
        component: Taskboard,
    },
    {
        path: 'workday-tracker',
        component: WorkdayTracker,
    },
    {
        path: 'workday-calendar',
        loadComponent: () => import('./components/workday-calendar/workday-calendar').then(m => m.WorkdayCalendar),
    },
];
