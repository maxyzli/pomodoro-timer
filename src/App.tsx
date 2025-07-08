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
    <Content className="app-content">
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12}>
          <Card className="timer-card">
            {/* Timer Display */}
            <div className="timer-display">
              <Title level={1} className="time-display">
                {formatTime(state.timeLeft)}
              </Title>
              <Tag color={getModeColor(state.currentMode)}>
                {getModeText(state.currentMode)}
              </Tag>
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

            {/* Controls */}
            <Space size="middle" className="controls">
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartClick}
                disabled={state.isRunning}
              >
                {state.isRunning ? 'Running' : state.currentMode === 'work' ? 'Start Work' : 'Start Break'}
              </Button>
              <Button
                size="large"
                icon={<PauseCircleOutlined />}
                onClick={pauseTimer}
                disabled={!state.isRunning}
              >
                Pause
              </Button>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={handleTimerReset}
                disabled={state.isRunning}
              >
                Reset
              </Button>
            </Space>

            {/* Mode Selector */}
            <div className="mode-selector">
              <Space size="small">
                <Button
                  type={state.currentMode === 'work' ? 'primary' : 'default'}
                  onClick={() => handleModeSwitch('work')}
                >
                  Work
                </Button>
                <Button
                  type={state.currentMode === 'short-break' ? 'primary' : 'default'}
                  onClick={() => handleModeSwitch('short-break')}
                >
                  Short Break
                </Button>
                <Button
                  type={state.currentMode === 'long-break' ? 'primary' : 'default'}
                  onClick={() => handleModeSwitch('long-break')}
                >
                  Long Break
                </Button>
              </Space>
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
          </Card>
        </Col>
      </Row>
    </Content>
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
    <Layout className="app-layout">
      <Header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Pomodoro Timer
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              Stay focused, stay productive
            </Text>
          </div>
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setCurrentPage('settings')}
            style={{ color: 'white', fontSize: '18px' }}
          />
        </div>
      </Header>

      {currentPage === 'timer' ? renderTimerPage() : renderSettingsPage()}

      <FocusModal
        isOpen={showFocusModal}
        onClose={handleModalClose}
        onStart={handleFocusStart}
      />
    </Layout>
  );
};

export default App; 