import React, { useEffect, useState } from 'react';
import { Layout, Typography, Card, Space, Divider, Button, Tag, Progress, Row, Col } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { useTimer } from './hooks/useTimer';
import { FocusModal } from './components/FocusModal';
import { SettingsPage } from './components/SettingsPage';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

type Page = 'timer' | 'settings';

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

  const [currentPage, setCurrentPage] = useState<Page>('timer');
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [currentFocusTask, setCurrentFocusTask] = useState('');

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const getModeText = (mode: string): string => {
    switch (mode) {
      case 'work':
        return 'Work';
      case 'short-break':
        return 'Short Break';
      case 'long-break':
        return 'Long Break';
      default:
        return 'Work';
    }
  };

  const handleStartClick = () => {
    // Only show focus modal if timer is not running and current mode is work
    if (!state.isRunning) {
      if (state.currentMode === 'work') {
        console.log('Opening focus modal for work session');
        setShowFocusModal(true);
      } else {
        // For breaks, start timer directly without focus modal
        console.log('Starting break session directly');
        startTimer();
      }
    }
  };

  const handleFocusStart = (focusTask: string) => {
    setCurrentFocusTask(focusTask);
    setShowFocusModal(false);
    startTimer();
  };

  const handleTimerReset = () => {
    setCurrentFocusTask('');
    setShowFocusModal(false); // Ensure modal is closed on reset
    resetTimer();
  };

  // Clear focus task when switching to break modes
  const handleModeSwitch = (mode: string) => {
    if (mode !== 'work') {
      setCurrentFocusTask(''); // Clear focus task for breaks
    }
    switchMode(mode as any);
  };

  const handleModalClose = () => {
    setShowFocusModal(false);
  };

  const handleSettingsSave = (newSettings: any) => {
    updateSettings(newSettings);
    setCurrentPage('timer');
  };

  const handleSettingsCancel = () => {
    setCurrentPage('timer');
  };

  const progressPercentage = ((getTotalTimeForMode(state.currentMode) - state.timeLeft) / getTotalTimeForMode(state.currentMode)) * 100;

  const renderTimerPage = () => (
    <div className="timer-card">
      {/* Mode Selector - now above timer */}
      <div className="mode-selector mode-tabs">
        <Space size="middle">
          <Button
            type={state.currentMode === 'work' ? 'primary' : 'default'}
            size="large"
            className="mode-tab"
            onClick={() => handleModeSwitch('work')}
          >
            Pomodoro
          </Button>
          <Button
            type={state.currentMode === 'short-break' ? 'primary' : 'default'}
            size="large"
            className="mode-tab"
            onClick={() => handleModeSwitch('short-break')}
          >
            Short Break
          </Button>
          <Button
            type={state.currentMode === 'long-break' ? 'primary' : 'default'}
            size="large"
            className="mode-tab"
            onClick={() => handleModeSwitch('long-break')}
          >
            Long Break
          </Button>
        </Space>
      </div>

      {/* Timer Display */}
      <div className="timer-display">
        <Title level={1} className="time-display focus-style">
          {formatTime(state.timeLeft)}
        </Title>
      </div>

      {/* Current Focus Task - Only show during work sessions */}
      {currentFocusTask && state.currentMode === 'work' && (
        <Card 
          size="small" 
          className="focus-task-card"
          style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        >
          <Text strong style={{ color: 'white', display: 'block', marginBottom: 8 }}>
            Current Focus:
          </Text>
          <Text style={{ color: 'white', fontSize: '16px' }}>
            {currentFocusTask}
          </Text>
        </Card>
      )}

      {/* Controls - show only START if not running, else show Pause/Reset */}
      <div className="controls" style={{ textAlign: 'center', marginBottom: 24 }}>
        {!state.isRunning ? (
          <Button
            type="primary"
            size="large"
            className="start-btn"
            style={{ fontSize: 28, height: 64, width: 200, fontWeight: 700, letterSpacing: 2 }}
            onClick={handleStartClick}
          >
            START
          </Button>
        ) : (
          <Space size="large">
            <Button
              size="large"
              icon={<PauseCircleOutlined />}
              onClick={pauseTimer}
            >
              Pause
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleTimerReset}
            >
              Reset
            </Button>
          </Space>
        )}
      </div>

      <Divider />

      {/* Session Tracker */}
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
    </div>
  );

  const renderSettingsPage = () => (
    <Content className="app-content">
      <SettingsPage
        settings={settings}
        onSave={handleSettingsSave}
        onCancel={handleSettingsCancel}
      />
    </Content>
  );

  return (
    <div className="app-root">
      <div className="app-header">
        <div className="header-title-row">
          <Title level={2} style={{ color: 'white', margin: 0, textAlign: 'center', display: 'inline-block' }}>
            Pomodoro Timer
          </Title>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setCurrentPage('settings')}
            style={{ color: 'white', fontSize: '22px', marginLeft: 12, verticalAlign: 'middle' }}
            className="header-settings-btn"
          />
        </div>
        <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', textAlign: 'center', marginBottom: 8 }}>
          Stay focused, stay productive
        </Text>
      </div>
      <div className="timer-main">
        {currentPage === 'timer' ? renderTimerPage() : (
          <SettingsPage
            settings={settings}
            onSave={handleSettingsSave}
            onCancel={handleSettingsCancel}
          />
        )}
        <FocusModal
          isOpen={showFocusModal}
          onClose={handleModalClose}
          onStart={handleFocusStart}
        />
      </div>
    </div>
  );
};

export default App; 