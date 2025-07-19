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
import { AuthProvider } from './contexts/AuthContext';
import { exportBackup, importBackup } from './utils/backup';
import type { Page } from './interfaces';

const { Content } = Layout;

const NAV_ITEMS = [
  { key: 'timer', icon: <ClockCircleOutlined />, label: 'Timer' },
  { key: 'todo', icon: <UnorderedListOutlined />, label: 'Todo' },
  { key: 'stats', icon: <BarChartOutlined />, label: 'Work Log' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
];

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('timer');
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [currentFocusTask, setCurrentFocusTask] = useState('');
  const [currentFocusTodoId, setCurrentFocusTodoId] = useState<string | null>(null);
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [artifactInput, setArtifactInput] = useState('');
  const [artifactVisibility, setArtifactVisibility] = useState(false);

  // Use the custom hook for data management
  const {
    dailyData,
    selectedDate,
    setSelectedDate,
    getCurrentDayData,
    addArtifact,
    deleteArtifact,
    addTodo,
    toggleTodo,
    deleteTodo,
    reorderTodos,
    updateTodoCategory,
    moveTodo,
    editTodo,
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
    timeLeft,
    isRunning,
    isPaused,
    currentMode,
    completedSessions,
    totalSessions,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    updateSettings,
    handlePostWorkSessionComplete,
    stopNotification,
  } = useTimer(handleWorkSessionComplete);

  // Add useEffect to update document.title with timer status
  useEffect(() => {
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    if (isRunning) {
      document.title = `${formatTime(timeLeft)} - ${currentMode === 'work' ? 'Pomodoro' : currentMode === 'short-break' ? 'Short Break' : 'Long Break'} Timer`;
    } else {
      document.title = 'Pomodoro Timer';
    }
  }, [isRunning, timeLeft, currentMode]);


  const handleStartClick = () => {
    if (!isRunning) {
      if (currentMode === 'work') {
        setShowFocusModal(true);
      } else {
        // For breaks, start timer directly without focus modal
        startTimer();
      }
    }
  };

  const handleFocusStart = (focusTask: string, selectedTodoId?: string) => {
    setCurrentFocusTask(focusTask);
    setCurrentFocusTodoId(selectedTodoId || null);
    setShowFocusModal(false);
    startTimer();
  };

  // const handleTimerReset = () => {
  //   setCurrentFocusTask('');
  //   setCurrentFocusTodoId(null);
  //   setShowFocusModal(false); // Ensure modal is closed on reset
  //   resetTimer();
  // };

  // Clear focus task when switching to break modes
  const handleModeSwitch = (mode: string) => {
    if (mode !== 'work') {
      setCurrentFocusTask(''); // Clear focus task for breaks
      setCurrentFocusTodoId(null);
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
    
    // Stop the notification sound
    stopNotification();
    
    // Save the artifact using the custom hook
    addArtifact({
      text: artifactInput.trim() || '(No artifact description)',
      task: currentFocusTask,
    });
    
    // Auto-complete the selected todo if one was chosen
    if (currentFocusTodoId) {
      const todoIndex = todos.findIndex(todo => todo.id === currentFocusTodoId);
      if (todoIndex !== -1 && !todos[todoIndex].completed) {
        toggleTodo(todoIndex);
      }
    }
    
    setArtifactInput('');
    setArtifactVisibility(false);
    setShowArtifactModal(false);
    setCurrentFocusTodoId(null);
    
    // Now handle auto-start break if enabled
    handlePostWorkSessionComplete();
  };

  const handleArtifactCancel = () => {
    // Stop the notification sound
    stopNotification();
    
    setArtifactInput('');
    setArtifactVisibility(false);
    setShowArtifactModal(false);
    setCurrentFocusTodoId(null);
    
    // Handle auto-start break if enabled (even when canceling)
    handlePostWorkSessionComplete();
  };


  const handleDownloadWorkLog = () => {
    const exportData = artifacts.map((item, idx) => ({
      session: artifacts.length - idx,
      date: selectedDate,
      task: item.task || null,
      artifact: item.text,
      timestamp: new Date(item.timestamp).toISOString()
    }));
    
    const filename = `work-log-${selectedDate}.json`;
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
    return importBackup(file, (data: any, mode: string) => {
      if (mode === 'merge') {
        console.log('Merge import:', data);
        // TODO: Implement merge logic with new repository pattern
      } else {
        console.log('Replace import:', data);
        // TODO: Implement replace logic with new repository pattern
      }
    });
  };

  // Keep original nav items without auth controls

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
              state={{
                timeLeft,
                isRunning,
                isPaused,
                currentMode,
                completedSessions,
                totalSessions,
              }}
              settings={settings}
              currentFocusTask={currentFocusTask}
              onStartClick={handleStartClick}
              onPauseTimer={pauseTimer}
              onStartTimer={startTimer}
              onResetTimer={resetTimer}
              onModeSwitch={handleModeSwitch}
            />
            <FocusModal
              isOpen={showFocusModal}
              onClose={handleModalClose}
              onStart={handleFocusStart}
              todos={todos}
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
            onReorderTodos={reorderTodos}
            onUpdateTodoCategory={updateTodoCategory}
            onMoveTodo={moveTodo}
            onEditTodo={editTodo}
          />
        )}
        
        {currentPage === 'stats' && (
          <StatsPage
            selectedDate={selectedDate}
            artifacts={artifacts}
            getTodayKey={getTodayKey}
            onDateChange={setSelectedDate}
            onDownloadStats={handleDownloadWorkLog}
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
          title={`Congratulations! Session #${completedSessions + 1} complete`}
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App; 