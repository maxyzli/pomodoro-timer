export type TimerMode = 'work' | 'short-break' | 'long-break';

export interface TimerSettings {
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  sessionsBeforeLongBreak: number;
}

export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  currentMode: TimerMode;
  completedSessions: number;
  totalSessions: number;
}

export interface TimerContextType {
  state: TimerState;
  settings: TimerSettings;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: TimerMode) => void;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
} 