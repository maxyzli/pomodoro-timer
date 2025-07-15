import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { supabaseService } from '../services/supabaseService'
import { Artifact, Todo, DailyData, DayData, EisenhowerCategory } from './useDailyData'
import { RealtimeChannel } from '@supabase/supabase-js'

const STORAGE_KEY = 'pomodoroDailyData'
const SYNC_QUEUE_KEY = 'pomodoroSyncQueue'

interface SyncQueueItem {
  id: string
  type: 'artifact' | 'todo' | 'todo-update' | 'todo-delete'
  date: string
  data: any
  timestamp: number
}

export const useSupabaseDailyData = () => {
  const [dailyData, setDailyData] = useState<DailyData>({})
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([])

  // Load data from localStorage (for offline support)
  const loadLocalData = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setDailyData(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing stored data:', error)
      }
    }
  }, [])

  // Save data to localStorage
  const saveLocalData = useCallback((data: DailyData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [])

  // Get sync queue
  const getSyncQueue = (): SyncQueueItem[] => {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  // Save sync queue
  const saveSyncQueue = (queue: SyncQueueItem[]) => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  }

  // Add to sync queue
  const addToSyncQueue = (item: Omit<SyncQueueItem, 'id' | 'timestamp'>) => {
    const queue = getSyncQueue()
    queue.push({
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    })
    saveSyncQueue(queue)
  }

  // Process sync queue
  const processSyncQueue = async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    const queue = getSyncQueue()
    const failedItems: SyncQueueItem[] = []

    for (const item of queue) {
      try {
        switch (item.type) {
          case 'artifact':
            await supabaseService.saveArtifact(item.data, item.date)
            break
          case 'todo':
            await supabaseService.saveTodo(item.data, item.date)
            break
          case 'todo-update':
            await supabaseService.updateTodo(item.data, item.date)
            break
          case 'todo-delete':
            await supabaseService.deleteTodo(item.data.id, item.date)
            break
        }
      } catch (error) {
        console.error('Error syncing item:', error)
        failedItems.push(item)
      }
    }

    saveSyncQueue(failedItems)
    setIsSyncing(false)
  }

  // Initialize and load data
  useEffect(() => {
    const init = async () => {
      loadLocalData()

      if (isOnline) {
        try {
          await supabaseService.initialize()
          const data = await supabaseService.getAllDailyData()
          setDailyData(data)
          saveLocalData(data)
          processSyncQueue()
        } catch (error) {
          console.error('Error loading from Supabase:', error)
        }
      }
    }

    init()
  }, [isOnline])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      processSyncQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Subscribe to real-time updates for today's data
  useEffect(() => {
    if (!isOnline) return

    const today = dayjs().format('YYYY-MM-DD')
    
    const artifactSub = supabaseService.subscribeToArtifacts(today, (artifacts) => {
      setDailyData(prev => {
        const updated = {
          ...prev,
          [today]: {
            ...prev[today],
            artifacts
          }
        }
        saveLocalData(updated)
        return updated
      })
    })

    const todoSub = supabaseService.subscribeTodos(today, (todos) => {
      setDailyData(prev => {
        const updated = {
          ...prev,
          [today]: {
            ...prev[today],
            todos
          }
        }
        saveLocalData(updated)
        return updated
      })
    })

    setSubscriptions([artifactSub, todoSub])

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
    }
  }, [isOnline])

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
      const updated = {
        ...prev,
        [today]: {
          ...dayData,
          artifacts: [...dayData.artifacts, fullArtifact]
        }
      }
      saveLocalData(updated)
      return updated
    })

    // Sync to Supabase
    if (isOnline) {
      try {
        await supabaseService.saveArtifact(fullArtifact, today)
      } catch (error) {
        console.error('Error saving to Supabase:', error)
        addToSyncQueue({ type: 'artifact', date: today, data: fullArtifact })
      }
    } else {
      addToSyncQueue({ type: 'artifact', date: today, data: fullArtifact })
    }
  }, [isOnline])

  // Update artifacts
  const updateArtifacts = useCallback(async (date: string, artifacts: Artifact[]) => {
    // Update local state immediately
    setDailyData(prev => {
      const dayData = prev[date] || { artifacts: [], todos: [] }
      const updated = {
        ...prev,
        [date]: {
          ...dayData,
          artifacts
        }
      }
      saveLocalData(updated)
      return updated
    })

    // Sync to Supabase
    if (isOnline) {
      try {
        await supabaseService.updateArtifacts(artifacts, date)
      } catch (error) {
        console.error('Error updating artifacts:', error)
      }
    }
  }, [isOnline])

  // Add todo
  const addTodo = useCallback(async (text: string, category: EisenhowerCategory = 'do') => {
    const today = dayjs().format('YYYY-MM-DD')
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      category
    }

    // Update local state immediately
    setDailyData(prev => {
      const dayData = prev[today] || { artifacts: [], todos: [] }
      const updated = {
        ...prev,
        [today]: {
          ...dayData,
          todos: [...dayData.todos, newTodo]
        }
      }
      saveLocalData(updated)
      return updated
    })

    // Sync to Supabase
    if (isOnline) {
      try {
        await supabaseService.saveTodo(newTodo, today)
      } catch (error) {
        console.error('Error saving todo:', error)
        addToSyncQueue({ type: 'todo', date: today, data: newTodo })
      }
    } else {
      addToSyncQueue({ type: 'todo', date: today, data: newTodo })
    }
  }, [isOnline])

  // Update todo
  const updateTodo = useCallback(async (date: string, todoId: string, updates: Partial<Todo>) => {
    // Update local state immediately
    setDailyData(prev => {
      const dayData = prev[date] || { artifacts: [], todos: [] }
      const updatedTodos = dayData.todos.map(todo =>
        todo.id === todoId ? { ...todo, ...updates } : todo
      )
      const updated = {
        ...prev,
        [date]: {
          ...dayData,
          todos: updatedTodos
        }
      }
      saveLocalData(updated)
      return updated
    })

    // Get the updated todo for syncing
    const todo = getDayData(date).todos.find(t => t.id === todoId)
    if (!todo) return

    // Sync to Supabase
    if (isOnline) {
      try {
        await supabaseService.updateTodo(todo, date)
      } catch (error) {
        console.error('Error updating todo:', error)
        addToSyncQueue({ type: 'todo-update', date, data: todo })
      }
    } else {
      addToSyncQueue({ type: 'todo-update', date, data: todo })
    }
  }, [isOnline, getDayData])

  // Delete todo
  const deleteTodo = useCallback(async (date: string, todoId: string) => {
    // Update local state immediately
    setDailyData(prev => {
      const dayData = prev[date] || { artifacts: [], todos: [] }
      const updated = {
        ...prev,
        [date]: {
          ...dayData,
          todos: dayData.todos.filter(todo => todo.id !== todoId)
        }
      }
      saveLocalData(updated)
      return updated
    })

    // Sync to Supabase
    if (isOnline) {
      try {
        await supabaseService.deleteTodo(todoId, date)
      } catch (error) {
        console.error('Error deleting todo:', error)
        addToSyncQueue({ type: 'todo-delete', date, data: { id: todoId } })
      }
    } else {
      addToSyncQueue({ type: 'todo-delete', date, data: { id: todoId } })
    }
  }, [isOnline])

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
      saveLocalData(parsed)

      // Sync all imported data to Supabase if online
      if (isOnline) {
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
      }
    } catch (error) {
      console.error('Error importing data:', error)
      throw new Error('Invalid JSON data')
    }
  }, [isOnline])

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
    if (isOnline) {
      try {
        await supabaseService.saveTodo(todo, targetDate)
      } catch (error) {
        console.error('Error moving todo:', error)
      }
    } else {
      addToSyncQueue({ type: 'todo', date: targetDate, data: todo })
    }
  }, [selectedDate, getDayData, deleteTodo, isOnline])

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
    // This is a compatibility function - in Supabase mode, we don't directly set all data
    console.warn('setDailyData called in Supabase mode - this operation is not supported')
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
    isOnline,
    isSyncing
  }
}