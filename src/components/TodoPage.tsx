import React, { useState } from 'react';
import { DatePicker, Input, Button, Checkbox, Tag, Segmented, Modal, Card, Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined, LeftOutlined, RightOutlined, MenuOutlined, MoreOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { StatsPageContainer } from '../styles/Layout.styles';
import { Todo, EisenhowerCategory } from '../hooks/useDailyData';

interface TodoPageProps {
  selectedDate: string;
  todos: Todo[];
  getTodayKey: () => string;
  onDateChange: (date: string) => void;
  onAddTodo: (text: string, category?: EisenhowerCategory) => void;
  onToggleTodo: (index: number) => void;
  onDeleteTodo: (index: number) => void;
  onReorderTodos: (startIndex: number, endIndex: number) => void;
  onUpdateTodoCategory: (index: number, category: EisenhowerCategory) => void;
  onMoveTodo: (index: number, targetDate: string) => void;
  onEditTodo: (index: number, newText: string) => void;
}

export const TodoPage: React.FC<TodoPageProps> = ({
  selectedDate,
  todos,
  getTodayKey,
  onDateChange,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onReorderTodos,
  onUpdateTodoCategory,
  onMoveTodo,
  onEditTodo
}) => {
  const [todoInput, setTodoInput] = useState('');
  const [filterCategory, setFilterCategory] = useState<EisenhowerCategory | 'all'>('do');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingTodoText, setPendingTodoText] = useState('');
  const [showMoveDateModal, setShowMoveDateModal] = useState(false);
  const [movingTodoIndex, setMovingTodoIndex] = useState<number | null>(null);
  const [selectedMoveDate, setSelectedMoveDate] = useState<dayjs.Dayjs | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTodoIndex, setEditingTodoIndex] = useState<number | null>(null);
  const [editingTodoText, setEditingTodoText] = useState('');

  const handleAddTodo = () => {
    if (todoInput.trim()) {
      setPendingTodoText(todoInput.trim());
      setShowCategoryModal(true);
      setTodoInput('');
    }
  };

  const handleCategorySelection = (category: EisenhowerCategory) => {
    onAddTodo(pendingTodoText, category);
    setShowCategoryModal(false);
    setPendingTodoText('');
  };

  const handleCancelCategorySelection = () => {
    setShowCategoryModal(false);
    setTodoInput(pendingTodoText); // Restore the text
    setPendingTodoText('');
  };

  const getCategoryColor = (category: EisenhowerCategory) => {
    switch (category) {
      case 'do': return '#ff4d4f'; // Red - Urgent & Important
      case 'schedule': return '#1890ff'; // Blue - Important, Not Urgent
      case 'delegate': return '#faad14'; // Orange - Urgent, Not Important
      case 'eliminate': return '#52c41a'; // Green - Not Urgent, Not Important
      default: return '#d9d9d9';
    }
  };

  const getCategoryLabel = (category: EisenhowerCategory) => {
    switch (category) {
      case 'do': return 'Do (Urgent + Important)';
      case 'schedule': return 'Schedule (Important)';
      case 'delegate': return 'Delegate (Urgent)';
      case 'eliminate': return 'Eliminate (Neither)';
      default: return category;
    }
  };

  const filteredTodos = filterCategory === 'all' 
    ? todos 
    : todos.filter(todo => todo.category === filterCategory && !todo.completed);

  // Only limit DO category to 3 uncompleted todos
  const maxDoTodos = 3;
  const totalDoCount = todos.filter(todo => todo.category === 'do' && !todo.completed).length;
  
  // Count todos by category - categories only count uncompleted todos, All counts everything
  const getCategoryCount = (category: EisenhowerCategory | 'all') => {
    if (category === 'all') return todos.length;
    return todos.filter(todo => todo.category === category && !todo.completed).length;
  };
  

  const getDoStatus = () => {
    return {
      count: totalDoCount,
      isAtLimit: totalDoCount >= maxDoTodos,
      remaining: maxDoTodos - totalDoCount
    };
  };

  const handlePreviousDay = () => {
    const currentDate = dayjs(selectedDate);
    const previousDate = currentDate.subtract(1, 'day');
    onDateChange(previousDate.format('YYYY-MM-DD'));
  };

  const handleNextDay = () => {
    const currentDate = dayjs(selectedDate);
    const nextDate = currentDate.add(1, 'day');
    onDateChange(nextDate.format('YYYY-MM-DD'));
  };

  const isToday = selectedDate === getTodayKey();

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    onReorderTodos(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleMoveToDate = (todoIndex: number) => {
    setMovingTodoIndex(todoIndex);
    setSelectedMoveDate(null);
    setShowMoveDateModal(true);
  };

  const handleConfirmMoveDate = () => {
    if (selectedMoveDate && movingTodoIndex !== null) {
      onMoveTodo(movingTodoIndex, selectedMoveDate.format('YYYY-MM-DD'));
      setShowMoveDateModal(false);
      setMovingTodoIndex(null);
      setSelectedMoveDate(null);
    }
  };

  const handleCancelMoveDate = () => {
    setShowMoveDateModal(false);
    setMovingTodoIndex(null);
    setSelectedMoveDate(null);
  };

  const handleEditTodo = (todoIndex: number) => {
    setEditingTodoIndex(todoIndex);
    setEditingTodoText(todos[todoIndex].text);
    setShowEditModal(true);
  };

  const handleConfirmEdit = () => {
    if (editingTodoIndex !== null && editingTodoText.trim()) {
      onEditTodo(editingTodoIndex, editingTodoText.trim());
      setShowEditModal(false);
      setEditingTodoIndex(null);
      setEditingTodoText('');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingTodoIndex(null);
    setEditingTodoText('');
  };

  return (
    <StatsPageContainer>
      <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 16 }}>
        Todo
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button 
            icon={<LeftOutlined />} 
            onClick={handlePreviousDay}
            size="small"
            title="Previous day"
          />
          <DatePicker
            value={selectedDate ? dayjs(selectedDate) : null}
            onChange={(date) => onDateChange(date ? date.format('YYYY-MM-DD') : getTodayKey())}
            format="YYYY-MM-DD"
            placeholder="Select date"
            allowClear={false}
          />
          <Button 
            icon={<RightOutlined />} 
            onClick={handleNextDay}
            size="small"
            title="Next day"
          />
        </div>
        <div style={{ color: '#333', fontWeight: 500 }}>
          {isToday ? "Today's Todos" : `${selectedDate} Todos`}
        </div>
      </div>
      
      <Input.Group compact style={{ marginBottom: 16 }}>
        <Input.TextArea
          style={{ width: 'calc(100% - 40px)' }}
          value={todoInput}
          onChange={e => setTodoInput(e.target.value)}
          onPressEnter={(e) => {
            if (e.ctrlKey || e.metaKey) {
              handleAddTodo();
            }
          }}
          placeholder="Add a new todo... (Ctrl+Enter to add)"
          rows={2}
          autoSize={{ minRows: 1, maxRows: 4 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTodo} />
      </Input.Group>
      
      {!isToday && (
        <div style={{ color: '#666', textAlign: 'center', margin: '20px 0', fontStyle: 'italic' }}>
          {dayjs(selectedDate).isBefore(dayjs(getTodayKey()), 'day') 
            ? `Viewing todos from ${selectedDate}` 
            : `Viewing future todos for ${selectedDate}`}
        </div>
      )}


      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: '#666' }}>Filter by Category:</div>
        <Segmented
          value={filterCategory}
          onChange={setFilterCategory}
          options={[
            { 
              label: (
                <span>
                  <Tag color={getCategoryColor('do')} style={{ margin: 0, marginRight: 4 }}>🔥</Tag>
                  Do ({getCategoryCount('do')})
                </span>
              ), 
              value: 'do' 
            },
            { 
              label: (
                <span>
                  <Tag color={getCategoryColor('schedule')} style={{ margin: 0, marginRight: 4 }}>📅</Tag>
                  Schedule ({getCategoryCount('schedule')})
                </span>
              ), 
              value: 'schedule' 
            },
            { 
              label: (
                <span>
                  <Tag color={getCategoryColor('delegate')} style={{ margin: 0, marginRight: 4 }}>👥</Tag>
                  Delegate ({getCategoryCount('delegate')})
                </span>
              ), 
              value: 'delegate' 
            },
            { 
              label: (
                <span>
                  <Tag color={getCategoryColor('eliminate')} style={{ margin: 0, marginRight: 4 }}>🗑️</Tag>
                  Eliminate ({getCategoryCount('eliminate')})
                </span>
              ), 
              value: 'eliminate' 
            },
            { label: `All (${getCategoryCount('all')})`, value: 'all' },
          ]}
          style={{ width: '100%' }}
        />
      </div>
      
      <div style={{ marginTop: 16 }}>
        {filteredTodos.map((item) => {
          const originalIndex = todos.findIndex(todo => todo.id === item.id);
          return (
          <div
            key={item.id}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, originalIndex)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, originalIndex)}
            onDragEnd={handleDragEnd}
            style={{
              backgroundColor: draggedIndex === originalIndex ? '#f0f0f0' : 'white',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              marginBottom: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              opacity: draggedIndex === originalIndex ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  marginRight: '12px',
                  color: '#8c8c8c',
                  cursor: 'grab',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '20px',
                  height: '20px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                  e.currentTarget.style.color = '#666';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#8c8c8c';
                }}
                title="Drag to reorder"
              >
                <MenuOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <Checkbox 
                    checked={item.completed} 
                    onChange={() => onToggleTodo(originalIndex)}
                    style={{ 
                      marginRight: 8
                    }}
                  />
                  <span style={{ 
                    textDecoration: item.completed ? 'line-through' : 'none', 
                    color: item.completed ? '#aaa' : '#333',
                    flex: 1
                  }}>
                    {item.text}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Tag color={getCategoryColor(item.category)} style={{ margin: 0 }}>
                    {item.category === 'do' && '🔥'} 
                    {item.category === 'schedule' && '📅'} 
                    {item.category === 'delegate' && '👥'} 
                    {item.category === 'eliminate' && '🗑️'} 
                    {getCategoryLabel(item.category)}
                  </Tag>
                </div>
              </div>
            </div>
            {(() => {
              // Check if changing to DO would exceed the limit
              // Count only uncompleted DO todos for the selected date
              const allTodosForDate = todos; // This is already the todos for selectedDate
              const currentDoCount = allTodosForDate.filter(todo => todo.category === 'do' && !todo.completed).length;
              const isCurrentTodoDo = item.category === 'do';
              const wouldExceedDoLimit = !isCurrentTodoDo && currentDoCount >= 3;

              return (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'status',
                        label: 'Change status',
                        children: [
                          {
                            key: 'status-do',
                            label: wouldExceedDoLimit ? `🔥 Do (Full - ${currentDoCount}/3)` : '🔥 Do',
                            onClick: wouldExceedDoLimit ? undefined : () => onUpdateTodoCategory(originalIndex, 'do'),
                            disabled: wouldExceedDoLimit,
                          },
                          {
                            key: 'status-schedule',
                            label: '📅 Schedule',
                            onClick: () => onUpdateTodoCategory(originalIndex, 'schedule'),
                          },
                          {
                            key: 'status-delegate',
                            label: '👥 Delegate',
                            onClick: () => onUpdateTodoCategory(originalIndex, 'delegate'),
                          },
                          {
                            key: 'status-eliminate',
                            label: '🗑️ Eliminate',
                            onClick: () => onUpdateTodoCategory(originalIndex, 'eliminate'),
                          },
                        ],
                      },
                      {
                        type: 'divider',
                      },
                      {
                        key: 'move',
                        label: 'Move to date...',
                        icon: <CalendarOutlined />,
                        onClick: () => handleMoveToDate(originalIndex),
                      },
                      {
                        key: 'edit',
                        label: 'Edit text',
                        icon: <EditOutlined />,
                        onClick: () => handleEditTodo(originalIndex),
                      },
                      {
                        type: 'divider',
                      },
                      {
                        key: 'delete',
                        label: 'Delete',
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => {
                          Modal.confirm({
                            title: 'Delete this todo?',
                            content: 'This action cannot be undone.',
                            okText: 'Yes, delete',
                            okType: 'danger',
                            cancelText: 'Cancel',
                            onOk: () => onDeleteTodo(originalIndex),
                          });
                        },
                      },
                    ],
                  }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined />}
                    size="small"
                    style={{ 
                      color: '#8c8c8c',
                      transform: 'rotate(90deg)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              );
            })()}
          </div>
          );
        })}
      </div>

      <Modal
        title="Categorize Your Todo"
        open={showCategoryModal}
        onCancel={handleCancelCategorySelection}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, marginBottom: 12, color: '#333' }}>
            <strong>Todo:</strong> "{pendingTodoText}"
          </div>
          <div style={{ color: '#666', marginBottom: 16 }}>
            Choose how to categorize this task using the Eisenhower Matrix:
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {(['do', 'schedule', 'delegate', 'eliminate'] as EisenhowerCategory[]).map(category => {
            const doStatus = getDoStatus();
            const isDisabled = category === 'do' && doStatus.isAtLimit;
            
            return (
              <Card
                key={category}
                hoverable={!isDisabled}
                onClick={isDisabled ? undefined : () => handleCategorySelection(category)}
                style={{ 
                  cursor: isDisabled ? 'not-allowed' : 'pointer', 
                  borderColor: getCategoryColor(category),
                  opacity: isDisabled ? 0.5 : 1,
                  backgroundColor: isDisabled ? '#f5f5f5' : 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Tag color={getCategoryColor(category)} style={{ margin: 0, fontSize: 16, padding: '4px 8px' }}>
                    {category === 'do' && '🔥 DO'}
                    {category === 'schedule' && '📅 SCHEDULE'}
                    {category === 'delegate' && '👥 DELEGATE'}
                    {category === 'eliminate' && '🗑️ ELIMINATE'}
                  </Tag>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: isDisabled ? '#999' : '#333' }}>
                      {category === 'do' && 'Urgent + Important'}
                      {category === 'schedule' && 'Important, Not Urgent'}
                      {category === 'delegate' && 'Urgent, Not Important'}
                      {category === 'eliminate' && 'Not Urgent, Not Important'}
                    </div>
                    <div style={{ color: isDisabled ? '#ccc' : '#666', fontSize: 14 }}>
                      {category === 'do' && 'Crises, emergencies, deadline-driven projects'}
                      {category === 'schedule' && 'Prevention, planning, development, research'}
                      {category === 'delegate' && 'Interruptions, some calls, some meetings'}
                      {category === 'eliminate' && 'Busywork, some emails, time wasters'}
                    </div>
                  </div>
                  {category === 'do' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        fontSize: 12, 
                        color: doStatus.isAtLimit ? '#fa8c16' : '#52c41a',
                        fontWeight: 'bold'
                      }}>
                        {doStatus.count}/3
                      </span>
                      {doStatus.isAtLimit && (
                        <span style={{ 
                          fontSize: 11, 
                          color: '#fa8c16',
                          backgroundColor: '#fff7e6',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #ffd591'
                        }}>
                          FULL
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', color: '#999', fontSize: 12 }}>
          Click a category to save your todo, or press Cancel to edit the text
        </div>
      </Modal>

      {/* Move to Date Modal */}
      <Modal
        title="Move Todo to Date"
        open={showMoveDateModal}
        onCancel={handleCancelMoveDate}
        footer={[
          <Button key="cancel" onClick={handleCancelMoveDate}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleConfirmMoveDate}
            disabled={!selectedMoveDate}
          >
            Move Todo
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          {movingTodoIndex !== null && (
            <div style={{ marginBottom: 12, color: '#666' }}>
              <strong>Todo:</strong> "{todos[movingTodoIndex]?.text}"
            </div>
          )}
          <div style={{ color: '#666', marginBottom: 12 }}>
            Select the date to move this todo to:
          </div>
          <DatePicker
            value={selectedMoveDate}
            onChange={setSelectedMoveDate}
            placeholder="Select target date"
            format="YYYY-MM-DD"
            style={{ width: '100%' }}
            autoFocus
            disabledDate={() => false}
          />
        </div>
      </Modal>

      {/* Edit Todo Modal */}
      <Modal
        title="Edit Todo Text"
        open={showEditModal}
        onCancel={handleCancelEdit}
        footer={[
          <Button key="cancel" onClick={handleCancelEdit}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleConfirmEdit}
            disabled={!editingTodoText.trim()}
          >
            Save Changes
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#666', marginBottom: 12 }}>
            Edit your todo text:
          </div>
          <Input.TextArea
            value={editingTodoText}
            onChange={(e) => setEditingTodoText(e.target.value)}
            placeholder="Enter todo text..."
            rows={3}
            autoFocus
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </div>
      </Modal>
    </StatsPageContainer>
  );
};