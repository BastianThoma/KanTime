import { Component, NgModule, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { Task, TaskPriority, TaskCategory } from '../../state/task/task.model';
import * as TaskActions from '../../state/task/task.actions';
import { selectTasksByStatus } from '../../state/task/task.selectors';
import { TaskService } from '../../state/task/task.service';

/**
 * Enhanced Taskboard Component mit Kanban-Board Layout
 * Features: Drag & Drop, Prioritäten, Kategorien, Tags, Filter
 */
@Component({
  selector: 'app-taskboard',
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './taskboard.html',
  styleUrl: './taskboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Taskboard implements OnInit {
  private store = inject(Store);
  private taskService = inject(TaskService);
  
  dropListIds = ['todoList', 'inProgressList', 'doneList'];

  // New Task Form
  newTitle = '';
  newDescription = '';
  newDeadline: string = '';
  newPriority: TaskPriority = 'medium';
  newCategory: TaskCategory = 'development';
  newTags: string = '';
  newEstimatedTime: number | null = null;
  newAssignee: string = '';

  // Filter & Search
  searchTerm = '';
  filterPriority: TaskPriority | 'all' = 'all';
  filterCategory: TaskCategory | 'all' = 'all';
  showCompletedTasks = true;
  
  // Sortierung
  sortBy: 'order' | 'priority' | 'deadline' | 'created' = 'order';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Task Lists mit dynamischer Sortierung
  todoTasks$ = this.store.select(selectTasksByStatus('todo')).pipe(
    map(tasks => this.sortTasks(tasks))
  );
  inProgressTasks$ = this.store.select(selectTasksByStatus('in-progress')).pipe(
    map(tasks => this.sortTasks(tasks))
  );
  doneTasks$ = this.store.select(selectTasksByStatus('done')).pipe(
    map(tasks => this.sortTasks(tasks))
  );

  // Static Data
  priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
  categories: TaskCategory[] = ['development', 'design', 'meeting', 'documentation', 'bug', 'feature', 'research', 'other'];

  // Modal State
  selectedTask: Task | null = null;
  showTaskModal = false;
  showAddTaskForm = false;

  ngOnInit() {
    this.store.dispatch(TaskActions.loadTasks());
  }

  /**
   * Fügt eine neue Task hinzu
   */
  async addTask() {
    if (!this.newTitle.trim()) return;

    let deadlineTs: number | undefined = undefined;
    if (this.newDeadline) {
      deadlineTs = new Date(this.newDeadline).getTime();
    }

    const tags = this.newTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Höchste order-Nummer in der Todo-Spalte finden für neue Task
    const todoTasks = await this.store.select(selectTasksByStatus('todo')).pipe(
      take(1)
    ).toPromise() || [];
    const maxOrder = todoTasks.length > 0 ? Math.max(...todoTasks.map((t: Task) => t.order || 0)) : 0;

    const newTask: Omit<Task, 'id'> = {
      title: this.newTitle,
      description: this.newDescription || undefined,
      status: 'todo',
      priority: this.newPriority,
      category: this.newCategory,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalTrackedTime: 0,
      estimatedTime: this.newEstimatedTime ? this.newEstimatedTime * 3600 : undefined, // Stunden in Sekunden
      deadline: deadlineTs,
      assignee: this.newAssignee || undefined,
      order: maxOrder + 1, // Neue Task am Ende der Liste
    };

    await this.taskService.addTask(newTask);
    this.store.dispatch(TaskActions.loadTasks());
    this.resetForm();
  }

  /**
   * Löscht eine Task
   */
  async deleteTask(id: string) {
    if (confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
      await this.taskService.deleteTask(id);
      this.store.dispatch(TaskActions.loadTasks());
    }
  }

  /**
   * Drag & Drop Handler mit Reihenfolgen-Update
   */
  async onDrop(event: CdkDragDrop<Task[]>, newStatus: 'todo' | 'in-progress' | 'done') {
    const taskId = event.item.data?.id || event.item.element.nativeElement.getAttribute('data-task-id');
    
    if (taskId) {
      // Schritt 1: Status und Order der bewegten Task zusammen updaten
      await this.taskService.updateTask(taskId, { 
        status: newStatus,
        order: event.currentIndex,
        updatedAt: Date.now()
      });
      
      // Schritt 2: Andere Tasks in der Zielspalte entsprechend anpassen
      await this.reorderOtherTasks(newStatus, event.currentIndex, taskId);
      
      // Schritt 3: Store refreshen (erst nach allen Updates)
      this.store.dispatch(TaskActions.loadTasks());
    }
  }

  /**
   * Passt die Reihenfolge der anderen Tasks in der Spalte an
   */
  private async reorderOtherTasks(status: string, insertIndex: number, excludeTaskId: string) {
    const tasks = await this.store.select(selectTasksByStatus(status)).pipe(take(1)).toPromise() || [];
    
    // Alle Tasks außer der bewegten, sortiert nach aktueller Order
    const otherTasks = tasks
      .filter(t => t.id !== excludeTaskId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Batch-Update: Alle Tasks die ihre Position ändern müssen
    const updates: Promise<void>[] = [];
    
    otherTasks.forEach((task, index) => {
      const newOrder = index >= insertIndex ? index + 1 : index;
      if ((task.order || 0) !== newOrder) {
        updates.push(this.taskService.updateTask(task.id, { order: newOrder }));
      }
    });
    
    // Alle Order-Updates parallel ausführen
    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }

  /**
   * Öffnet Task-Details Modal
   */
  openTaskDetails(task: Task) {
    this.selectedTask = { ...task };
    this.showTaskModal = true;
  }

  /**
   * Schließt Task-Details Modal
   */
  closeTaskModal() {
    this.showTaskModal = false;
    this.selectedTask = null;
  }

  /**
   * Speichert Task-Änderungen
   */
  async saveTask() {
    if (this.selectedTask) {
      const changes = { ...this.selectedTask };
      changes.updatedAt = Date.now();
      await this.taskService.updateTask(this.selectedTask.id, changes);
      this.store.dispatch(TaskActions.loadTasks());
      this.closeTaskModal();
    }
  }

  /**
   * Aktualisiert Task Tags vom Input
   */
  updateTaskTags(event: Event): void {
    if (!this.selectedTask) return;
    
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.selectedTask.tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  /**
   * Setzt das Formular zurück
   */
  resetForm() {
    this.newTitle = '';
    this.newDescription = '';
    this.newDeadline = '';
    this.newPriority = 'medium';
    this.newCategory = 'development';
    this.newTags = '';
    this.newEstimatedTime = null;
    this.newAssignee = '';
    this.showAddTaskForm = false;
  }

  /**
   * Formatiert Zeit von Sekunden zu lesbarem Format
   */
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * Gibt die Prioritäts-Farbe zurück
   */
  getPriorityColor(priority: TaskPriority): string {
    const colors = {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority];
  }

  /**
   * Sortiert Tasks basierend auf der gewählten Sortierung
   */
  private sortTasks(tasks: Task[]): Task[] {
    if (!tasks) return [];
    
    const sorted = [...tasks].sort((a, b) => {
      switch (this.sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
          
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline - b.deadline;
          
        case 'created':
          return this.sortOrder === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
          
        default: // 'order'
          return (a.order || 0) - (b.order || 0);
      }
    });
    
    return this.sortOrder === 'desc' && this.sortBy !== 'priority' && this.sortBy !== 'deadline' ? sorted.reverse() : sorted;
  }

  /**
   * Gibt die Kategorie-Farbe zurück
   */
  getCategoryColor(category: TaskCategory): string {
    const colors = {
      development: '#00bb95',
      design: '#8b5cf6',
      meeting: '#06b6d4',
      documentation: '#84cc16',
      bug: '#ef4444',
      feature: '#10b981',
      research: '#f59e0b',
      other: '#6b7280'
    };
    return colors[category];
  }

  /**
   * Prüft ob eine Task überfällig ist
   */
  isOverdue(task: Task): boolean {
    return task.deadline ? task.deadline < Date.now() : false;
  }

  /**
   * Berechnet Fortschritt basierend auf geschätzter Zeit
   */
  getProgress(task: Task): number {
    if (!task.estimatedTime) return 0;
    return Math.min((task.totalTrackedTime / task.estimatedTime) * 100, 100);
  }

  /**
   * Toggle für Add Task Form
   */
  toggleAddTaskForm() {
    this.showAddTaskForm = !this.showAddTaskForm;
    if (!this.showAddTaskForm) {
      this.resetForm();
    }
  }
}
