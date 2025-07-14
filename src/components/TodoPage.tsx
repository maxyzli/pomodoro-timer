import React, { useState } from 'react';
import { DatePicker, Input, Button, Popconfirm, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined, LeftOutlined, RightOutlined, MenuOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { StatsPageContainer } from '../styles/Layout.styles';
import { Todo } from '../hooks/useDailyData';

interface TodoPageProps {
  selectedDate: string;
  todos: Todo[];
  getTodayKey: () => string;
  onDateChange: (date: string) => void;
  onAddTodo: (text: string) => void;
  onToggleTodo: (index: number) => void;
  onDeleteTodo: (index: number) => void;
  onReorderTodos: (startIndex: number, endIndex: number) => void;
}

export const TodoPage: React.FC<TodoPageProps> = ({
  selectedDate,
  todos,
  getTodayKey,
  onDateChange,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onReorderTodos
}) => {
  const [todoInput, setTodoInput] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddTodo = () => {
    if (todoInput.trim()) {
      onAddTodo(todoInput);
      setTodoInput('');
    }
  };

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
        <Input.Group compact>
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
      
      <div style={{ marginTop: 16 }}>
        {todos.map((item, idx) => (
          <div
            key={item.id}
            draggable={isToday}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            style={{
              backgroundColor: draggedIndex === idx ? '#f0f0f0' : 'white',
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
              opacity: draggedIndex === idx ? 0.5 : 1,
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
              <Checkbox 
                checked={item.completed} 
                onChange={() => onToggleTodo(idx)}
                disabled={!isToday}
              >
                <span style={{ 
                  textDecoration: item.completed ? 'line-through' : 'none', 
                  color: item.completed ? '#aaa' : '#333' 
                }}>
                  {item.text}
                </span>
              </Checkbox>
            </div>
            {isToday && (
              <Popconfirm
                title="Delete this todo?"
                onConfirm={() => onDeleteTodo(idx)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" icon={<DeleteOutlined />} danger size="small" />
              </Popconfirm>
            )}
          </div>
        ))}
      </div>
    </StatsPageContainer>
  );
};