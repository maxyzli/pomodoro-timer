import React from 'react';
import { TimerSettings } from '../types';

interface SettingsProps {
  settings: TimerSettings;
  onSettingsChange: (newSettings: Partial<TimerSettings>) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleInputChange = (key: keyof TimerSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      onSettingsChange({ [key]: numValue });
    }
  };

  return (
    <div className="settings">
      <h3>Settings</h3>
      <div className="setting-group">
        <label htmlFor="work-time">Work Time (minutes):</label>
        <input
          type="number"
          id="work-time"
          value={settings.workTime}
          onChange={(e) => handleInputChange('workTime', e.target.value)}
          min="1"
          max="60"
        />
      </div>
      <div className="setting-group">
        <label htmlFor="short-break-time">Short Break (minutes):</label>
        <input
          type="number"
          id="short-break-time"
          value={settings.shortBreakTime}
          onChange={(e) => handleInputChange('shortBreakTime', e.target.value)}
          min="1"
          max="30"
        />
      </div>
      <div className="setting-group">
        <label htmlFor="long-break-time">Long Break (minutes):</label>
        <input
          type="number"
          id="long-break-time"
          value={settings.longBreakTime}
          onChange={(e) => handleInputChange('longBreakTime', e.target.value)}
          min="1"
          max="60"
        />
      </div>
      <div className="setting-group">
        <label htmlFor="sessions-before-long-break">Sessions before long break:</label>
        <input
          type="number"
          id="sessions-before-long-break"
          value={settings.sessionsBeforeLongBreak}
          onChange={(e) => handleInputChange('sessionsBeforeLongBreak', e.target.value)}
          min="1"
          max="10"
        />
      </div>
    </div>
  );
}; 