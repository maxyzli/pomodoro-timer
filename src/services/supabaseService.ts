import { supabase } from '../lib/supabase'
import { Artifact, Todo, DailyData } from '../hooks/useDailyData'
import { TimerSettings } from '../types'

export class SupabaseService {
  private userId: string | null = null
  public client = supabase

  async initialize() {
    try {
      console.log('Initializing Supabase service...')
      
      // Add timeout to prevent hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout')), 10000)
      )
      
      const initPromise = (async () => {
        // First try to get session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Current session:', session?.user?.email || 'No session')
        
        // Then get current authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Current user:', user?.email || 'No user')
        
        this.userId = user?.id || null
        
        if (this.userId) {
          console.log('✅ Supabase initialized with user:', user?.email, 'User ID:', this.userId)
        } else {
          console.log('❌ No authenticated user - user ID is null')
          console.log('Session exists:', !!session)
          console.log('User exists:', !!user)
        }
      })()
      
      await Promise.race([initPromise, timeout])
    } catch (error) {
      console.error('Error initializing Supabase:', error)
      this.userId = null
    }
  }

  // Artifacts
  async getArtifacts(date: string): Promise<Artifact[]> {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('date', date)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching artifacts:', error)
      return []
    }

    return data.map(item => ({
      text: item.text,
      timestamp: item.timestamp,
      task: item.task || ''
    }))
  }

  async saveArtifact(artifact: Artifact, date: string): Promise<void> {
    const { error } = await supabase
      .from('artifacts')
      .insert({
        user_id: this.userId,
        text: artifact.text,
        timestamp: artifact.timestamp,
        task: artifact.task,
        date
      })

    if (error) {
      console.error('Error saving artifact:', error)
      throw error
    }
  }

  async updateArtifacts(artifacts: Artifact[], date: string): Promise<void> {
    // Delete existing artifacts for the date
    const { error: deleteError } = await supabase
      .from('artifacts')
      .delete()
      .eq('date', date)

    if (deleteError) {
      console.error('Error deleting artifacts:', deleteError)
      throw deleteError
    }

    // Insert new artifacts
    if (artifacts.length > 0) {
      const { error: insertError } = await supabase
        .from('artifacts')
        .insert(
          artifacts.map(artifact => ({
            user_id: this.userId,
            text: artifact.text,
            timestamp: artifact.timestamp,
            task: artifact.task,
            date
          }))
        )

      if (insertError) {
        console.error('Error inserting artifacts:', insertError)
        throw insertError
      }
    }
  }

  // Todos
  async getTodos(date: string): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching todos:', error)
      return []
    }

    return data.map(item => ({
      id: item.id,
      text: item.text,
      completed: item.completed,
      category: item.category
    }))
  }

  async saveTodo(todo: Todo, date: string): Promise<void> {
    console.log('🔵 saveTodo called with:', { todo, date, userId: this.userId })
    
    if (!this.userId) {
      console.error('❌ No user ID available - user may not be authenticated')
      console.log('🔍 Trying to re-initialize...')
      await this.initialize()
      
      if (!this.userId) {
        console.error('❌ Still no user ID after re-initialization')
        console.log('🔄 Waiting for auth state to settle...')
        
        // Wait up to 3 seconds for auth state to update
        const maxWaitTime = 3000
        const checkInterval = 100
        let waitTime = 0
        
        while (!this.userId && waitTime < maxWaitTime) {
          await new Promise(resolve => setTimeout(resolve, checkInterval))
          await this.initialize()
          waitTime += checkInterval
        }
        
        if (!this.userId) {
          console.error('❌ Authentication timeout - user is not signed in')
          throw new Error('User not authenticated')
        }
      }
    }
    
    const { error } = await supabase
      .from('todos')
      .insert({
        id: todo.id,
        user_id: this.userId,
        text: todo.text,
        completed: todo.completed,
        category: todo.category,
        date
      })

    if (error) {
      console.error('Error saving todo:', error)
      throw error
    }
    
    console.log('Todo saved successfully')
  }

  async updateTodo(todo: Todo, date: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .update({
        text: todo.text,
        completed: todo.completed,
        category: todo.category
      })
      .eq('id', todo.id)
      .eq('date', date)

    if (error) {
      console.error('Error updating todo:', error)
      throw error
    }
  }

  async deleteTodo(todoId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', todoId)
      .eq('date', date)

    if (error) {
      console.error('Error deleting todo:', error)
      throw error
    }
  }

  // Settings
  async getSettings(): Promise<TimerSettings | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching settings:', error)
      return null
    }

    return {
      workTime: data.work_time,
      shortBreakTime: data.short_break_time,
      longBreakTime: data.long_break_time,
      longBreakInterval: data.long_break_interval,
      autoStartBreaks: data.auto_start_breaks,
      autoStartPomodoros: data.auto_start_pomodoros,
      soundEnabled: data.sound_enabled,
      notificationsEnabled: data.notifications_enabled
    }
  }

  async saveSettings(settings: TimerSettings): Promise<void> {
    const { error } = await supabase
      .from('settings')
      .upsert({
        user_id: this.userId,
        work_time: settings.workTime,
        short_break_time: settings.shortBreakTime,
        long_break_time: settings.longBreakTime,
        long_break_interval: settings.longBreakInterval,
        auto_start_breaks: settings.autoStartBreaks,
        auto_start_pomodoros: settings.autoStartPomodoros,
        sound_enabled: settings.soundEnabled,
        notifications_enabled: settings.notificationsEnabled
      })

    if (error) {
      console.error('Error saving settings:', error)
      throw error
    }
  }

  // Get all daily data
  async getAllDailyData(): Promise<DailyData> {
    const [artifactsResponse, todosResponse] = await Promise.all([
      supabase.from('artifacts').select('*').order('date', { ascending: false }),
      supabase.from('todos').select('*').order('date', { ascending: false })
    ])

    if (artifactsResponse.error || todosResponse.error) {
      console.error('Error fetching daily data:', artifactsResponse.error || todosResponse.error)
      return {}
    }

    const dailyData: DailyData = {}

    // Group artifacts by date
    artifactsResponse.data?.forEach(artifact => {
      if (!dailyData[artifact.date]) {
        dailyData[artifact.date] = { artifacts: [], todos: [] }
      }
      dailyData[artifact.date].artifacts.push({
        text: artifact.text,
        timestamp: artifact.timestamp,
        task: artifact.task || ''
      })
    })

    // Group todos by date
    todosResponse.data?.forEach(todo => {
      if (!dailyData[todo.date]) {
        dailyData[todo.date] = { artifacts: [], todos: [] }
      }
      dailyData[todo.date].todos.push({
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
        category: todo.category
      })
    })

    return dailyData
  }

  // Real-time subscriptions
  subscribeToArtifacts(date: string, callback: (artifacts: Artifact[]) => void) {
    return supabase
      .channel(`artifacts:${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'artifacts',
          filter: `date=eq.${date}`
        },
        async () => {
          const artifacts = await this.getArtifacts(date)
          callback(artifacts)
        }
      )
      .subscribe()
  }

  subscribeTodos(date: string, callback: (todos: Todo[]) => void) {
    return supabase
      .channel(`todos:${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `date=eq.${date}`
        },
        async () => {
          const todos = await this.getTodos(date)
          callback(todos)
        }
      )
      .subscribe()
  }
}

export const supabaseService = new SupabaseService()