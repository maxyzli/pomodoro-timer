import React, { useEffect, useState } from 'react';
import { useTimer } from './hooks/useTimer';
import { TimerDisplay } from './components/TimerDisplay';
import { TimerControls } from './components/TimerControls';
import { ModeSelector } from './components/ModeSelector';
import { SessionTracker } from './components/SessionTracker';
import { Settings } from './components/Settings';
import './App.css';

const App: React.FC = () => {
  const {
    state,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    updateSettings,
  } = useTimer();

  const [showSettings, setShowSettings] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getTotalTimeForMode = (mode: string): number => {
    switch (mode) {
      case 'work':
        return settings.workTime * 60;
      case 'short-break':
        return settings.shortBreakTime * 60;
      case 'long-break':
        return settings.longBreakTime * 60;
      default:
        return settings.workTime * 60;
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Pomodoro Timer</h1>
        <p className="subtitle">Stay focused, stay productive</p>
      </header>

      <div className="timer-container">
        <TimerDisplay
          timeLeft={state.timeLeft}
          currentMode={state.currentMode}
        />

        <TimerControls
          isRunning={state.isRunning}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
        />

        <ModeSelector
          currentMode={state.currentMode}
          onModeChange={switchMode}
        />
      </div>

      <SessionTracker
        completedSessions={state.completedSessions}
        totalSessions={state.totalSessions}
        currentMode={state.currentMode}
        timeLeft={state.timeLeft}
        totalTime={getTotalTimeForMode(state.currentMode)}
      />

      <div className="settings-toggle">
        <button 
          className="btn btn-secondary settings-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </button>
      </div>

      {showSettings && (
        <Settings
          settings={settings}
          onSettingsChange={updateSettings}
        />
      )}
    </div>
  );
};

export default App; 