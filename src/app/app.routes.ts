import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Taskboard } from './components/taskboard/taskboard';

export const routes: Routes = [
    {
        path: '',
        component: Dashboard,
    },
    {
        path: 'tasks',
        component: Taskboard,
    }
];
