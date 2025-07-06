import { Component, NgModule, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Task } from '../../state/task/task.model';
import { addTask } from '../../state/task/task.actions';
import { v4 as uuid } from 'uuid';
import { selectTasksByStatus } from '../../state/task/task.selectors';

@Component({
  selector: 'app-taskboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './taskboard.html',
  styleUrl: './taskboard.scss',
})

export class Taskboard {
  private store = inject(Store);

  newTitle = '';
  todoTasks$ = this.store.select(selectTasksByStatus('todo'));

  addTask() {
    if (!this.newTitle.trim()) return;

    const task: Task = {
      id: uuid(),
      title: this.newTitle,
      status: 'todo',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTrackedTime: 0,
    };

    this.store.dispatch(addTask({ task }));
    this.newTitle = '';
  }
}
