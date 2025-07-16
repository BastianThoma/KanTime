import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Taskboard } from './components/taskboard/taskboard';
import { WorkdayCalendar } from './components/workday-calendar/workday-calendar';

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
        path: 'workday-calendar',
        component: WorkdayCalendar,
    },
];
