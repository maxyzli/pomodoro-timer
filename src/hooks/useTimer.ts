import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerMode, TimerSettings, TimerState } from '../types';

const DEFAULT_SETTINGS: TimerSettings = {
  workTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  sessionsBeforeLongBreak: 4,
};

const loadSettings = (): TimerSettings => {
  const saved = localStorage.getItem('pomodoroSettings');
  if (saved) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
  return DEFAULT_SETTINGS;
};

const saveSettings = (settings: TimerSettings) => {
  localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
};

export const useTimer = () => {
  const [settings, setSettings] = useState<TimerSettings>(loadSettings);
  const [state, setState] = useState<TimerState>({
    timeLeft: settings.workTime * 60,
    isRunning: false,
    currentMode: 'work',
    completedSessions: 0,
    totalSessions: settings.sessionsBeforeLongBreak,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      console.log('Audio notification failed:', error);
    }
  }, []);

  const showNotification = useCallback((mode: TimerMode) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const message = mode === 'work' 
        ? 'Work session completed! Take a break.' 
        : 'Break completed! Time to work.';
      
      new Notification('Pomodoro Timer', {
        body: message,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
      });
    }
  }, []);

  const completeTimer = useCallback(() => {
    playNotification();
    showNotification(state.currentMode);

    if (state.currentMode === 'work') {
      const newCompletedSessions = state.completedSessions + 1;
      const shouldTakeLongBreak = newCompletedSessions % settings.sessionsBeforeLongBreak === 0;
      
      setState(prev => ({
        ...prev,
        completedSessions: newCompletedSessions,
        currentMode: shouldTakeLongBreak ? 'long-break' : 'short-break',
        timeLeft: getTimeForMode(shouldTakeLongBreak ? 'long-break' : 'short-break'),
      }));
    } else {
      setState(prev => ({
        ...prev,
        currentMode: 'work',
        timeLeft: getTimeForMode('work'),
      }));
    }
  }, [state.currentMode, state.completedSessions, settings.sessionsBeforeLongBreak, getTimeForMode, playNotification, showNotification]);

  const startTimer = useCallback(() => {
    if (state.isRunning) return;

    setState(prev => ({ ...prev, isRunning: true }));

    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTimeLeft = prev.timeLeft - 1;
        
        if (newTimeLeft <= 0) {
          completeTimer();
          return prev;
        }
        
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);
  }, [state.isRunning, completeTimer]);

  const pauseTimer = useCallback(() => {
    if (!state.isRunning) return;

    setState(prev => ({ ...prev, isRunning: false }));
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [state.isRunning]);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setState(prev => ({
      ...prev,
      timeLeft: getTimeForMode(prev.currentMode),
    }));
  }, [pauseTimer, getTimeForMode]);

  const switchMode = useCallback((mode: TimerMode) => {
    pauseTimer();
    setState(prev => ({
      ...prev,
      currentMode: mode,
      timeLeft: getTimeForMode(mode),
    }));
  }, [pauseTimer, getTimeForMode]);

  const updateSettings = useCallback((newSettings: Partial<TimerSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    
    setState(prev => ({
      ...prev,
      totalSessions: updatedSettings.sessionsBeforeLongBreak,
      timeLeft: getTimeForMode(prev.currentMode),
    }));
  }, [settings, getTimeForMode]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update timeLeft when settings change
  useEffect(() => {
    if (!state.isRunning) {
      setState(prev => ({
        ...prev,
        timeLeft: getTimeForMode(prev.currentMode),
      }));
    }
  }, [settings, getTimeForMode, state.isRunning]);

  return {
    state,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    updateSettings,
  };
}; 