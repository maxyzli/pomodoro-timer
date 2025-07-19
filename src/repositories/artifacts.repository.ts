/**
 * Artifacts repository implementation
 * Production-grade data access layer
 */

import { BaseRepository, QueryOptions } from './base.repository';
import { supabase } from '../lib/supabase';
import { Artifact } from '../hooks/useDailyData';
import { monitor } from '../core/monitoring';
import { ValidationError } from '../core/errors';
import { ArtifactSchema } from '../validation/schemas';

interface ArtifactRecord {
  id: string;
  user_id: string;
  text: string;
  timestamp: string;
  task: string;
  date: string;
  created_at: string;
}

export interface ArtifactFilters {
  date?: string;
  dateRange?: { start: string; end: string };
  task?: string;
  userId?: string;
}

export class ArtifactsRepository extends BaseRepository<Artifact> {
  protected tableName = 'artifacts';
  protected moduleName = 'ArtifactsRepository';

  async findById(id: string): Promise<Artifact | null> {
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

      return this.mapToArtifact(data);
    });
  }

  async findAll(options?: QueryOptions & { filters?: ArtifactFilters }): Promise<Artifact[]> {
    return this.executeQuery('findAll', async () => {
      let query = supabase.from(this.tableName).select('*');

      if (options?.filters) {
        const { date, dateRange, task, userId } = options.filters;
        
        if (date) {
          query = query.eq('date', date);
        } else if (dateRange) {
          query = query.gte('date', dateRange.start).lte('date', dateRange.end);
        }
        
        if (task) query = query.eq('task', task);
        if (userId) query = query.eq('user_id', userId);
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection === 'asc',
        });
      } else {
        query = query.order('timestamp', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapToArtifact);
    });
  }

  async findByDate(date: string, userId: string): Promise<Artifact[]> {
    return this.findAll({
      filters: { date, userId },
      orderBy: 'timestamp',
      orderDirection: 'desc',
    });
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    userId: string
  ): Promise<Artifact[]> {
    return this.findAll({
      filters: {
        dateRange: { start: startDate, end: endDate },
        userId,
      },
      orderBy: 'date',
      orderDirection: 'desc',
    });
  }

  async create(data: Omit<Artifact, 'timestamp'> & { userId: string; date: string }): Promise<Artifact> {
    return this.executeQuery('create', async () => {
      const artifact: Artifact = {
        ...data,
        timestamp: new Date().toISOString(),
      };

      const validation = ArtifactSchema.safeParse(artifact);
      if (!validation.success) {
        throw new ValidationError(
          'Invalid artifact data',
          validation.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }

      const record: Partial<ArtifactRecord> = {
        user_id: data.userId,
        text: validation.data.text,
        timestamp: validation.data.timestamp,
        task: validation.data.task || '',
        date: data.date,
      };

      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(record)
        .select()
        .single();

      if (error) throw error;

      monitor.info('Artifact created', {
        module: this.moduleName,
        artifactId: created.id,
      });

      return this.mapToArtifact(created);
    });
  }

  async update(id: string, data: Partial<Artifact>): Promise<Artifact> {
    return this.executeQuery('update', async () => {
      const updates: Partial<ArtifactRecord> = {};
      
      if (data.text !== undefined) updates.text = data.text;
      if (data.task !== undefined) updates.task = data.task;

      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      monitor.info('Artifact updated', {
        module: this.moduleName,
        artifactId: id,
      });

      return this.mapToArtifact(updated);
    });
  }

  async delete(id: string): Promise<void> {
    return this.executeQuery('delete', async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      monitor.info('Artifact deleted', {
        module: this.moduleName,
        artifactId: id,
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

      monitor.info('Artifacts deleted by date', {
        module: this.moduleName,
        date,
      });
    });
  }

  async replaceByDate(
    date: string,
    userId: string,
    artifacts: Omit<Artifact, 'timestamp'>[]
  ): Promise<Artifact[]> {
    return this.executeQuery('replaceByDate', async () => {
      await this.deleteByDate(date, userId);

      if (artifacts.length === 0) {
        return [];
      }

      const records = artifacts.map(artifact => {
        const fullArtifact: Artifact = {
          ...artifact,
          timestamp: new Date().toISOString(),
        };

        const validation = ArtifactSchema.safeParse(fullArtifact);
        if (!validation.success) {
          throw new ValidationError(
            'Invalid artifact data',
            validation.error.issues.map((e: any) => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          );
        }

        return {
          user_id: userId,
          text: validation.data.text,
          timestamp: validation.data.timestamp,
          task: validation.data.task || '',
          date,
        };
      });

      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(records)
        .select();

      if (error) throw error;

      monitor.info('Artifacts replaced by date', {
        module: this.moduleName,
        date,
        count: created.length,
      });

      return created.map(this.mapToArtifact);
    });
  }

  private mapToArtifact(record: ArtifactRecord): Artifact {
    return {
      text: record.text,
      timestamp: record.timestamp,
      task: record.task || '',
    };
  }
}

export const artifactsRepository = new ArtifactsRepository();