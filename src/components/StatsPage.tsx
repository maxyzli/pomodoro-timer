import React from 'react';
import { DatePicker, Button, List, Popconfirm } from 'antd';
import { DownloadOutlined, DeleteOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { StatsPageContainer } from '../styles/Layout.styles';
import { Artifact } from '../hooks/useDailyData';

interface StatsPageProps {
  selectedDate: string;
  artifacts: Artifact[];
  getTodayKey: () => string;
  onDateChange: (date: string) => void;
  onDownloadStats: () => void;
  onDeleteArtifact: (index: number) => void;
}

export const StatsPage: React.FC<StatsPageProps> = ({
  selectedDate,
  artifacts,
  getTodayKey,
  onDateChange,
  onDownloadStats,
  onDeleteArtifact
}) => {
  const isToday = selectedDate === getTodayKey();

  const handlePreviousDay = () => {
    const currentDate = dayjs(selectedDate);
    const previousDate = currentDate.subtract(1, 'day');
    onDateChange(previousDate.format('YYYY-MM-DD'));
  };

  const handleNextDay = () => {
    const currentDate = dayjs(selectedDate);
    const nextDate = currentDate.add(1, 'day');
    const today = dayjs(getTodayKey());
    
    // Don't allow navigation beyond today
    if (nextDate.isAfter(today)) return;
    
    onDateChange(nextDate.format('YYYY-MM-DD'));
  };

  const canGoNext = !dayjs(selectedDate).isSame(dayjs(getTodayKey()), 'day');

  return (
    <StatsPageContainer>
      <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 16 }}>
        Work Log
      </div>
      
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button 
              icon={<LeftOutlined />} 
              onClick={handlePreviousDay}
              size="small"
              title="Previous day"
            />
            <DatePicker
              value={selectedDate ? dayjs(selectedDate) : null}
              onChange={(date) => onDateChange(date ? date.format('YYYY-MM-DD') : getTodayKey())}
              format="YYYY-MM-DD"
              placeholder="Select date"
              allowClear={false}
            />
            <Button 
              icon={<RightOutlined />} 
              onClick={handleNextDay}
              disabled={!canGoNext}
              size="small"
              title="Next day"
            />
          </div>
          <div>
            <strong>{isToday ? "Today's" : `${selectedDate}'s`} Sessions:</strong> {artifacts.length}
          </div>
        </div>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={onDownloadStats}
          disabled={artifacts.length === 0}
        >
          Download Log
        </Button>
      </div>
      
      <List
        dataSource={artifacts}
        renderItem={(item, idx) => (
          <List.Item
            actions={isToday ? [
              <Popconfirm
                title="Delete this work session?"
                onConfirm={() => onDeleteArtifact(idx)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" icon={<DeleteOutlined />} danger size="small" />
              </Popconfirm>
            ] : []}
          >
            <div>
              <strong>Session {artifacts.length - idx}</strong> 
              <span style={{ color: '#666', fontSize: 12 }}> ({item.timestamp})</span>
              
              <div style={{ marginTop: 8, color: '#333', fontWeight: 500 }}>Task:</div>
              <div style={{ marginLeft: 16, color: '#111', marginBottom: 8 }}>
                {item.task ? item.task : <span style={{ color: '#666' }}>—</span>}
              </div>
              
              <div style={{ color: '#333', fontWeight: 500 }}>Artifact:</div>
              <div style={{ marginLeft: 16, color: '#111' }}>{item.text}</div>
            </div>
          </List.Item>
        )}
        style={{ width: '100%' }}
      />
    </StatsPageContainer>
  );
};