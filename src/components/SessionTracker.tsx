import React from 'react';

interface SessionTrackerProps {
  completedSessions: number;
  totalSessions: number;
  currentMode: string;
  timeLeft: number;
  totalTime: number;
}

export const SessionTracker: React.FC<SessionTrackerProps> = ({
  completedSessions,
  totalSessions,
  currentMode,
  timeLeft,
  totalTime,
}) => {
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="session-tracker">
      <h3>Session Progress</h3>
      <div className="session-count">
        <span>{completedSessions}</span> / <span>{totalSessions}</span> sessions
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}; 