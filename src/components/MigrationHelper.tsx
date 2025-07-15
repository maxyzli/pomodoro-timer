import React, { useState } from 'react'
import { Button, Card, Alert, Progress, Typography } from 'antd'
import { migrateLocalStorageToSupabase } from '../utils/migrationHelper'

const { Text } = Typography

interface MigrationResult {
  success: boolean
  migratedDays?: number
  migratedArtifacts?: number
  migratedTodos?: number
  error?: any
}

export const MigrationHelper: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const migrationResult = await migrateLocalStorageToSupabase()
      setResult(migrationResult || { success: true })
    } catch (error) {
      setResult({ success: false, error })
    } finally {
      setIsRunning(false)
    }
  }

  const hasLocalData = () => {
    const stored = localStorage.getItem('pomodoroDailyData')
    return stored && stored !== '{}'
  }

  const alreadyMigrated = () => {
    return localStorage.getItem('supabaseMigrationCompleted') === 'true'
  }

  if (alreadyMigrated()) {
    return (
      <Card title="Migration Status">
        <Alert
          message="Migration Complete"
          description="Your data has already been migrated to Supabase."
          type="success"
          showIcon
        />
      </Card>
    )
  }

  if (!hasLocalData()) {
    return (
      <Card title="Migration Status">
        <Alert
          message="No Data to Migrate"
          description="No local data found to migrate to Supabase."
          type="info"
          showIcon
        />
      </Card>
    )
  }

  return (
    <Card title="Migrate Data to Supabase">
      <div style={{ marginBottom: 16 }}>
        <Text>
          Migrate your existing localStorage data to Supabase for cloud sync and backup.
        </Text>
      </div>

      {isRunning && (
        <div style={{ marginBottom: 16 }}>
          <Text>Migrating your data...</Text>
          <Progress percent={100} status="active" />
        </div>
      )}

      {result && (
        <div style={{ marginBottom: 16 }}>
          {result.success ? (
            <Alert
              message="Migration Successful!"
              description={
                <div>
                  <p>Your data has been successfully migrated to Supabase:</p>
                  <ul>
                    <li>Days migrated: {result.migratedDays || 0}</li>
                    <li>Artifacts migrated: {result.migratedArtifacts || 0}</li>
                    <li>Todos migrated: {result.migratedTodos || 0}</li>
                  </ul>
                </div>
              }
              type="success"
              showIcon
            />
          ) : (
            <Alert
              message="Migration Failed"
              description={`Error: ${result.error?.message || 'Unknown error occurred'}`}
              type="error"
              showIcon
            />
          )}
        </div>
      )}

      <Button
        type="primary"
        onClick={runMigration}
        loading={isRunning}
        disabled={result?.success}
      >
        {result?.success ? 'Migration Complete' : 'Start Migration'}
      </Button>
    </Card>
  )
}