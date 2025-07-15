import { supabaseService } from '../services/supabaseService'
import { DailyData } from '../hooks/useDailyData'

export async function migrateLocalStorageToSupabase() {
  const STORAGE_KEY = 'pomodoroDailyData'
  const MIGRATION_KEY = 'supabaseMigrationCompleted'

  // Check if migration has already been completed
  const migrationCompleted = localStorage.getItem(MIGRATION_KEY)
  if (migrationCompleted === 'true') {
    console.log('Migration already completed')
    return
  }

  try {
    // Get data from localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      console.log('No data to migrate')
      localStorage.setItem(MIGRATION_KEY, 'true')
      return
    }

    const localData = JSON.parse(stored) as DailyData
    console.log('Starting migration of data...')

    // Initialize Supabase service
    await supabaseService.initialize()

    // Migrate each day's data
    let migratedDays = 0
    let migratedArtifacts = 0
    let migratedTodos = 0

    for (const [date, dayData] of Object.entries(localData)) {
      try {
        // Migrate artifacts
        if (dayData.artifacts && dayData.artifacts.length > 0) {
          await supabaseService.updateArtifacts(dayData.artifacts, date)
          migratedArtifacts += dayData.artifacts.length
        }

        // Migrate todos
        if (dayData.todos && dayData.todos.length > 0) {
          for (const todo of dayData.todos) {
            await supabaseService.saveTodo(todo, date)
            migratedTodos++
          }
        }

        migratedDays++
      } catch (error) {
        console.error(`Error migrating data for ${date}:`, error)
      }
    }

    // Mark migration as completed
    localStorage.setItem(MIGRATION_KEY, 'true')
    
    console.log(`Migration completed successfully!`)
    console.log(`Migrated ${migratedDays} days of data`)
    console.log(`Migrated ${migratedArtifacts} artifacts`)
    console.log(`Migrated ${migratedTodos} todos`)

    return {
      success: true,
      migratedDays,
      migratedArtifacts,
      migratedTodos
    }
  } catch (error) {
    console.error('Migration failed:', error)
    return {
      success: false,
      error
    }
  }
}