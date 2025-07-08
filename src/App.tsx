import React, { useEffect, useState } from 'react';
import { Layout, Typography, Card, Space, Divider, Button, Tag, Progress, Row, Col, Modal, Input, List, Popconfirm, Checkbox, Tooltip, Menu } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, SettingOutlined, DeleteOutlined, BarChartOutlined, PlusOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UnorderedListOutlined, ClockCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTimer } from './hooks/useTimer';
import { FocusModal } from './components/FocusModal';
import { SettingsPage } from './components/SettingsPage';
import styled, { createGlobalStyle } from 'styled-components';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Sider } = Layout;

type Page = 'timer' | 'settings' | 'todo' | 'stats';

const ARTIFACTS_KEY = 'pomodoroArtifacts';
const TODOS_KEY = 'pomodoroTodos';

const NAV_ITEMS = [
  { key: 'timer', icon: <ClockCircleOutlined />, label: 'Timer' },
  { key: 'todo', icon: <UnorderedListOutlined />, label: 'Todo' },
  { key: 'stats', icon: <BarChartOutlined />, label: 'Stats' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
];

const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #b04a4a;
    min-height: 100vh;
    color: #333;
  }
`;

const AppLayout = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: #b04a4a;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AppHeader = styled.header`
  width: 100%;
  background: transparent;
  box-shadow: none;
  border: none;
  padding: 32px 0 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const NavBar = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px 0 0 0;
  width: 100%;
`;

const NavTab = styled.div<{ active?: boolean }>`
  background: ${({ active }) => (active ? '#fff' : 'transparent')};
  color: ${({ active }) => (active ? '#b04a4a' : '#fff')};
  border-radius: 20px;
  margin: 0 4px;
  padding: 0 18px;
  font-weight: ${({ active }) => (active ? 900 : 700)};
  box-shadow: ${({ active }) => (active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none')};
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  height: 40px;
`;

// Styled-components for timer page
const TimerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32px;
`;

const ModeTabs = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  gap: 16px;
`;

const ModeTab = styled.button<{ active?: boolean }>`
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 10px 32px;
  border-radius: 24px;
  background: ${({ active }) => (active ? '#fff' : 'transparent')};
  color: ${({ active }) => (active ? '#b04a4a' : '#fff')};
  border: 2px solid #fff;
  transition: background 0.2s, color 0.2s;
  box-shadow: ${({ active }) => (active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none')};
  cursor: pointer;
  outline: none;
  margin: 0 4px;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TimerDisplay = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const TimeText = styled.div`
  font-size: 6rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 16px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.10);
  white-space: nowrap;
  line-height: 1;
`;

const StartButton = styled.button`
  background: #fff;
  color: #b04a4a;
  border: none;
  font-size: 2rem;
  font-weight: 900;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  transition: background 0.2s;
  width: 240px;
  height: 72px;
  margin: 32px 0 24px 0;
  letter-spacing: 2px;
  cursor: pointer;
  &:hover, &:focus {
    background: #ffeaea;
    color: #b04a4a;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CurrentTask = styled.div`
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
  font-size: 1.2rem;
  border-radius: 12px;
  padding: 16px 32px;
  min-width: 320px;
  text-align: center;
`;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('timer');
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [currentFocusTask, setCurrentFocusTask] = useState('');
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [artifactInput, setArtifactInput] = useState('');
  const [artifactVisibility, setArtifactVisibility] = useState(false);
  const [artifacts, setArtifacts] = useState<{ session: number; text: string; timestamp: string; visibility: boolean; task?: string }[]>(() => {
    const saved = localStorage.getItem(ARTIFACTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showProgressModal, setShowProgressModal] = useState(false);
  // Remove Sider and sidebarCollapsed state

  const [todos, setTodos] = useState<{ text: string; completed: boolean }[]>(() => {
    const saved = localStorage.getItem(TODOS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [todoInput, setTodoInput] = useState('');

  // Save artifacts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(ARTIFACTS_KEY, JSON.stringify(artifacts));
  }, [artifacts]);

  useEffect(() => {
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  }, [todos]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show modal when a work session completes
  const handleWorkSessionComplete = () => {
    setShowArtifactModal(true);
  };

  // Use the updated useTimer hook
  const {
    state,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    updateSettings,
  } = useTimer(handleWorkSessionComplete);

  // Add useEffect to update document.title with timer status
  useEffect(() => {
    if (state.isRunning) {
      document.title = `${formatTime(state.timeLeft)} - ${state.currentMode === 'work' ? 'Pomodoro' : state.currentMode === 'short-break' ? 'Short Break' : 'Long Break'} Timer`;
    } else {
      document.title = 'Pomodoro Timer';
    }
  }, [state.isRunning, state.timeLeft, state.currentMode]);

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
  };

  const handleSettingsCancel = () => {
    setCurrentPage('timer');
  };

  const handleArtifactSave = () => {
    setArtifacts(prev => [
      {
        session: state.completedSessions + 1,
        text: artifactInput,
        timestamp: new Date().toLocaleString(),
        visibility: artifactVisibility,
        task: currentFocusTask,
      },
      ...prev,
    ]);
    setArtifactInput('');
    setArtifactVisibility(false);
    setShowArtifactModal(false);
  };

  const handleArtifactCancel = () => {
    setArtifactInput('');
    setArtifactVisibility(false);
    setShowArtifactModal(false);
  };

  const progressPercentage = ((getTotalTimeForMode(state.currentMode) - state.timeLeft) / getTotalTimeForMode(state.currentMode)) * 100;

  const handleAddTodo = () => {
    if (todoInput.trim()) {
      setTodos(prev => [{ text: todoInput.trim(), completed: false }, ...prev]);
      setTodoInput('');
    }
  };

  const handleToggleTodo = (idx: number) => {
    setTodos(prev => prev.map((todo, i) => i === idx ? { ...todo, completed: !todo.completed } : todo));
  };

  const handleDeleteTodo = (idx: number) => {
    setTodos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteArtifact = (idx: number) => {
    setArtifacts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDownloadStats = () => {
    const exportData = artifacts.map(item => ({
      session: item.session,
      artifact: item.text,
      timestamp: new Date(item.timestamp).toISOString(),
      task: item.task || null
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pomodoro-stats-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const renderTimerPage = () => (
    <TimerContainer>
      <ModeTabs>
        <ModeTab
          active={state.currentMode === 'work'}
          onClick={() => handleModeSwitch('work')}
          disabled={state.isRunning}
        >
          Pomodoro
        </ModeTab>
        <ModeTab
          active={state.currentMode === 'short-break'}
          onClick={() => handleModeSwitch('short-break')}
          disabled={state.isRunning}
        >
          Short Break
        </ModeTab>
        <ModeTab
          active={state.currentMode === 'long-break'}
          onClick={() => handleModeSwitch('long-break')}
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
      {!state.isRunning ? (
        <StartButton onClick={handleStartClick}>START</StartButton>
      ) : (
        <Space size="large" style={{ margin: '32px 0 24px 0' }}>
          <Button size="large" icon={<PauseCircleOutlined />} onClick={pauseTimer}>
            Pause
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={handleTimerReset}>
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
    <>
      <GlobalStyle />
      <AppLayout>
        <AppHeader>
          <Title level={2} style={{ color: 'white', margin: 0, textAlign: 'center' }}>
            Pomodoro Timer
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', textAlign: 'center', marginBottom: 8 }}>
            Stay focused, stay productive
          </Text>
          <NavBar>
            {NAV_ITEMS.map(item => (
              <NavTab
                key={item.key}
                active={currentPage === item.key}
                onClick={() => setCurrentPage(item.key as Page)}
              >
                {item.icon} <span style={{ marginLeft: 6 }}>{item.label}</span>
              </NavTab>
            ))}
          </NavBar>
        </AppHeader>
        <Content>
          {currentPage === 'timer' && (
            <div className="timer-main">
              {renderTimerPage()}
              <FocusModal
                isOpen={showFocusModal}
                onClose={handleModalClose}
                onStart={handleFocusStart}
              />
            </div>
          )}
          {currentPage === 'todo' && (
            <div style={{ width: '600px', maxWidth: '90%', margin: '40px auto', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 32 }}>
              <Input.Group compact>
                <Input
                  style={{ width: 'calc(100% - 40px)' }}
                  value={todoInput}
                  onChange={e => setTodoInput(e.target.value)}
                  onPressEnter={handleAddTodo}
                  placeholder="Add a new todo..."
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTodo} />
              </Input.Group>
              <List
                dataSource={todos}
                renderItem={(item, idx) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        title="Delete this todo?"
                        onConfirm={() => handleDeleteTodo(idx)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button type="text" icon={<DeleteOutlined />} danger size="small" />
                      </Popconfirm>
                    ]}
                    style={{ paddingLeft: 0, paddingRight: 0 }}
                  >
                    <Checkbox checked={item.completed} onChange={() => handleToggleTodo(idx)}>
                      <span style={{ textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? '#aaa' : '#fff' }}>{item.text}</span>
                    </Checkbox>
                  </List.Item>
                )}
                style={{ marginTop: 16 }}
              />
            </div>
          )}
          {currentPage === 'stats' && (
            <div style={{ width: '600px', maxWidth: '90%', margin: '40px auto', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '32px 24px' }}>
              <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 16 }}>Pomodoro Progress</div>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Total Pomodoros completed:</strong> {artifacts.length}
                </div>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />} 
                  onClick={handleDownloadStats}
                  disabled={artifacts.length === 0}
                >
                  Download Stats
                </Button>
              </div>
              <List
                dataSource={artifacts}
                renderItem={(item, idx) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        title="Delete this Pomodoro session?"
                        onConfirm={() => handleDeleteArtifact(idx)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button type="text" icon={<DeleteOutlined />} danger size="small" />
                      </Popconfirm>
                    ]}
                  >
                    <div>
                      <strong>Session {item.session}</strong> <span style={{ color: '#aaa', fontSize: 12 }}>({item.timestamp})</span>
                      <div style={{ marginTop: 8, color: '#444', fontWeight: 500 }}>Task:</div>
                      <div style={{ marginLeft: 16, color: '#222', marginBottom: 8 }}>{item.task ? item.task : <span style={{ color: '#888' }}>—</span>}</div>
                      <div style={{ color: '#444', fontWeight: 500 }}>Artifact:</div>
                      <div style={{ marginLeft: 16, color: '#222' }}>{item.text}</div>
                    </div>
                  </List.Item>
                )}
                style={{ width: '100%' }}
              />
            </div>
          )}
          {currentPage === 'settings' && (
            <div style={{ maxWidth: 800, margin: '24px auto', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <SettingsPage
                  settings={settings}
                  onSave={handleSettingsSave}
                  onCancel={handleSettingsCancel}
                />
              </div>
            </div>
          )}
          <Modal
            open={showArtifactModal}
            title={`Congratulations! Session #${state.completedSessions + 1} complete`}
            onOk={handleArtifactSave}
            onCancel={handleArtifactCancel}
            okText="Save"
            cancelButtonProps={{ style: { display: 'none' } }}
            okButtonProps={{ disabled: !artifactVisibility || !artifactInput.trim() }}
          >
            {currentFocusTask && (
              <div style={{ marginBottom: 12, fontWeight: 500 }}>
                <span style={{ color: '#888' }}>Task:</span> {currentFocusTask}
              </div>
            )}
            <p>List your artifact for this session:</p>
            <Input.TextArea
              value={artifactInput}
              onChange={e => setArtifactInput(e.target.value)}
              rows={4}
              placeholder="Describe your accomplishment, code, or notes..."
              autoFocus
            />
            <div style={{ marginTop: 16 }}>
              <Checkbox
                checked={artifactVisibility}
                onChange={e => setArtifactVisibility(e.target.checked)}
              >
                I have shared my process in the Slack channel / email.
              </Checkbox>
            </div>
          </Modal>
          <Modal
            open={showProgressModal}
            title="Pomodoro Progress"
            onCancel={() => setShowProgressModal(false)}
            footer={null}
            width={520}
          >
            <div style={{ marginBottom: 16 }}>
              <strong>Total Pomodoros completed:</strong> {artifacts.length}
            </div>
            <List
              dataSource={artifacts}
              renderItem={item => (
                <List.Item>
                  <div>
                    <strong>Session {item.session}</strong> <span style={{ color: '#888', fontSize: 12 }}>({item.timestamp})</span>
                    {item.visibility && <span style={{ color: '#389e0d', marginLeft: 8 }}>[Visibility Shared]</span>}
                    <div>{item.text}</div>
                  </div>
                </List.Item>
              )}
              style={{ width: '100%' }}
            />
          </Modal>
        </Content>
      </AppLayout>
    </>
  );
};

export default App; 