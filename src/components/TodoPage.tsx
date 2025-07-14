import React, { useState } from 'react';
import { DatePicker, Input, Button, Popconfirm, Checkbox, Select, Tag, Segmented, Modal, Card } from 'antd';
import { PlusOutlined, DeleteOutlined, LeftOutlined, RightOutlined, MenuOutlined } from '@ant-design/icons';
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
  onUpdateTodoCategory
}) => {
  const [todoInput, setTodoInput] = useState('');
  const [filterCategory, setFilterCategory] = useState<EisenhowerCategory | 'all'>('all');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingTodoText, setPendingTodoText] = useState('');

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
    : todos.filter(todo => todo.category === filterCategory);

  const handlePreviousDay = () => {
    const currentDate = dayjs(selectedDate);
    const previousDate = currentDate.subtract(1, 'day');
    onDateChange(previousDate.format('YYYY-MM-DD'));
  };

  const handleNextDay = () => {
    const currentDate = dayjs(selectedDate);
    const nextDate = currentDate.add(1, 'day');
    const today = dayjs(getTodayKey());
    
    // Don't allow navigation beyond today
    if (nextDate.isAfter(today)) return;
    
    onDateChange(nextDate.format('YYYY-MM-DD'));
  };

  const isToday = selectedDate === getTodayKey();
  const canGoNext = !dayjs(selectedDate).isSame(dayjs(getTodayKey()), 'day');

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
            disabled={!canGoNext}
            size="small"
            title="Next day"
          />
        </div>
        <div style={{ color: '#333', fontWeight: 500 }}>
          {isToday ? "Today's Todos" : `${selectedDate} Todos`}
        </div>
      </div>
      
      {isToday && (
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
      )}
      
      {!isToday && (
        <div style={{ color: '#666', textAlign: 'center', margin: '20px 0', fontStyle: 'italic' }}>
          Viewing past todos (read-only)
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, fontWeight: 500, color: '#666' }}>Filter by Category:</div>
        <Segmented
          value={filterCategory}
          onChange={setFilterCategory}
          options={[
            { label: 'All', value: 'all' },
            { 
              label: (
                <span>
                  <Tag color={getCategoryColor('do')} style={{ margin: 0, marginRight: 4 }}>🔥</Tag>
                  Do
                </span>
              ), 
              value: 'do' 
            },
            { 
              label: (
                <span>
                  <Tag color={getCategoryColor('schedule')} style={{ margin: 0, marginRight: 4 }}>📅</Tag>
                  Schedule
                </span>
              ), 
              value: 'schedule' 
            },
            { 
              label: (
                <span>
                  <Tag color={getCategoryColor('delegate')} style={{ margin: 0, marginRight: 4 }}>👥</Tag>
                  Delegate
                </span>
              ), 
              value: 'delegate' 
            },
            { 
              label: (
                <span>
                  <Tag color={getCategoryColor('eliminate')} style={{ margin: 0, marginRight: 4 }}>🗑️</Tag>
                  Eliminate
                </span>
              ), 
              value: 'eliminate' 
            },
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
            draggable={isToday}
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
              cursor: isToday ? 'grab' : 'default',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              opacity: draggedIndex === originalIndex ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {isToday && (
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
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <Checkbox 
                    checked={item.completed} 
                    onChange={() => onToggleTodo(originalIndex)}
                    disabled={!isToday}
                    style={{ marginRight: 8 }}
                  />
                  <span style={{ 
                    textDecoration: item.completed ? 'line-through' : 'none', 
                    color: item.completed ? '#aaa' : '#333',
                    flex: 1
                  }}>
                    {item.text}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Tag color={getCategoryColor(item.category)} style={{ margin: 0 }}>
                    {item.category === 'do' && '🔥'} 
                    {item.category === 'schedule' && '📅'} 
                    {item.category === 'delegate' && '👥'} 
                    {item.category === 'eliminate' && '🗑️'} 
                    {getCategoryLabel(item.category)}
                  </Tag>
                  {isToday && (
                    <Select
                      value={item.category}
                      onChange={(value) => onUpdateTodoCategory(originalIndex, value)}
                      size="small"
                      style={{ minWidth: 100 }}
                      disabled={!isToday}
                    >
                      <Select.Option value="do">🔥 Do</Select.Option>
                      <Select.Option value="schedule">📅 Schedule</Select.Option>
                      <Select.Option value="delegate">👥 Delegate</Select.Option>
                      <Select.Option value="eliminate">🗑️ Eliminate</Select.Option>
                    </Select>
                  )}
                </div>
              </div>
            </div>
            {isToday && (
              <Popconfirm
                title="Delete this todo?"
                onConfirm={() => onDeleteTodo(originalIndex)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" icon={<DeleteOutlined />} danger size="small" />
              </Popconfirm>
            )}
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
          <Card
            hoverable
            onClick={() => handleCategorySelection('do')}
            style={{ cursor: 'pointer', borderColor: getCategoryColor('do') }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tag color={getCategoryColor('do')} style={{ margin: 0, fontSize: 16, padding: '4px 8px' }}>
                🔥 DO
              </Tag>
              <div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>Urgent + Important</div>
                <div style={{ color: '#666', fontSize: 14 }}>Crises, emergencies, deadline-driven projects</div>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => handleCategorySelection('schedule')}
            style={{ cursor: 'pointer', borderColor: getCategoryColor('schedule') }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tag color={getCategoryColor('schedule')} style={{ margin: 0, fontSize: 16, padding: '4px 8px' }}>
                📅 SCHEDULE
              </Tag>
              <div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>Important, Not Urgent</div>
                <div style={{ color: '#666', fontSize: 14 }}>Prevention, planning, development, research</div>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => handleCategorySelection('delegate')}
            style={{ cursor: 'pointer', borderColor: getCategoryColor('delegate') }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tag color={getCategoryColor('delegate')} style={{ margin: 0, fontSize: 16, padding: '4px 8px' }}>
                👥 DELEGATE
              </Tag>
              <div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>Urgent, Not Important</div>
                <div style={{ color: '#666', fontSize: 14 }}>Interruptions, some calls, some meetings</div>
              </div>
            </div>
          </Card>

          <Card
            hoverable
            onClick={() => handleCategorySelection('eliminate')}
            style={{ cursor: 'pointer', borderColor: getCategoryColor('eliminate') }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tag color={getCategoryColor('eliminate')} style={{ margin: 0, fontSize: 16, padding: '4px 8px' }}>
                🗑️ ELIMINATE
              </Tag>
              <div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>Not Urgent, Not Important</div>
                <div style={{ color: '#666', fontSize: 14 }}>Busywork, some emails, time wasters</div>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center', color: '#999', fontSize: 12 }}>
          Click a category to save your todo, or press Cancel to edit the text
        </div>
      </Modal>
    </StatsPageContainer>
  );
};