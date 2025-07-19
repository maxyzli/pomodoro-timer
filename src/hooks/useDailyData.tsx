/**
 * Production-grade daily data management hook
 * Following Amazon SDE III standards with proper separation of concerns
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { todosRepository } from '../repositories/todos.repository';
import { artifactsRepository } from '../repositories/artifacts.repository';
import { monitor } from '../core/monitoring';
import { AppError, ErrorCode } from '../core/errors';
import { useAuth } from '../contexts/auth/AuthContext';
import { TodoInput } from '../validation/schemas';

export interface Artifact {
  text: string;
  timestamp: string;
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

interface UseDailyDataReturn {
  dailyData: DailyData;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getDayData: (date: string) => DayData;
  getCurrentDayData: () => DayData;
  isLoading: boolean;
  error: AppError | null;
  
  // Artifact operations
  addArtifact: (artifact: Omit<Artifact, 'timestamp'>) => Promise<void>;
  deleteArtifact: (index: number) => Promise<void>;
  updateArtifacts: (date: string, artifacts: Artifact[]) => Promise<void>;
  
  // Todo operations
  addTodo: (text: string, category?: EisenhowerCategory) => Promise<void>;
  toggleTodo: (index: number) => Promise<void>;
  updateTodo: (date: string, todoId: string, updates: Partial<Todo>) => Promise<void>;
  deleteTodo: (index: number) => Promise<void>;
  reorderTodos: (startIndex: number, endIndex: number) => Promise<void>;
  updateTodoCategory: (index: number, category: EisenhowerCategory) => Promise<void>;
  moveTodo: (index: number, targetDate: string) => Promise<void>;
  editTodo: (index: number, newText: string) => Promise<void>;
  
  // Import/Export
  exportData: () => void;
  importData: (jsonData: string) => Promise<void>;
  
  // Utility
  getTodayKey: () => string;
  refreshData: () => Promise<void>;
}

export const useDailyData = (): UseDailyDataReturn => {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<DailyData>({});
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  
  const loadingRef = useRef(false);
  const cacheRef = useRef<Map<string, DayData>>(new Map());

  const getDayData = useCallback((date: string): DayData => {
    return dailyData[date] || { artifacts: [], todos: [] };
  }, [dailyData]);

  const getCurrentDayData = useCallback((): DayData => {
    return getDayData(selectedDate);
  }, [getDayData, selectedDate]);

  const getTodayKey = useCallback(() => {
    return dayjs().format('YYYY-MM-DD');
  }, []);

  const refreshData = useCallback(async () => {
    if (!user?.id || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const [todos, artifacts] = await Promise.all([
        todosRepository.findAll({ filters: { userId: user.id } }),
        artifactsRepository.findAll({ filters: { userId: user.id } }),
      ]);

      const newDailyData: DailyData = {};

      // Group todos by date
      todos.forEach(todo => {
        const date = (todo as any).date;
        if (!newDailyData[date]) {
          newDailyData[date] = { artifacts: [], todos: [] };
        }
        newDailyData[date].todos.push(todo);
      });

      // Group artifacts by date
      artifacts.forEach(artifact => {
        const date = (artifact as any).date;
        if (!newDailyData[date]) {
          newDailyData[date] = { artifacts: [], todos: [] };
        }
        newDailyData[date].artifacts.push(artifact);
      });

      setDailyData(newDailyData);
      cacheRef.current.clear();
      
      monitor.info('Daily data refreshed', {
        module: 'useDailyData',
        datesCount: Object.keys(newDailyData).length,
        todosCount: todos.length,
        artifactsCount: artifacts.length,
      });
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError(
        ErrorCode.UNKNOWN_ERROR,
        'Failed to load daily data',
        { module: 'useDailyData' },
        err
      );
      setError(appError);
      monitor.captureException(appError);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Artifact operations
  const addArtifact = useCallback(async (artifact: Omit<Artifact, 'timestamp'>) => {
    if (!user?.id) throw new AppError(ErrorCode.AUTHENTICATION_REQUIRED, 'User not authenticated');

    const today = getTodayKey();
    const fullArtifact: Artifact = {
      ...artifact,
      timestamp: new Date().toISOString(),
    };

    // Optimistic update
    setDailyData(prev => {
      const dayData = prev[today] || { artifacts: [], todos: [] };
      return {
        ...prev,
        [today]: {
          ...dayData,
          artifacts: [...dayData.artifacts, fullArtifact],
        },
      };
    });

    try {
      await artifactsRepository.create({
        ...artifact,
        userId: user.id,
        date: today,
      });
    } catch (err) {
      // Revert optimistic update
      await refreshData();
      throw err;
    }
  }, [user?.id, getTodayKey, refreshData]);

  const deleteArtifact = useCallback(async (index: number) => {
    if (!user?.id) throw new AppError(ErrorCode.AUTHENTICATION_REQUIRED, 'User not authenticated');

    const dayData = getDayData(selectedDate);
    const updatedArtifacts = dayData.artifacts.filter((_, i) => i !== index);
    
    await artifactsRepository.replaceByDate(selectedDate, user.id, updatedArtifacts);
    await refreshData();
  }, [user?.id, selectedDate, getDayData, refreshData]);

  const updateArtifacts = useCallback(async (date: string, artifacts: Artifact[]) => {
    if (!user?.id) throw new AppError(ErrorCode.AUTHENTICATION_REQUIRED, 'User not authenticated');

    await artifactsRepository.replaceByDate(date, user.id, artifacts);
    await refreshData();
  }, [user?.id, refreshData]);

  // Todo operations
  const addTodo = useCallback(async (text: string, category: EisenhowerCategory = 'do') => {
    if (!user?.id) throw new AppError(ErrorCode.AUTHENTICATION_REQUIRED, 'User not authenticated');

    const today = getTodayKey();
    const todoInput: TodoInput = { text, category };

    await todosRepository.create({
      ...todoInput,
      completed: false,
      userId: user.id,
      date: today,
    });

    await refreshData();
  }, [user?.id, getTodayKey, refreshData]);

  const toggleTodo = useCallback(async (index: number) => {
    const dayData = getDayData(selectedDate);
    const todo = dayData.todos[index];
    if (!todo) return;

    await todosRepository.update(todo.id, { completed: !todo.completed });
    await refreshData();
  }, [selectedDate, getDayData, refreshData]);

  const updateTodo = useCallback(async (_date: string, todoId: string, updates: Partial<Todo>) => {
    await todosRepository.update(todoId, updates);
    await refreshData();
  }, [refreshData]);

  const deleteTodo = useCallback(async (index: number) => {
    const dayData = getDayData(selectedDate);
    const todo = dayData.todos[index];
    if (!todo) return;

    await todosRepository.delete(todo.id);
    await refreshData();
  }, [selectedDate, getDayData, refreshData]);

  const reorderTodos = useCallback(async (startIndex: number, endIndex: number) => {
    // This operation requires updating the order of todos
    // For now, we'll handle it client-side only
    setDailyData(prev => {
      const dayData = prev[selectedDate] || { artifacts: [], todos: [] };
      const todos = [...dayData.todos];
      const [removed] = todos.splice(startIndex, 1);
      todos.splice(endIndex, 0, removed);
      
      return {
        ...prev,
        [selectedDate]: {
          ...dayData,
          todos,
        },
      };
    });
  }, [selectedDate]);

  const updateTodoCategory = useCallback(async (index: number, category: EisenhowerCategory) => {
    const dayData = getDayData(selectedDate);
    const todo = dayData.todos[index];
    if (!todo) return;

    await updateTodo(selectedDate, todo.id, { category });
  }, [selectedDate, getDayData, updateTodo]);

  const moveTodo = useCallback(async (index: number, targetDate: string) => {
    if (!user?.id) throw new AppError(ErrorCode.AUTHENTICATION_REQUIRED, 'User not authenticated');

    const dayData = getDayData(selectedDate);
    const todo = dayData.todos[index];
    if (!todo) return;

    // Delete from current date
    await todosRepository.delete(todo.id);
    
    // Create in target date
    await todosRepository.create({
      text: todo.text,
      completed: todo.completed,
      category: todo.category,
      userId: user.id,
      date: targetDate,
    });

    await refreshData();
  }, [user?.id, selectedDate, getDayData, refreshData]);

  const editTodo = useCallback(async (index: number, newText: string) => {
    const dayData = getDayData(selectedDate);
    const todo = dayData.todos[index];
    if (!todo) return;

    await updateTodo(selectedDate, todo.id, { text: newText });
  }, [selectedDate, getDayData, updateTodo]);

  // Import/Export operations
  const exportData = useCallback(() => {
    const exportData = {
      data: dailyData,
      version: '2.0',
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileName = `pomodoro_backup_${dayjs().format('YYYY-MM-DD_HHmmss')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    monitor.info('Data exported', {
      module: 'useDailyData',
      datesCount: Object.keys(dailyData).length,
    });
  }, [dailyData]);

  const importData = useCallback(async (jsonData: string) => {
    if (!user?.id) throw new AppError(ErrorCode.AUTHENTICATION_REQUIRED, 'User not authenticated');

    try {
      const parsed = JSON.parse(jsonData);
      const importData = parsed.data || parsed; // Support both old and new formats

      // Validate and import data
      for (const [date, dayData] of Object.entries(importData as DailyData)) {
        // Import todos
        if (dayData.todos && dayData.todos.length > 0) {
          const todos = dayData.todos.map(todo => ({
            text: todo.text,
            completed: todo.completed,
            category: todo.category,
            userId: user.id,
            date,
          }));
          await todosRepository.batchCreate(todos);
        }

        // Import artifacts
        if (dayData.artifacts && dayData.artifacts.length > 0) {
          await artifactsRepository.replaceByDate(date, user.id, dayData.artifacts);
        }
      }

      await refreshData();
      
      monitor.info('Data imported', {
        module: 'useDailyData',
        datesCount: Object.keys(importData).length,
      });
    } catch (err) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        'Invalid import data format',
        { module: 'useDailyData' },
        err as Error
      );
    }
  }, [user?.id, refreshData]);

  return {
    dailyData,
    selectedDate,
    setSelectedDate,
    getDayData,
    getCurrentDayData,
    isLoading,
    error,
    addArtifact,
    deleteArtifact,
    updateArtifacts,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo: deleteTodo,
    reorderTodos,
    updateTodoCategory: updateTodoCategory,
    moveTodo: moveTodo,
    editTodo: editTodo,
    exportData,
    importData,
    getTodayKey,
    refreshData,
  };
};