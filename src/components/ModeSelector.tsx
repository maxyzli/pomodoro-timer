import React from 'react';
import { TimerMode } from '../types';

interface ModeSelectorProps {
  currentMode: TimerMode;
  onModeChange: (mode: TimerMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
}) => {
  const modes: Array<{ mode: TimerMode; label: string; time: number }> = [
    { mode: 'work', label: 'Work', time: 25 },
    { mode: 'short-break', label: 'Short Break', time: 5 },
    { mode: 'long-break', label: 'Long Break', time: 15 },
  ];

  return (
    <div className="mode-selector">
      {modes.map(({ mode, label, time }) => (
        <button
          key={mode}
          className={`mode-btn ${currentMode === mode ? 'active' : ''}`}
          onClick={() => onModeChange(mode)}
          data-mode={mode}
          data-time={time}
        >
          {label}
        </button>
      ))}
    </div>
  );
}; 