
export interface TimeSection {
  start: number;
  end: number | null;
  type: 'work' | 'pause';
  taskId?: string;
}

export interface TimeState {
  isWorking: boolean;
  isPaused: boolean;
  startTime: number | null;
  pauseTime: number | null;
  totalWorked: number; // in ms
  currentTaskId: string | null;
  sections: TimeSection[];
}

export const initialTimeState: TimeState = {
  isWorking: false,
  isPaused: false,
  startTime: null,
  pauseTime: null,
  totalWorked: 0,
  currentTaskId: null,
  sections: []
};
