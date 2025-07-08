import React from 'react';

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset,
}) => {
  return (
    <div className="controls">
      <button 
        className="btn btn-primary" 
        onClick={onStart}
        disabled={isRunning}
      >
        Start
      </button>
      <button 
        className="btn btn-secondary" 
        onClick={onPause}
        disabled={!isRunning}
      >
        Pause
      </button>
      <button 
        className="btn btn-secondary" 
        onClick={onReset}
      >
        Reset
      </button>
    </div>
  );
}; 