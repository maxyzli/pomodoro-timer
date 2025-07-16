import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { supabaseService } from '../services/supabaseService'
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
import { RealtimeChannel } from '@supabase/supabase-js'


export const useDailyData = () => {
  const [dailyData, setDailyData] = useState<DailyData>({})
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([])


  // Initialize and load data
  useEffect(() => {
    const init = async () => {
      try {
        const data = await supabaseService.getAllDailyData()
        setDailyData(data)
      } catch (error) {
        console.error('Error loading from Supabase:', error)
      }
    }

    init()
  }, [])


  // Subscribe to real-time updates for today's data
  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD')
    
    const artifactSub = supabaseService.subscribeToArtifacts(today, (artifacts) => {
      setDailyData(prev => ({
        ...prev,
        [today]: {
          ...prev[today],
          artifacts
        }
      }))
    })

    const todoSub = supabaseService.subscribeTodos(today, (todos) => {
      setDailyData(prev => ({
        ...prev,
        [today]: {
          ...prev[today],
          todos
        }
      }))
    })

    setSubscriptions([artifactSub, todoSub])

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }, [])

  // Get data for a specific date
  const getDayData = useCallback((date: string): DayData => {
    return dailyData[date] || { artifacts: [], todos: [] }
  }, [dailyData])

  // Add artifact
  const addArtifact = useCallback(async (artifact: Omit<Artifact, 'timestamp'>) => {
    const today = dayjs().format('YYYY-MM-DD')
    
    // Create artifact with timestamp
    const fullArtifact: Artifact = {
      ...artifact,
      timestamp: new Date().toISOString()
    }

    // Update local state immediately
    setDailyData(prev => {
      const dayData = prev[today] || { artifacts: [], todos: [] }
      return {
        ...prev,
        [today]: {
          ...dayData,
          artifacts: [...dayData.artifacts, fullArtifact]
        }
      }
    })

    // Sync to Supabase
    try {
      await supabaseService.saveArtifact(fullArtifact, today)
    } catch (error) {
      console.error('Error saving to Supabase:', error)
      throw error
    }
  }, [])

  // Update artifacts
  const updateArtifacts = useCallback(async (date: string, artifacts: Artifact[]) => {
    // Update local state immediately
    setDailyData(prev => {
      const dayData = prev[date] || { artifacts: [], todos: [] }
      return {
        ...prev,
        [date]: {
          ...dayData,
          artifacts
        }
      }
    })

    // Sync to Supabase
    try {
      await supabaseService.updateArtifacts(artifacts, date)
    } catch (error) {
      console.error('Error updating artifacts:', error)
      throw error
    }
  }, [])

  // Add todo
  const addTodo = useCallback(async (text: string, category: EisenhowerCategory = 'do') => {
    console.log('addTodo called with:', { text, category })
    const today = dayjs().format('YYYY-MM-DD')
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      category
    }
    console.log('Created new todo:', newTodo)

    // Update local state immediately
    setDailyData(prev => {
      const dayData = prev[today] || { artifacts: [], todos: [] }
      return {
        ...prev,
        [today]: {
          ...dayData,
          todos: [...dayData.todos, newTodo]
        }
      }
    })

    // Sync to Supabase
    try {
      console.log('Attempting to save todo to Supabase...')
      await supabaseService.saveTodo(newTodo, today)
      console.log('Todo saved successfully to Supabase')
    } catch (error) {
      console.error('Error saving todo:', error)
      throw error
    }
  }, [])

  // Update todo
  const updateTodo = useCallback(async (date: string, todoId: string, updates: Partial<Todo>) => {
    // Update local state immediately
    setDailyData(prev => {
      const dayData = prev[date] || { artifacts: [], todos: [] }
      const updatedTodos = dayData.todos.map(todo =>
        todo.id === todoId ? { ...todo, ...updates } : todo
      )
      return {
        ...prev,
        [date]: {
          ...dayData,
          todos: updatedTodos
        }
      }
    })

    // Get the updated todo for syncing
    const todo = getDayData(date).todos.find(t => t.id === todoId)
    if (!todo) return

    // Sync to Supabase
    try {
      await supabaseService.updateTodo(todo, date)
    } catch (error) {
      console.error('Error updating todo:', error)
      throw error
    }
  }, [getDayData])

  // Delete todo
  const deleteTodo = useCallback(async (date: string, todoId: string) => {
    // Update local state immediately
    setDailyData(prev => {
      const dayData = prev[date] || { artifacts: [], todos: [] }
      return {
        ...prev,
        [date]: {
          ...dayData,
          todos: dayData.todos.filter(todo => todo.id !== todoId)
        }
      }
    })

    // Sync to Supabase
    try {
      await supabaseService.deleteTodo(todoId, date)
    } catch (error) {
      console.error('Error deleting todo:', error)
      throw error
    }
  }, [])

  // Export data
  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(dailyData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `pomodoro_backup_${dayjs().format('YYYY-MM-DD_HHmmss')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }, [dailyData])

  // Import data
  const importData = useCallback(async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData) as DailyData
      setDailyData(parsed)

      // Sync all imported data to Supabase
      for (const [date, dayData] of Object.entries(parsed)) {
        try {
          if (dayData.artifacts.length > 0) {
            await supabaseService.updateArtifacts(dayData.artifacts, date)
          }
          for (const todo of dayData.todos) {
            await supabaseService.saveTodo(todo, date)
          }
        } catch (error) {
          console.error(`Error syncing data for ${date}:`, error)
        }
      }
    } catch (error) {
      console.error('Error importing data:', error)
      throw new Error('Invalid JSON data')
    }
  }, [])

  // Additional functions to match the original localStorage hook API
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'))

  const getCurrentDayData = useCallback((): DayData => {
    return getDayData(selectedDate)
  }, [getDayData, selectedDate])

  const deleteArtifact = useCallback(async (index: number) => {
    const dayData = getDayData(selectedDate)
    const updatedArtifacts = dayData.artifacts.filter((_, i) => i !== index)
    await updateArtifacts(selectedDate, updatedArtifacts)
  }, [selectedDate, getDayData, updateArtifacts])

  const toggleTodo = useCallback(async (index: number) => {
    const dayData = getDayData(selectedDate)
    const todo = dayData.todos[index]
    if (todo) {
      await updateTodo(selectedDate, todo.id, { completed: !todo.completed })
    }
  }, [selectedDate, getDayData, updateTodo])

  const deleteTodoByIndex = useCallback(async (index: number) => {
    const dayData = getDayData(selectedDate)
    const todo = dayData.todos[index]
    if (todo) {
      await deleteTodo(selectedDate, todo.id)
    }
  }, [selectedDate, getDayData, deleteTodo])

  const reorderTodos = useCallback(async (startIndex: number, endIndex: number) => {
    const dayData = getDayData(selectedDate)
    const todos = [...dayData.todos]
    const [removed] = todos.splice(startIndex, 1)
    todos.splice(endIndex, 0, removed)
    
    // Update all todos positions in database
    for (let i = 0; i < todos.length; i++) {
      await updateTodo(selectedDate, todos[i].id, todos[i])
    }
  }, [selectedDate, getDayData, updateTodo])

  const updateTodoCategoryByIndex = useCallback(async (index: number, category: EisenhowerCategory) => {
    const dayData = getDayData(selectedDate)
    const todo = dayData.todos[index]
    if (todo) {
      await updateTodo(selectedDate, todo.id, { category })
    }
  }, [selectedDate, getDayData, updateTodo])

  const moveTodoByIndex = useCallback(async (index: number, targetDate: string) => {
    const dayData = getDayData(selectedDate)
    const todo = dayData.todos[index]
    if (!todo) return

    // Delete from current date
    await deleteTodo(selectedDate, todo.id)
    
    // Add to target date
    try {
      await supabaseService.saveTodo(todo, targetDate)
    } catch (error) {
      console.error('Error moving todo:', error)
      throw error
    }
  }, [selectedDate, getDayData, deleteTodo])

  const editTodoByIndex = useCallback(async (index: number, newText: string) => {
    const dayData = getDayData(selectedDate)
    const todo = dayData.todos[index]
    if (todo) {
      await updateTodo(selectedDate, todo.id, { text: newText })
    }
  }, [selectedDate, getDayData, updateTodo])

  const getTodayKey = useCallback(() => {
    return dayjs().format('YYYY-MM-DD')
  }, [])

  const setDailyDataCompat = useCallback((_data: DailyData | ((prev: DailyData) => DailyData)) => {
    console.warn('setDailyData called - this operation is not supported')
  }, [])

  return {
    dailyData,
    setDailyData: setDailyDataCompat,
    selectedDate,
    setSelectedDate,
    getDayData,
    getCurrentDayData,
    addArtifact,
    deleteArtifact,
    updateArtifacts,
    addTodo,
    toggleTodo,
    updateTodo,
    deleteTodo: deleteTodoByIndex,
    reorderTodos,
    updateTodoCategory: updateTodoCategoryByIndex,
    moveTodo: moveTodoByIndex,
    editTodo: editTodoByIndex,
    exportData,
    importData,
    getTodayKey,
  }
}