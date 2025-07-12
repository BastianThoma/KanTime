import { Component, NgModule, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import { Task } from '../../state/task/task.model';
import * as TaskActions from '../../state/task/task.actions';
import { selectTasksByStatus } from '../../state/task/task.selectors';
import { TaskService } from '../../state/task/task.service';

@Component({
  selector: 'app-taskboard',
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './taskboard.html',
  styleUrl: './taskboard.scss',
})
export class Taskboard {
  private store = inject(Store);
  private taskService = inject(TaskService);
  dropListIds = ['todoList', 'inProgressList', 'doneList'];

  newTitle = '';
  newDescription = '';

  todoTasks$ = this.store.select(selectTasksByStatus('todo'));
  inProgressTasks$ = this.store.select(selectTasksByStatus('in-progress'));
  doneTasks$ = this.store.select(selectTasksByStatus('done'));


  constructor() {
    this.store.dispatch(TaskActions.loadTasks());
  }
  async deleteTask(id: string) {
    await this.taskService.deleteTask(id);
    this.store.dispatch(TaskActions.loadTasks());
  }

  async addTask() {
    if (!this.newTitle.trim()) return;

    // Task mit temporärer ID anlegen, Firestore generiert später die echte ID
    const newTask: Omit<Task, 'id'> = {
      title: this.newTitle,
      description: this.newDescription,
      status: 'todo',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTrackedTime: 0,
    };

    // TaskService direkt nutzen, da die ID erst nach Firestore-Insert bekannt ist
    await this.taskService.addTask(newTask);

    // Tasks neu laden, damit die ID im State ist
    this.store.dispatch(TaskActions.loadTasks());
    this.newTitle = '';
    this.newDescription = '';
  }

  onDrop(event: any, newStatus: 'todo' | 'in-progress' | 'done') {
    const taskId =
      event.item.element.nativeElement.getAttribute('data-task-id');
    if (taskId) {
      this.store.dispatch(
        TaskActions.moveTask({ id: taskId, status: newStatus })
      );
    }
  }
}
