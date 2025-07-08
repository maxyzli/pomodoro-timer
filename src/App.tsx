import React, { useEffect, useState } from 'react';
import { Layout, Typography, Card, Space, Divider, Button, Tag, Progress, Row, Col, Modal, Input, List, Popconfirm, Checkbox, Tooltip, Menu } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined, SettingOutlined, DeleteOutlined, BarChartOutlined, PlusOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UnorderedListOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTimer } from './hooks/useTimer';
import { FocusModal } from './components/FocusModal';
import { SettingsPage } from './components/SettingsPage';
import './App.css';

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

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('timer');
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [currentFocusTask, setCurrentFocusTask] = useState('');
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [artifactInput, setArtifactInput] = useState('');
  const [artifactVisibility, setArtifactVisibility] = useState(false);
  const [artifacts, setArtifacts] = useState<{ session: number; text: string; timestamp: string; visibility: boolean }[]>(() => {
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
    setCurrentPage('timer');
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
            disabled={state.isRunning}
          >
            Pomodoro
          </Button>
          <Button
            type={state.currentMode === 'short-break' ? 'primary' : 'default'}
            size="large"
            className="mode-tab"
            onClick={() => handleModeSwitch('short-break')}
            disabled={state.isRunning}
          >
            Short Break
          </Button>
          <Button
            type={state.currentMode === 'long-break' ? 'primary' : 'default'}
            size="large"
            className="mode-tab"
            onClick={() => handleModeSwitch('long-break')}
            disabled={state.isRunning}
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
    <Layout style={{ minHeight: '100vh', background: '#b04a4a' }}>
      {/* Remove Sider and sidebarCollapsed state */}
      <Layout style={{ background: 'transparent' }}>
        <div className="app-header" style={{ flexDirection: 'column', alignItems: 'center', display: 'flex', width: '100%' }}>
          <Title level={2} style={{ color: 'white', margin: 0, textAlign: 'center' }}>
            Pomodoro Timer
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', textAlign: 'center', marginBottom: 8 }}>
            Stay focused, stay productive
          </Text>
          <Menu
            mode="horizontal"
            selectedKeys={[currentPage]}
            onClick={({ key }) => setCurrentPage(key as Page)}
            style={{ background: 'transparent', color: 'white', fontWeight: 700, fontSize: 18, borderBottom: 'none', margin: '16px 0 0 0', display: 'flex', justifyContent: 'center', width: '100%' }}
            items={NAV_ITEMS.map(item => ({
              ...item,
              className: currentPage === item.key ? 'nav-tab-active' : 'nav-tab',
            }))}
          />
        </div>
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
            <div style={{ maxWidth: 480, margin: '40px auto', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 32 }}>
              <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 16 }}>Todo List</div>
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
            <div style={{ maxWidth: 600, margin: '40px auto', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 32 }}>
              <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 16 }}>Pomodoro Progress</div>
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
            </div>
          )}
          {currentPage === 'settings' && (
            <div style={{ maxWidth: 600, margin: '40px auto', background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 32 }}>
              <SettingsPage
                settings={settings}
                onSave={handleSettingsSave}
                onCancel={handleSettingsCancel}
              />
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
      </Layout>
    </Layout>
  );
};

export default App; 