import React, { useEffect, useState } from 'react';
import { Layout, Modal, Input, Checkbox } from 'antd';
import { ClockCircleOutlined, SettingOutlined, BarChartOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useTimer } from './hooks/useTimer';
import { useDailyData } from './hooks/useDailyData';
import { FocusModal } from './components/FocusModal';
import { SettingsPage } from './components/SettingsPage';
import { TimerPage } from './components/TimerPage';
import { TodoPage } from './components/TodoPage';
import { StatsPage } from './components/StatsPage';
import { AppLayout } from './components/AppLayout';
import { exportBackup, importBackup } from './utils/backup';
import type { Page } from './interfaces';

const { Content } = Layout;

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

  // Use the custom hook for data management
  const {
    dailyData,
    setDailyData,
    selectedDate,
    setSelectedDate,
    getCurrentDayData,
    addArtifact,
    deleteArtifact,
    addTodo,
    toggleTodo,
    deleteTodo,
    getTodayKey,
  } = useDailyData();

  const currentDayData = getCurrentDayData();
  const artifacts = currentDayData.artifacts;
  const todos = currentDayData.todos;


  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show modal when a work session completes
  const handleWorkSessionComplete = () => {
    // Show the artifact modal when work session completes
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
    handlePostWorkSessionComplete,
  } = useTimer(handleWorkSessionComplete);

  // Add useEffect to update document.title with timer status
  useEffect(() => {
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    if (state.isRunning) {
      document.title = `${formatTime(state.timeLeft)} - ${state.currentMode === 'work' ? 'Pomodoro' : state.currentMode === 'short-break' ? 'Short Break' : 'Long Break'} Timer`;
    } else {
      document.title = 'Pomodoro Timer';
    }
  }, [state.isRunning, state.timeLeft, state.currentMode]);


  const handleStartClick = () => {
    if (!state.isRunning) {
      if (state.currentMode === 'work') {
        setShowFocusModal(true);
      } else {
        // For breaks, start timer directly without focus modal
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
    // Only proceed if checkbox is checked (allow empty artifact text)
    if (!artifactVisibility) {
      return;
    }
    
    // Save the artifact using the custom hook
    addArtifact({
      text: artifactInput.trim() || '(No artifact description)',
      visibility: artifactVisibility,
      task: currentFocusTask,
    });
    
    setArtifactInput('');
    setArtifactVisibility(false);
    setShowArtifactModal(false);
    
    // Now handle auto-start break if enabled
    handlePostWorkSessionComplete();
  };

  const handleArtifactCancel = () => {
    setArtifactInput('');
    setArtifactVisibility(false);
    setShowArtifactModal(false);
    
    // Handle auto-start break if enabled (even when canceling)
    handlePostWorkSessionComplete();
  };


  const handleDownloadStats = () => {
    const exportData = artifacts.map((item, idx) => ({
      session: artifacts.length - idx,
      date: selectedDate,
      task: item.task || null,
      artifact: item.text,
      timestamp: new Date(item.timestamp).toISOString()
    }));
    
    const filename = `pomodoro-stats-${selectedDate}.json`;
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click();
  };

  const handleBackupExport = () => {
    exportBackup(dailyData);
  };

  const handleBackupImport = (file: File) => {
    return importBackup(file, (data, mode) => {
      if (mode === 'merge') {
        setDailyData(prev => ({ ...prev, ...data }));
      } else {
        setDailyData(data);
      }
    });
  };


  return (
    <AppLayout
      currentPage={currentPage}
      navItems={NAV_ITEMS}
      onPageChange={setCurrentPage}
    >
      <Content>
        {currentPage === 'timer' && (
          <div className="timer-main">
            <TimerPage
              state={state}
              settings={settings}
              currentFocusTask={currentFocusTask}
              onStartClick={handleStartClick}
              onPauseTimer={pauseTimer}
              onStartTimer={startTimer}
              onResetTimer={handleTimerReset}
              onModeSwitch={handleModeSwitch}
            />
            <FocusModal
              isOpen={showFocusModal}
              onClose={handleModalClose}
              onStart={handleFocusStart}
            />
          </div>
        )}
        
        {currentPage === 'todo' && (
          <TodoPage
            selectedDate={selectedDate}
            todos={todos}
            getTodayKey={getTodayKey}
            onDateChange={setSelectedDate}
            onAddTodo={addTodo}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
          />
        )}
        
        {currentPage === 'stats' && (
          <StatsPage
            selectedDate={selectedDate}
            artifacts={artifacts}
            getTodayKey={getTodayKey}
            onDateChange={setSelectedDate}
            onDownloadStats={handleDownloadStats}
            onDeleteArtifact={deleteArtifact}
          />
        )}
        
        {currentPage === 'settings' && (
          <SettingsPage
            settings={settings}
            onSave={handleSettingsSave}
            onCancel={handleSettingsCancel}
            onBackupExport={handleBackupExport}
            onBackupImport={handleBackupImport}
          />
        )}
        
        <Modal
          open={showArtifactModal}
          title={`Congratulations! Session #${state.completedSessions + 1} complete`}
          onOk={handleArtifactSave}
          onCancel={handleArtifactCancel}
          okText="Save"
          cancelButtonProps={{ style: { display: 'none' } }}
          okButtonProps={{ disabled: !artifactVisibility }}
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
              onChange={(e: any) => setArtifactVisibility(e.target.checked)}
            >
              I have shared my process in the Slack channel / email.
            </Checkbox>
          </div>
        </Modal>
      </Content>
    </AppLayout>
  );
};

export default App; 