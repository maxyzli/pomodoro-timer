/**
 * Todos repository implementation
 * Production-grade data access layer with proper error handling
 */

import { BaseRepository, PaginatedResult, QueryOptions } from './base.repository';
import { supabase } from '../lib/supabase';
import { Todo, EisenhowerCategory } from '../hooks/useDailyData';
import { monitor } from '../core/monitoring';
import { ValidationError } from '../core/errors';
import { TodoSchema } from '../validation/schemas';

interface TodoRecord {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  category: EisenhowerCategory;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface TodoFilters {
  date?: string;
  category?: EisenhowerCategory;
  completed?: boolean;
  userId?: string;
}

export class TodosRepository extends BaseRepository<Todo> {
  protected tableName = 'todos';
  protected moduleName = 'TodosRepository';

  async findById(id: string): Promise<Todo | null> {
    return this.executeQuery('findById', async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapToTodo(data);
    });
  }

  async findAll(options?: QueryOptions & { filters?: TodoFilters }): Promise<Todo[]> {
    return this.executeQuery('findAll', async () => {
      let query = supabase.from(this.tableName).select('*');

      if (options?.filters) {
        const { date, category, completed, userId } = options.filters;
        if (date) query = query.eq('date', date);
        if (category) query = query.eq('category', category);
        if (completed !== undefined) query = query.eq('completed', completed);
        if (userId) query = query.eq('user_id', userId);
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection === 'asc',
        });
      } else {
        query = query.order('created_at', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToTodo);
    });
  }

  async findByDate(date: string, userId: string): Promise<Todo[]> {
    return this.findAll({
      filters: { date, userId },
      orderBy: 'created_at',
      orderDirection: 'asc',
    });
  }

  async findPaginated(
    filters: TodoFilters,
    page = 0,
    limit = 50
  ): Promise<PaginatedResult<Todo>> {
    return this.executeQuery('findPaginated', async () => {
      const offset = page * limit;

      let countQuery = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from(this.tableName)
        .select('*')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (filters.date) {
        countQuery = countQuery.eq('date', filters.date);
        dataQuery = dataQuery.eq('date', filters.date);
      }
      if (filters.category) {
        countQuery = countQuery.eq('category', filters.category);
        dataQuery = dataQuery.eq('category', filters.category);
      }
      if (filters.completed !== undefined) {
        countQuery = countQuery.eq('completed', filters.completed);
        dataQuery = dataQuery.eq('completed', filters.completed);
      }
      if (filters.userId) {
        countQuery = countQuery.eq('user_id', filters.userId);
        dataQuery = dataQuery.eq('user_id', filters.userId);
      }

      const [countResult, dataResult] = await Promise.all([
        countQuery,
        dataQuery,
      ]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      const total = countResult.count || 0;
      const todos = (dataResult.data || []).map(this.mapToTodo);

      return {
        data: todos,
        total,
        page,
        pageSize: limit,
        hasMore: offset + todos.length < total,
      };
    });
  }

  async create(data: Omit<Todo, 'id'> & { userId: string; date: string }): Promise<Todo> {
    return this.executeQuery('create', async () => {
      const validation = TodoSchema.safeParse({ ...data, id: crypto.randomUUID() });
      if (!validation.success) {
        throw new ValidationError(
          'Invalid todo data',
          validation.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }

      const record: Partial<TodoRecord> = {
        id: validation.data.id,
        user_id: data.userId,
        text: validation.data.text,
        completed: validation.data.completed,
        category: validation.data.category,
        date: data.date,
      };

      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(record)
        .select()
        .single();

      if (error) throw error;

      monitor.info('Todo created', {
        module: this.moduleName,
        todoId: created.id,
      });

      return this.mapToTodo(created);
    });
  }

  async update(id: string, data: Partial<Todo>): Promise<Todo> {
    return this.executeQuery('update', async () => {
      const updates: Partial<TodoRecord> = {};
      
      if (data.text !== undefined) updates.text = data.text;
      if (data.completed !== undefined) updates.completed = data.completed;
      if (data.category !== undefined) updates.category = data.category;
      
      updates.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      monitor.info('Todo updated', {
        module: this.moduleName,
        todoId: id,
        updates: Object.keys(updates),
      });

      return this.mapToTodo(updated);
    });
  }

  async delete(id: string): Promise<void> {
    return this.executeQuery('delete', async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      monitor.info('Todo deleted', {
        module: this.moduleName,
        todoId: id,
      });
    });
  }

  async deleteByDate(date: string, userId: string): Promise<void> {
    return this.executeQuery('deleteByDate', async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('date', date)
        .eq('user_id', userId);

      if (error) throw error;

      monitor.info('Todos deleted by date', {
        module: this.moduleName,
        date,
      });
    });
  }

  async batchCreate(todos: Array<Omit<Todo, 'id'> & { userId: string; date: string }>): Promise<Todo[]> {
    return this.executeQuery('batchCreate', async () => {
      const records = todos.map(todo => {
        const validation = TodoSchema.safeParse({ ...todo, id: crypto.randomUUID() });
        if (!validation.success) {
          throw new ValidationError(
            'Invalid todo data in batch',
            validation.error.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          );
        }

        return {
          id: validation.data.id,
          user_id: todo.userId,
          text: validation.data.text,
          completed: validation.data.completed,
          category: validation.data.category,
          date: todo.date,
        };
      });

      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(records)
        .select();

      if (error) throw error;

      monitor.info('Batch todos created', {
        module: this.moduleName,
        count: created.length,
      });

      return created.map(this.mapToTodo);
    });
  }

  private mapToTodo(record: TodoRecord): Todo {
    return {
      id: record.id,
      text: record.text,
      completed: record.completed,
      category: record.category,
    };
  }
}

export const todosRepository = new TodosRepository();