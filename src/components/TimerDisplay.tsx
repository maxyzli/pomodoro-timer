import React from 'react';
import { TimerMode } from '../types';

interface TimerDisplayProps {
  timeLeft: number;
  currentMode: TimerMode;
  isComplete?: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ 
  timeLeft, 
  currentMode, 
  isComplete = false 
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSessionInfo = (mode: TimerMode): string => {
    switch (mode) {
      case 'work':
        return 'Work Time';
      case 'short-break':
        return 'Short Break';
      case 'long-break':
        return 'Long Break';
    }
  };

  return (
    <div className="timer-display">
      <div className={`time ${isComplete ? 'timer-complete' : ''}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="session-info">
        {getSessionInfo(currentMode)}
      </div>
    </div>
  );
}; 