export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory = 'development' | 'design' | 'meeting' | 'documentation' | 'bug' | 'feature' | 'research' | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: TaskPriority;
  category: TaskCategory;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  totalTrackedTime: number; // in Sekunden
  estimatedTime?: number; // Geschätzte Zeit in Sekunden
  deadline?: number; // Timestamp (ms) für Deadline
  assignee?: string; // Optional: Zuständige Person
  order: number; // Reihenfolge innerhalb der Spalte
}
