import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Task } from './task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private taskCollection;

  constructor(private firestore: Firestore) {
    this.taskCollection = collection(this.firestore, 'tasks');
  }

  getTasks(): Observable<Task[]> {
    return collectionData(this.taskCollection, { idField: 'id' }) as Observable<
      Task[]
    >;
  }

  addTask(task: Omit<Task, 'id'>) {
    return addDoc(this.taskCollection, task);
  }

  deleteTask(id: string) {
    return deleteDoc(doc(this.taskCollection.firestore, 'tasks', id));
  }

  updateTask(id: string, changes: Partial<Task>) {
    return updateDoc(doc(this.taskCollection.firestore, 'tasks', id), changes);
  }
}
