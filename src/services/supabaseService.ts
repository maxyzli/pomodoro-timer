import { supabase } from '../lib/supabase'
import { Artifact, Todo, DailyData } from '../hooks/useDailyData'
import { TimerSettings } from '../types'

export class SupabaseService {
  private userId: string | null = null
  public client = supabase

  setUser(userId: string | null) {
    this.userId = userId
    console.log('🔄 SupabaseService user set to:', userId)
  }

  async initialize() {
    try {
      console.log('Initializing Supabase service...')
      
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
      throw new Error('User not authenticated')
    }
    
    const insertData = {
      id: todo.id,
      user_id: this.userId,
      text: todo.text,
      completed: todo.completed,
      category: todo.category,
      date
    }
    
    console.log('🔄 Attempting to insert:', insertData)
    
    // Skip auth check for now - it's causing crashes
    console.log('🔍 Inserting user_id:', this.userId)
    
    try {
      // Add timeout to prevent hanging
      const insertPromise = supabase
        .from('todos')
        .insert(insertData)
        .select()
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Insert timeout after 5 seconds')), 5000)
      )
      
      const result = await Promise.race([insertPromise, timeoutPromise]) as { data: any, error: any }
      const { data, error } = result
      console.log('🔍 Insert response:', { data, error })
      
      if (error) {
        console.error('❌ Error saving todo:', error)
        console.error('❌ Error details:', error.message, error.details, error.hint)
        console.error('❌ Error code:', error.code)
        throw error
      }
      
      if (data) {
        console.log('✅ Todo saved successfully:', data)
      } else {
        console.log('⚠️ Todo insert completed but no data returned (might be RLS issue)')
      }
    } catch (timeoutError) {
      console.error('❌ Insert operation timed out or failed:', timeoutError)
      throw timeoutError
    }
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
    console.log('📊 Fetching all daily data from Supabase...')
    
    const [artifactsResponse, todosResponse] = await Promise.all([
      supabase.from('artifacts').select('*').order('date', { ascending: false }),
      supabase.from('todos').select('*').order('date', { ascending: false })
    ])

    console.log('📊 Artifacts response:', artifactsResponse.data?.length || 0, 'items')
    console.log('📊 Todos response:', todosResponse.data?.length || 0, 'items')

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

    console.log('📊 Processed daily data:', Object.keys(dailyData).length, 'dates')
    console.log('📊 Daily data structure:', dailyData)
    
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