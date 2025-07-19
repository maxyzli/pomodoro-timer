/**
 * Settings repository implementation
 * Production-grade data access for user settings
 */

import { BaseRepository } from './base.repository';
import { supabase } from '../lib/supabase';
import { TimerSettings } from '../types';
import { monitor } from '../core/monitoring';
import { ValidationError } from '../core/errors';
import { TimerSettingsSchema } from '../validation/schemas';

interface SettingsRecord {
  id: string;
  user_id: string;
  work_time: number;
  short_break_time: number;
  long_break_time: number;
  long_break_interval: number;
  auto_start_breaks: boolean;
  auto_start_pomodoros: boolean;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export class SettingsRepository extends BaseRepository<TimerSettings> {
  protected tableName = 'settings';
  protected moduleName = 'SettingsRepository';

  async findById(id: string): Promise<TimerSettings | null> {
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

      return this.mapToSettings(data);
    });
  }

  async findByUserId(userId: string): Promise<TimerSettings | null> {
    return this.executeQuery('findByUserId', async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapToSettings(data);
    });
  }

  async findAll(): Promise<TimerSettings[]> {
    throw new Error('findAll not supported for settings');
  }

  async create(_data: any): Promise<TimerSettings> {
    throw new Error('Use saveForUser instead of create');
  }

  async update(id: string, data: Partial<TimerSettings>): Promise<TimerSettings> {
    return this.executeQuery('update', async () => {
      const validation = TimerSettingsSchema.safeParse(data);
      if (!validation.success && Object.keys(data).length > 0) {
        throw new ValidationError(
          'Invalid settings data',
          validation.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }

      const updates: Partial<SettingsRecord> = {};
      
      if (data.workTime !== undefined) updates.work_time = data.workTime;
      if (data.shortBreakTime !== undefined) updates.short_break_time = data.shortBreakTime;
      if (data.longBreakTime !== undefined) updates.long_break_time = data.longBreakTime;
      if (data.longBreakInterval !== undefined) updates.long_break_interval = data.longBreakInterval;
      if (data.autoStartBreaks !== undefined) updates.auto_start_breaks = data.autoStartBreaks;
      if (data.autoStartPomodoros !== undefined) updates.auto_start_pomodoros = data.autoStartPomodoros;
      if (data.soundEnabled !== undefined) updates.sound_enabled = data.soundEnabled;
      if (data.notificationsEnabled !== undefined) updates.notifications_enabled = data.notificationsEnabled;
      
      updates.updated_at = new Date().toISOString();

      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      monitor.info('Settings updated', {
        module: this.moduleName,
        settingsId: id,
        updates: Object.keys(updates),
      });

      return this.mapToSettings(updated);
    });
  }

  async delete(id: string): Promise<void> {
    return this.executeQuery('delete', async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      monitor.info('Settings deleted', {
        module: this.moduleName,
        settingsId: id,
      });
    });
  }

  async saveForUser(userId: string, settings: TimerSettings): Promise<TimerSettings> {
    return this.executeQuery('saveForUser', async () => {
      const validation = TimerSettingsSchema.safeParse(settings);
      if (!validation.success) {
        throw new ValidationError(
          'Invalid settings data',
          validation.error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
      }

      const record: Partial<SettingsRecord> = {
        user_id: userId,
        work_time: validation.data.workTime,
        short_break_time: validation.data.shortBreakTime,
        long_break_time: validation.data.longBreakTime,
        long_break_interval: validation.data.longBreakInterval,
        auto_start_breaks: validation.data.autoStartBreaks,
        auto_start_pomodoros: validation.data.autoStartPomodoros,
        sound_enabled: validation.data.soundEnabled,
        notifications_enabled: validation.data.notificationsEnabled,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error } = await supabase
        .from(this.tableName)
        .upsert(record, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      monitor.info('Settings saved for user', {
        module: this.moduleName,
        userId: '[REDACTED]',
      });

      return this.mapToSettings(upserted);
    });
  }

  private mapToSettings(record: SettingsRecord): TimerSettings {
    return {
      workTime: record.work_time,
      shortBreakTime: record.short_break_time,
      longBreakTime: record.long_break_time,
      longBreakInterval: record.long_break_interval,
      autoStartBreaks: record.auto_start_breaks,
      autoStartPomodoros: record.auto_start_pomodoros,
      soundEnabled: record.sound_enabled,
      notificationsEnabled: record.notifications_enabled,
    };
  }
}

export const settingsRepository = new SettingsRepository();