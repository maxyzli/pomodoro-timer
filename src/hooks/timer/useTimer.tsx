/**
 * Production-grade timer hook with proper state management
 * Following Amazon SDE III standards
 */

import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { monitor } from '../../core/monitoring';
import { TimerMode, TimerSettings } from '../../types';
import { settingsRepository } from '../../repositories/settings.repository';
import { useAuth } from '../../contexts/auth/AuthContext';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  currentMode: TimerMode;
  completedSessions: number;
  totalSessions: number;
}

interface TimerContextValue {
  // Timer state
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  currentMode: TimerMode;
  completedSessions: number;
  totalSessions: number;
  
  // Settings
  settings: TimerSettings;
  settingsLoaded: boolean;
  
  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: TimerMode) => void;
  updateSettings: (settings: Partial<TimerSettings>) => Promise<void>;
  handlePostWorkSessionComplete: () => void;
  stopNotification: () => void;
}

enum TimerActionType {
  SET_TIME = 'SET_TIME',
  START = 'START',
  PAUSE = 'PAUSE',
  RESET = 'RESET',
  SWITCH_MODE = 'SWITCH_MODE',
  COMPLETE_SESSION = 'COMPLETE_SESSION',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  TICK = 'TICK',
}

type TimerAction =
  | { type: TimerActionType.SET_TIME; payload: number }
  | { type: TimerActionType.START }
  | { type: TimerActionType.PAUSE }
  | { type: TimerActionType.RESET }
  | { type: TimerActionType.SWITCH_MODE; payload: { mode: TimerMode; time: number } }
  | { type: TimerActionType.COMPLETE_SESSION; payload: { nextMode: TimerMode; nextTime: number } }
  | { type: TimerActionType.UPDATE_SETTINGS; payload: { totalSessions: number } }
  | { type: TimerActionType.TICK };

const DEFAULT_SETTINGS: TimerSettings = {
  workTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case TimerActionType.SET_TIME:
      return { ...state, timeLeft: action.payload };
    
    case TimerActionType.START:
      return { ...state, isRunning: true, isPaused: false };
    
    case TimerActionType.PAUSE:
      return { ...state, isRunning: false, isPaused: true };
    
    case TimerActionType.RESET:
      return { ...state, isRunning: false, isPaused: false };
    
    case TimerActionType.SWITCH_MODE:
      return {
        ...state,
        currentMode: action.payload.mode,
        timeLeft: action.payload.time,
        isRunning: false,
        isPaused: false,
      };
    
    case TimerActionType.COMPLETE_SESSION:
      return {
        ...state,
        currentMode: action.payload.nextMode,
        timeLeft: action.payload.nextTime,
        completedSessions: state.currentMode === 'work' ? state.completedSessions + 1 : state.completedSessions,
        isRunning: false,
        isPaused: false,
      };
    
    case TimerActionType.UPDATE_SETTINGS:
      return { ...state, totalSessions: action.payload.totalSessions };
    
    case TimerActionType.TICK:
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };
    
    default:
      return state;
  }
}

export const useTimer = (onWorkSessionComplete?: () => void): TimerContextValue => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  const initialState: TimerState = {
    timeLeft: settings.workTime * 60,
    isRunning: false,
    isPaused: false,
    currentMode: 'work',
    completedSessions: 0,
    totalSessions: settings.longBreakInterval,
  };
  
  const [state, dispatch] = useReducer(timerReducer, initialState);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getTimeForMode = useCallback((mode: TimerMode): number => {
    switch (mode) {
      case 'work':
        return settings.workTime * 60;
      case 'short-break':
        return settings.shortBreakTime * 60;
      case 'long-break':
        return settings.longBreakTime * 60;
    }
  }, [settings]);

  const playNotification = useCallback(() => {
    if (!settings.soundEnabled) return;

    const playSound = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const audioContext = audioContextRef.current;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        monitor.debug('Audio notification failed', { 
          module: 'useTimer',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    playSound();
    notificationRef.current = setInterval(playSound, 3000) as NodeJS.Timeout;
  }, [settings.soundEnabled]);

  const stopNotification = useCallback(() => {
    if (notificationRef.current) {
      clearInterval(notificationRef.current);
      notificationRef.current = null;
    }
  }, []);

  const showNotification = useCallback((mode: TimerMode) => {
    if (!settings.notificationsEnabled) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      const message = mode === 'work' 
        ? 'Work session completed! Take a break.' 
        : 'Break completed! Time to work.';
      
      new Notification('Pomodoro Timer', {
        body: message,
        icon: '/favicon.ico',
      });
    }
  }, [settings.notificationsEnabled]);

  const completeTimer = useCallback(() => {
    const shouldTakeLongBreak = (state.completedSessions + 1) % settings.longBreakInterval === 0;
    const nextMode = state.currentMode === 'work' 
      ? (shouldTakeLongBreak ? 'long-break' : 'short-break')
      : 'work';
    const nextTime = getTimeForMode(nextMode);

    playNotification();
    showNotification(state.currentMode);

    dispatch({
      type: TimerActionType.COMPLETE_SESSION,
      payload: { nextMode, nextTime },
    });

    monitor.info('Timer session completed', {
      module: 'useTimer',
      previousMode: state.currentMode,
      nextMode,
      completedSessions: state.completedSessions + (state.currentMode === 'work' ? 1 : 0),
    });

    if (state.currentMode === 'work' && onWorkSessionComplete) {
      onWorkSessionComplete();
    }
  }, [
    state.currentMode,
    state.completedSessions,
    settings.longBreakInterval,
    getTimeForMode,
    playNotification,
    showNotification,
    onWorkSessionComplete,
  ]);

  const tick = useCallback(() => {
    dispatch({ type: TimerActionType.TICK });
  }, []);

  useEffect(() => {
    if (state.timeLeft === 0 && state.isRunning) {
      completeTimer();
    }
  }, [state.timeLeft, state.isRunning, completeTimer]);

  const startTimer = useCallback(() => {
    if (state.isRunning) return;

    dispatch({ type: TimerActionType.START });
    
    timerRef.current = setInterval(tick, 1000) as NodeJS.Timeout;
    
    monitor.info('Timer started', {
      module: 'useTimer',
      mode: state.currentMode,
      timeLeft: state.timeLeft,
    });
  }, [state.isRunning, state.currentMode, state.timeLeft, tick]);

  const pauseTimer = useCallback(() => {
    if (!state.isRunning) return;

    dispatch({ type: TimerActionType.PAUSE });
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    monitor.info('Timer paused', {
      module: 'useTimer',
      mode: state.currentMode,
      timeLeft: state.timeLeft,
    });
  }, [state.isRunning, state.currentMode, state.timeLeft]);

  const resetTimer = useCallback(() => {
    dispatch({ type: TimerActionType.RESET });
    dispatch({ type: TimerActionType.SET_TIME, payload: getTimeForMode(state.currentMode) });
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    monitor.info('Timer reset', {
      module: 'useTimer',
      mode: state.currentMode,
    });
  }, [state.currentMode, getTimeForMode]);

  const switchMode = useCallback((mode: TimerMode) => {
    dispatch({
      type: TimerActionType.SWITCH_MODE,
      payload: { mode, time: getTimeForMode(mode) },
    });
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    monitor.info('Timer mode switched', {
      module: 'useTimer',
      newMode: mode,
    });
  }, [getTimeForMode]);

  const updateSettings = useCallback(async (newSettings: Partial<TimerSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (user?.id) {
      try {
        await settingsRepository.saveForUser(user.id, updatedSettings);
        
        monitor.info('Timer settings updated', {
          module: 'useTimer',
          updates: Object.keys(newSettings),
        });
      } catch (error) {
        monitor.error('Failed to save timer settings', error, {
          module: 'useTimer',
        });
      }
    }
    
    dispatch({
      type: TimerActionType.UPDATE_SETTINGS,
      payload: { totalSessions: updatedSettings.longBreakInterval },
    });
    
    if (!state.isPaused && !state.isRunning) {
      dispatch({ type: TimerActionType.SET_TIME, payload: getTimeForMode(state.currentMode) });
    }
  }, [settings, user?.id, state.isPaused, state.isRunning, state.currentMode, getTimeForMode]);

  const handlePostWorkSessionComplete = useCallback(() => {
    if (settings.autoStartBreaks) {
      setTimeout(() => startTimer(), 1000);
    }
  }, [settings.autoStartBreaks, startTimer]);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) {
        setSettingsLoaded(true);
        return;
      }

      try {
        const savedSettings = await settingsRepository.findByUserId(user.id);
        if (savedSettings) {
          setSettings(savedSettings);
          dispatch({
            type: TimerActionType.UPDATE_SETTINGS,
            payload: { totalSessions: savedSettings.longBreakInterval },
          });
          dispatch({ type: TimerActionType.SET_TIME, payload: savedSettings.workTime * 60 });
        }
      } catch (error) {
        monitor.error('Failed to load timer settings', error, {
          module: 'useTimer',
        });
      } finally {
        setSettingsLoaded(true);
      }
    };
    
    loadSettings();
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (notificationRef.current) {
        clearInterval(notificationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    timeLeft: state.timeLeft,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    currentMode: state.currentMode,
    completedSessions: state.completedSessions,
    totalSessions: state.totalSessions,
    settings,
    settingsLoaded,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    updateSettings,
    handlePostWorkSessionComplete,
    stopNotification,
  };
};