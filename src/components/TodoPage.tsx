import React, { useState } from 'react';
import { DatePicker, Input, Button, List, Popconfirm, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageContainer } from '../styles/Layout.styles';
import { Todo } from '../hooks/useDailyData';

interface TodoPageProps {
  selectedDate: string;
  todos: Todo[];
  getTodayKey: () => string;
  onDateChange: (date: string) => void;
  onAddTodo: (text: string) => void;
  onToggleTodo: (index: number) => void;
  onDeleteTodo: (index: number) => void;
}

export const TodoPage: React.FC<TodoPageProps> = ({
  selectedDate,
  todos,
  getTodayKey,
  onDateChange,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo
}) => {
  const [todoInput, setTodoInput] = useState('');

  const handleAddTodo = () => {
    if (todoInput.trim()) {
      onAddTodo(todoInput);
      setTodoInput('');
    }
  };

  const isToday = selectedDate === getTodayKey();

  return (
    <PageContainer>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <DatePicker
          value={selectedDate ? dayjs(selectedDate) : null}
          onChange={(date) => onDateChange(date ? date.format('YYYY-MM-DD') : getTodayKey())}
          format="YYYY-MM-DD"
          placeholder="Select date"
          allowClear={false}
        />
        <div style={{ color: '#fff', fontWeight: 500 }}>
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
        <div style={{ color: '#fff', opacity: 0.7, textAlign: 'center', margin: '20px 0', fontStyle: 'italic' }}>
          Viewing past todos (read-only)
        </div>
      )}
      
      <List
        dataSource={todos}
        renderItem={(item, idx) => (
          <List.Item
            actions={isToday ? [
              <Popconfirm
                title="Delete this todo?"
                onConfirm={() => onDeleteTodo(idx)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" icon={<DeleteOutlined />} danger size="small" />
              </Popconfirm>
            ] : []}
            style={{ paddingLeft: 0, paddingRight: 0 }}
          >
            <Checkbox 
              checked={item.completed} 
              onChange={() => onToggleTodo(idx)}
              disabled={!isToday}
            >
              <span style={{ 
                textDecoration: item.completed ? 'line-through' : 'none', 
                color: item.completed ? '#aaa' : '#fff' 
              }}>
                {item.text}
              </span>
            </Checkbox>
          </List.Item>
        )}
        style={{ marginTop: 16 }}
      />
    </PageContainer>
  );
};