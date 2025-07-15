import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerMode, TimerSettings, TimerState } from '../types';
import { supabaseService } from '../services/supabaseService';

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


export const useTimer = (onWorkSessionComplete?: () => void) => {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [state, setState] = useState<TimerState>({
    timeLeft: settings.workTime * 60,
    isRunning: false,
    isPaused: false,
    currentMode: 'work',
    completedSessions: 0,
    totalSessions: settings.longBreakInterval,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    };

    // Play sound immediately
    playSound();
    
    // Start repeating the sound every 3 seconds
    notificationIntervalRef.current = setInterval(playSound, 3000) as NodeJS.Timeout;
  }, [settings.soundEnabled]);

  const stopNotification = useCallback(() => {
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
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
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
      });
    }
  }, [settings.notificationsEnabled]);

  const completeTimer = useCallback(() => {
    playNotification();
    showNotification(state.currentMode);

    if (state.currentMode === 'work') {
      const newCompletedSessions = state.completedSessions + 1;
      const shouldTakeLongBreak = newCompletedSessions % settings.longBreakInterval === 0;
      
      setState(prev => ({
        ...prev,
        completedSessions: newCompletedSessions,
        currentMode: shouldTakeLongBreak ? 'long-break' : 'short-break',
        timeLeft: getTimeForMode(shouldTakeLongBreak ? 'long-break' : 'short-break'),
        isRunning: false,
        isPaused: false,
      }));

      // Trigger artifact modal callback
      if (onWorkSessionComplete) {
        onWorkSessionComplete();
      }

      // Don't auto-start break here - let the artifact modal completion handle it
    } else {
      setState(prev => ({
        ...prev,
        currentMode: 'work',
        timeLeft: getTimeForMode('work'),
        isRunning: false,
        isPaused: false,
      }));

      // Auto-start pomodoro if enabled
      if (settings.autoStartPomodoros) {
        setTimeout(() => {
          setState(prev => ({ ...prev, isRunning: true }));
        }, 1000) as NodeJS.Timeout;
      }
    }
  }, [state.currentMode, state.completedSessions, settings.longBreakInterval, settings.autoStartBreaks, settings.autoStartPomodoros, getTimeForMode, playNotification, showNotification, onWorkSessionComplete]);

  const startTimer = useCallback(() => {
    if (state.isRunning) return;

    setState(prev => ({ ...prev, isRunning: true, isPaused: false }));

    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTimeLeft = prev.timeLeft - 1;
        
        if (newTimeLeft <= 0) {
          // Clear the interval before calling completeTimer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          completeTimer();
          return { ...prev, isRunning: false, isPaused: false };
        }
        
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000) as NodeJS.Timeout;
  }, [state.isRunning, completeTimer]);

  const pauseTimer = useCallback(() => {
    if (!state.isRunning) return;

    setState(prev => ({ ...prev, isRunning: false, isPaused: true }));
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [state.isRunning]);

  const resetTimer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      timeLeft: getTimeForMode(prev.currentMode),
    }));
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [getTimeForMode]);

  const switchMode = useCallback((mode: TimerMode) => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      currentMode: mode,
      timeLeft: getTimeForMode(mode),
    }));
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [getTimeForMode]);

  const updateSettings = useCallback(async (newSettings: Partial<TimerSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      await supabaseService.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    
    setState(prev => ({
      ...prev,
      totalSessions: updatedSettings.longBreakInterval,
      timeLeft: prev.isPaused ? prev.timeLeft : getTimeForMode(prev.currentMode),
    }));
  }, [settings, getTimeForMode]);

  // Load settings from Supabase on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await supabaseService.initialize();
        const savedSettings = await supabaseService.getSettings();
        if (savedSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setSettingsLoaded(true);
      }
    };
    
    loadSettings();
  }, []);

  // Cleanup timer and notification on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, []);

  // Update timeLeft when settings change (but not when paused)
  useEffect(() => {
    if (settingsLoaded && !state.isRunning && !state.isPaused) {
      setState(prev => ({
        ...prev,
        timeLeft: getTimeForMode(prev.currentMode),
      }));
    }
  }, [settings, getTimeForMode, state.isRunning, state.isPaused, settingsLoaded]);

  const handlePostWorkSessionComplete = useCallback(() => {
    // Auto-start break if enabled (called after artifact modal is closed)
    if (settings.autoStartBreaks) {
      setTimeout(() => {
        setState(prev => ({ ...prev, isRunning: true }));
      }, 1000);
    }
  }, [settings.autoStartBreaks]);

  return {
    state,
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