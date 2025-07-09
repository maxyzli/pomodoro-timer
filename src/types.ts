export type TimerMode = 'work' | 'short-break' | 'long-break';

export interface TimerSettings {
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
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