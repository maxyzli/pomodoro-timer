/**
 * Legacy Supabase service wrapper for backward compatibility
 * Delegates to new repository pattern
 */

import { supabase } from '../lib/supabase';
import { Artifact, Todo, DailyData } from '../hooks/useDailyData';
import { TimerSettings } from '../types';
import { todosRepository } from '../repositories/todos.repository';
import { artifactsRepository } from '../repositories/artifacts.repository';
import { settingsRepository } from '../repositories/settings.repository';
import { monitor } from '../core/monitoring';

export class SupabaseService {
  private userId: string | null = null;
  public client = supabase;

  setUser(userId: string | null) {
    this.userId = userId;
    monitor.debug('SupabaseService user set', { module: 'SupabaseService' });
  }

  async initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      this.userId = user?.id || null;
      
      monitor.info('Supabase initialized', {
        module: 'SupabaseService',
        hasSession: !!session,
        hasUser: !!user,
      });
    } catch (error) {
      monitor.error('Failed to initialize Supabase', error, { module: 'SupabaseService' });
      this.userId = null;
    }
  }

  // Artifacts
  async getArtifacts(date: string): Promise<Artifact[]> {
    if (!this.userId) return [];
    return artifactsRepository.findByDate(date, this.userId);
  }

  async saveArtifact(artifact: Artifact, date: string): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    await artifactsRepository.create({
      text: artifact.text,
      task: artifact.task,
      userId: this.userId,
      date,
    });
  }

  async updateArtifacts(artifacts: Artifact[], date: string): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    await artifactsRepository.replaceByDate(date, this.userId, artifacts);
  }

  // Todos
  async getTodos(date: string): Promise<Todo[]> {
    if (!this.userId) return [];
    return todosRepository.findByDate(date, this.userId);
  }

  async saveTodo(todo: Todo, date: string): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    await todosRepository.create({
      text: todo.text,
      completed: todo.completed,
      category: todo.category,
      userId: this.userId,
      date,
    });
  }

  async updateTodo(todo: Todo, _date: string): Promise<void> {
    await todosRepository.update(todo.id, {
      text: todo.text,
      completed: todo.completed,
      category: todo.category,
    });
  }

  async deleteTodo(todoId: string, _date: string): Promise<void> {
    await todosRepository.delete(todoId);
  }

  // Settings
  async getSettings(): Promise<TimerSettings | null> {
    if (!this.userId) return null;
    return settingsRepository.findByUserId(this.userId);
  }

  async saveSettings(settings: TimerSettings): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    await settingsRepository.saveForUser(this.userId, settings);
  }

  // Get all daily data
  async getAllDailyData(): Promise<DailyData> {
    if (!this.userId) return {};

    const [todos, artifacts] = await Promise.all([
      todosRepository.findAll({ filters: { userId: this.userId } }),
      artifactsRepository.findAll({ filters: { userId: this.userId } }),
    ]);

    const dailyData: DailyData = {};

    // Group artifacts by date
    artifacts.forEach(artifact => {
      const date = (artifact as any).date;
      if (!dailyData[date]) {
        dailyData[date] = { artifacts: [], todos: [] };
      }
      dailyData[date].artifacts.push(artifact);
    });

    // Group todos by date
    todos.forEach(todo => {
      const date = (todo as any).date;
      if (!dailyData[date]) {
        dailyData[date] = { artifacts: [], todos: [] };
      }
      dailyData[date].todos.push(todo);
    });

    return dailyData;
  }

  // Real-time subscriptions (legacy support)
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
          const artifacts = await this.getArtifacts(date);
          callback(artifacts);
        }
      )
      .subscribe();
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
          const todos = await this.getTodos(date);
          callback(todos);
        }
      )
      .subscribe();
  }
}

export const supabaseService = new SupabaseService();