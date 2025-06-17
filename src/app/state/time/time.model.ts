export interface TimeState {
  isWorking: boolean;
  isPaused: boolean;
  startTime: number | null;
  pauseTime: number | null;
  totalWorked: number; // in ms
  currentTaskId: string | null;
}

export const initialTimeState: TimeState = {
  isWorking: false,
  isPaused: false,
  startTime: null,
  pauseTime: null,
  totalWorked: 0,
  currentTaskId: null,
};
