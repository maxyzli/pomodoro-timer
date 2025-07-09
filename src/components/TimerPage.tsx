import React from 'react';
import { Space, Button, Divider, Progress, Typography } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { TimerState, TimerSettings } from '../types';
import {
  TimerContainer,
  ModeTabs,
  ModeTab,
  TimerDisplay,
  TimeText,
  StartButton,
  CurrentTask
} from '../styles/Timer.styles';

const { Title, Text } = Typography;

interface TimerPageProps {
  state: TimerState;
  settings: TimerSettings;
  currentFocusTask: string;
  onStartClick: () => void;
  onPauseTimer: () => void;
  onStartTimer: () => void;
  onResetTimer: () => void;
  onModeSwitch: (mode: string) => void;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getTotalTimeForMode = (mode: string, settings: TimerSettings): number => {
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

const getModeColor = (mode: string): string => {
  switch (mode) {
    case 'work':
      return '#1890ff';
    case 'short-break':
      return '#52c41a';
    case 'long-break':
      return '#722ed1';
    default:
      return '#1890ff';
  }
};

export const TimerPage: React.FC<TimerPageProps> = ({
  state,
  settings,
  currentFocusTask,
  onStartClick,
  onPauseTimer,
  onStartTimer,
  onResetTimer,
  onModeSwitch
}) => {
  const progressPercentage = ((getTotalTimeForMode(state.currentMode, settings) - state.timeLeft) / getTotalTimeForMode(state.currentMode, settings)) * 100;

  const isAtFullDuration = () => {
    return (
      (state.currentMode === 'work' && state.timeLeft === settings.workTime * 60) ||
      (state.currentMode === 'short-break' && state.timeLeft === settings.shortBreakTime * 60) ||
      (state.currentMode === 'long-break' && state.timeLeft === settings.longBreakTime * 60)
    );
  };

  return (
    <TimerContainer>
      <ModeTabs>
        <ModeTab
          active={state.currentMode === 'work'}
          onClick={() => onModeSwitch('work')}
          disabled={state.isRunning}
        >
          Pomodoro
        </ModeTab>
        <ModeTab
          active={state.currentMode === 'short-break'}
          onClick={() => onModeSwitch('short-break')}
          disabled={state.isRunning}
        >
          Short Break
        </ModeTab>
        <ModeTab
          active={state.currentMode === 'long-break'}
          onClick={() => onModeSwitch('long-break')}
          disabled={state.isRunning}
        >
          Long Break
        </ModeTab>
      </ModeTabs>
      
      <TimerDisplay>
        <TimeText>{formatTime(state.timeLeft)}</TimeText>
      </TimerDisplay>
      
      {state.currentMode === 'work' && currentFocusTask && (
        <CurrentTask>
          <span style={{ opacity: 0.8, fontWeight: 400, fontSize: '1rem' }}>Current Task:</span><br />
          {currentFocusTask}
        </CurrentTask>
      )}
      
      {!state.isRunning && isAtFullDuration() ? (
        <StartButton onClick={onStartClick}>START</StartButton>
      ) : (
        <Space size="large" style={{ margin: '32px 0 24px 0' }}>
          <Button 
            size="large" 
            icon={state.isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />} 
            onClick={state.isRunning ? onPauseTimer : onStartTimer}
          >
            {state.isRunning ? 'Pause' : 'Resume'}
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={onResetTimer}>
            Reset
          </Button>
        </Space>
      )}
      
      <Divider />
      
      <div className="session-tracker">
        <Title level={4}>Session Progress</Title>
        <Text>
          Completed: {state.completedSessions} / {state.totalSessions} sessions
        </Text>
        <Progress
          percent={progressPercentage}
          strokeColor={getModeColor(state.currentMode)}
          showInfo={false}
          style={{ marginTop: 16 }}
        />
      </div>
    </TimerContainer>
  );
};