export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  createdAt: number;
  updatedAt: number;
  totalTrackedTime: number; // in Sekunden
  deadline?: number; // Timestamp (ms) für Deadline
}
