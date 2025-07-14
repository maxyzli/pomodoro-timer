import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Space, Tabs, List, Tag, Empty } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: 'do' | 'schedule' | 'delegate' | 'eliminate';
}

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (focusTask: string, selectedTodoId?: string) => void;
  todos: Todo[];
}

export const FocusModal: React.FC<FocusModalProps> = ({
  isOpen,
  onClose,
  onStart,
  todos,
}) => {
  const [focusTask, setFocusTask] = useState('');
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('todos');

  // Filter uncompleted todos and prioritize DO category
  const availableTodos = todos
    .filter(todo => !todo.completed)
    .sort((a, b) => {
      // Sort by category priority: do > schedule > delegate > eliminate
      const categoryOrder = { do: 0, schedule: 1, delegate: 2, eliminate: 3 };
      return categoryOrder[a.category] - categoryOrder[b.category];
    });

  useEffect(() => {
    if (isOpen) {
      setFocusTask('');
      setSelectedTodoId(null);
      setActiveTab(availableTodos.length > 0 ? 'todos' : 'new');
    }
  }, [isOpen, availableTodos.length]);

  const handleSubmit = () => {
    if (activeTab === 'todos' && selectedTodoId) {
      const selectedTodo = availableTodos.find(todo => todo.id === selectedTodoId);
      if (selectedTodo) {
        onStart(selectedTodo.text, selectedTodoId);
      }
    } else if (activeTab === 'new' && focusTask.trim()) {
      onStart(focusTask.trim());
    }
  };

  const handleCancel = () => {
    setFocusTask('');
    setSelectedTodoId(null);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'do': return '#ff4d4f';
      case 'schedule': return '#1890ff';
      case 'delegate': return '#faad14';
      case 'eliminate': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'do': return '🔥';
      case 'schedule': return '📅';
      case 'delegate': return '👥';
      case 'eliminate': return '🗑️';
      default: return '';
    }
  };

  const isSubmitDisabled = () => {
    if (activeTab === 'todos') {
      return !selectedTodoId;
    }
    return !focusTask.trim();
  };

  return (
    <Modal
      title="What do you want to focus on?"
      open={isOpen}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={isSubmitDisabled()}
        >
          Start Focus Session
        </Button>,
      ]}
      destroyOnClose
      width={600}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'todos',
            label: `Choose from Todos${availableTodos.length > 0 ? ` (${availableTodos.length})` : ''}`,
            children: (
              <div style={{ minHeight: 300, maxHeight: 400, overflowY: 'auto' }}>
                {availableTodos.length === 0 ? (
                  <Empty
                    description="No uncompleted todos available"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <List
                    dataSource={availableTodos}
                    renderItem={(todo) => (
                      <List.Item
                        onClick={() => setSelectedTodoId(todo.id)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: selectedTodoId === todo.id ? '#e6f7ff' : 'transparent',
                          border: selectedTodoId === todo.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          padding: '12px 16px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Tag 
                              color={getCategoryColor(todo.category)} 
                              style={{ marginRight: 12 }}
                            >
                              {getCategoryIcon(todo.category)} {todo.category.toUpperCase()}
                            </Tag>
                            <span style={{ flex: 1, fontWeight: 500 }}>{todo.text}</span>
                          </div>
                          {selectedTodoId === todo.id && (
                            <CheckOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            ),
          },
          {
            key: 'new',
            label: 'Add New Focus',
            children: (
              <div style={{ minHeight: 300 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ color: '#666', marginBottom: 8 }}>
                    Create a new focus task for this session:
                  </div>
                  <TextArea
                    placeholder="Enter your focus task here... (e.g., 'Complete the React component', 'Write the documentation', 'Review the code')"
                    value={focusTask}
                    onChange={(e) => setFocusTask(e.target.value)}
                    autoFocus={activeTab === 'new'}
                    rows={4}
                    autoSize={{ minRows: 4, maxRows: 6 }}
                  />
                </Space>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}; 