import { message, Modal } from 'antd';
import { DailyData } from '../hooks/useDailyData';

export interface BackupData {
  version: string;
  exportDate: string;
  dailyData: DailyData;
  totalDays: number;
  totalSessions: number;
}

export const exportBackup = (dailyData: DailyData): void => {
  const backupData: BackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    dailyData,
    totalDays: Object.keys(dailyData).length,
    totalSessions: Object.values(dailyData).reduce((total: number, day: any) => total + (day.artifacts?.length || 0), 0)
  };
  
  const dataStr = JSON.stringify(backupData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const filename = `pomodoro-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', filename);
  linkElement.click();
  
  message.success('Backup exported successfully!');
};

export const importBackup = (
  file: File, 
  onSuccess: (data: DailyData, mode: 'merge' | 'replace') => void
): boolean => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backupData = JSON.parse(e.target?.result as string) as BackupData;
      
      // Validate backup data structure
      if (!backupData.dailyData || typeof backupData.dailyData !== 'object') {
        throw new Error('Invalid backup file format');
      }
      
      // Show confirmation modal
      Modal.confirm({
        title: 'Restore Backup',
        content: `This backup contains ${backupData.totalDays} days of data with ${backupData.totalSessions} total sessions. Do you want to merge with existing data or replace all data?`,
        okText: 'Merge',
        cancelText: 'Replace All',
        onOk: () => {
          onSuccess(backupData.dailyData, 'merge');
          message.success('Backup merged successfully!');
        },
        onCancel: () => {
          onSuccess(backupData.dailyData, 'replace');
          message.success('Backup restored successfully!');
        }
      });
      
    } catch (error) {
      message.error('Invalid backup file. Please select a valid Pomodoro backup.');
    }
  };
  reader.readAsText(file);
  
  return false; // Prevent auto upload
};