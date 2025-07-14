import { useState, useEffect, useCallback } from 'react';

export interface Artifact {
  text: string;
  timestamp: string;
  visibility: boolean;
  task: string;
}

export type EisenhowerCategory = 'do' | 'schedule' | 'delegate' | 'eliminate';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  category: EisenhowerCategory;
}

export interface DayData {
  artifacts: Artifact[];
  todos: Todo[];
}

export interface DailyData {
  [date: string]: DayData;
}

const DAILY_DATA_KEY = 'pomodoroDailyData';

const getTodayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadDailyData = (): DailyData => {
  const saved = localStorage.getItem(DAILY_DATA_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return {};
};

const saveDailyData = (data: DailyData) => {
  localStorage.setItem(DAILY_DATA_KEY, JSON.stringify(data));
};

export const useDailyData = () => {
  const [dailyData, setDailyData] = useState<DailyData>(() => {
    const data = loadDailyData();
    
    // Migrate old data if it exists
    const oldArtifacts = localStorage.getItem('pomodoroArtifacts');
    const oldTodos = localStorage.getItem('pomodoroTodos');
    if (oldArtifacts && !data[getTodayKey()]) {
      const today = getTodayKey();
      data[today] = {
        artifacts: JSON.parse(oldArtifacts),
        todos: oldTodos ? JSON.parse(oldTodos) : []
      };
      saveDailyData(data);
      localStorage.removeItem('pomodoroArtifacts');
      localStorage.removeItem('pomodoroTodos');
    }
    
    // Migrate todos to add IDs and categories if they don't have them
    let needsSave = false;
    Object.keys(data).forEach(dateKey => {
      if (data[dateKey].todos) {
        data[dateKey].todos = data[dateKey].todos.map((todo: any) => {
          let updatedTodo = { ...todo };
          
          if (!todo.id) {
            needsSave = true;
            updatedTodo.id = `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }
          
          if (!todo.category) {
            needsSave = true;
            updatedTodo.category = 'do'; // Default to 'do' for existing todos
          }
          
          return updatedTodo;
        });
      }
    });
    
    if (needsSave) {
      saveDailyData(data);
    }
    
    return data;
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayKey());

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveDailyData(dailyData);
  }, [dailyData]);

  const getCurrentDayData = useCallback((): DayData => {
    return dailyData[selectedDate] || { artifacts: [], todos: [] };
  }, [dailyData, selectedDate]);

  const addArtifact = useCallback((artifact: Omit<Artifact, 'timestamp'>) => {
    const today = getTodayKey();
    setDailyData(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        artifacts: [
          {
            ...artifact,
            timestamp: new Date().toLocaleString(),
          },
          ...(prev[today]?.artifacts || []),
        ],
        todos: prev[today]?.todos || []
      }
    }));
  }, []);

  const deleteArtifact = useCallback((index: number) => {
    if (selectedDate !== getTodayKey()) return;
    
    setDailyData(prev => ({
      ...prev,
      [selectedDate]: {
        ...prev[selectedDate],
        artifacts: (prev[selectedDate]?.artifacts || []).filter((_, i) => i !== index),
        todos: prev[selectedDate]?.todos || []
      }
    }));
  }, [selectedDate]);

  const addTodo = useCallback((text: string, category: EisenhowerCategory = 'do') => {
    const today = getTodayKey();
    const newTodo: Todo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      completed: false,
      category
    };
    
    setDailyData(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        artifacts: prev[today]?.artifacts || [],
        todos: [newTodo, ...(prev[today]?.todos || [])]
      }
    }));
  }, []);

  const toggleTodo = useCallback((index: number) => {
    if (selectedDate !== getTodayKey()) return;
    
    const today = getTodayKey();
    setDailyData(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        artifacts: prev[today]?.artifacts || [],
        todos: (prev[today]?.todos || []).map((todo, i) => 
          i === index ? { ...todo, completed: !todo.completed } : todo
        )
      }
    }));
  }, [selectedDate]);

  const deleteTodo = useCallback((index: number) => {
    if (selectedDate !== getTodayKey()) return;
    
    const today = getTodayKey();
    setDailyData(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        artifacts: prev[today]?.artifacts || [],
        todos: (prev[today]?.todos || []).filter((_, i) => i !== index)
      }
    }));
  }, [selectedDate]);

  const reorderTodos = useCallback((startIndex: number, endIndex: number) => {
    if (selectedDate !== getTodayKey()) return;
    
    const today = getTodayKey();
    setDailyData(prev => {
      const todos = [...(prev[today]?.todos || [])];
      const [reorderedItem] = todos.splice(startIndex, 1);
      todos.splice(endIndex, 0, reorderedItem);
      
      return {
        ...prev,
        [today]: {
          ...prev[today],
          artifacts: prev[today]?.artifacts || [],
          todos
        }
      };
    });
  }, [selectedDate]);

  const updateTodoCategory = useCallback((index: number, category: EisenhowerCategory) => {
    if (selectedDate !== getTodayKey()) return;
    
    const today = getTodayKey();
    setDailyData(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        artifacts: prev[today]?.artifacts || [],
        todos: (prev[today]?.todos || []).map((todo, i) => 
          i === index ? { ...todo, category } : todo
        )
      }
    }));
  }, [selectedDate]);

  return {
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
    reorderTodos,
    updateTodoCategory,
    getTodayKey,
  };
};