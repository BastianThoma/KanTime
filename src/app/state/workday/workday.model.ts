export interface WorkdaySection {
  start: number; // Timestamp
  end: number | null; // Timestamp, null wenn noch aktiv
  type: 'work' | 'pause';
  taskId?: string; // Nur bei 'work'
}

export interface Workday {
  id?: string;
  date: string; // ISO Datum
  sections: WorkdaySection[];
  userId: string;
}

export interface WorkdayState {
  startedAt: number | null;
  endedAt: number | null;
  sections: WorkdaySection[];
}

export const initialWorkdayState: WorkdayState = {
  startedAt: null,
  endedAt: null,
  sections: []
};
