/**
 * Database initialization and health check service
 * Ensures all required tables and policies exist
 */

import { supabase } from '../lib/supabase';
import { monitor } from '../core/monitoring';

export class DatabaseInitService {
  static async checkHealth(): Promise<boolean> {
    try {
      // Simple health check - try to authenticate
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        monitor.error('Database health check failed - auth error', error, {
          module: 'DatabaseInitService',
        });
        return false;
      }

      monitor.info('Database health check passed', {
        module: 'DatabaseInitService',
        hasUser: !!user,
      });

      return true;
    } catch (error) {
      monitor.error('Database health check failed', error, {
        module: 'DatabaseInitService',
      });
      return false;
    }
  }

  static async ensureTablesExist(): Promise<boolean> {
    try {
      // Check if tables exist by trying a simple query
      const checks = await Promise.allSettled([
        supabase.from('todos').select('count', { count: 'exact', head: true }),
        supabase.from('artifacts').select('count', { count: 'exact', head: true }),
        supabase.from('settings').select('count', { count: 'exact', head: true }),
      ]);

      const results = checks.map(result => result.status === 'fulfilled');
      const allTablesExist = results.every(Boolean);

      monitor.info('Table existence check completed', {
        module: 'DatabaseInitService',
        todos: results[0],
        artifacts: results[1],
        settings: results[2],
        allExist: allTablesExist,
      });

      return allTablesExist;
    } catch (error) {
      monitor.error('Failed to check table existence', error, {
        module: 'DatabaseInitService',
      });
      return false;
    }
  }

  static async initialize(): Promise<{ success: boolean; message: string }> {
    try {
      monitor.info('Starting database initialization', {
        module: 'DatabaseInitService',
      });

      // Check basic connectivity
      const healthOk = await this.checkHealth();
      if (!healthOk) {
        return {
          success: false,
          message: 'Database health check failed - check Supabase connection',
        };
      }

      // Check if tables exist
      const tablesExist = await this.ensureTablesExist();
      if (!tablesExist) {
        return {
          success: false,
          message: 'Required database tables do not exist - please run the schema.sql file in your Supabase project',
        };
      }

      monitor.info('Database initialization completed successfully', {
        module: 'DatabaseInitService',
      });

      return {
        success: true,
        message: 'Database initialized successfully',
      };
    } catch (error) {
      monitor.error('Database initialization failed', error, {
        module: 'DatabaseInitService',
      });

      return {
        success: false,
        message: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export const databaseInit = DatabaseInitService;