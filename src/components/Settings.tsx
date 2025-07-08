import React from 'react';
import { Card, Form, InputNumber, Switch, Space, Typography } from 'antd';

const { Title } = Typography;

interface SettingsProps {
  settings: {
    workTime: number;
    shortBreakTime: number;
    longBreakTime: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSettingsChange,
}) => {
  const handleChange = (key: string, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <Card size="small" style={{ marginTop: 16 }}>
      <Title level={4} style={{ textAlign: 'center', marginBottom: 16 }}>
        Timer Settings
      </Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={5}>Timer Durations (minutes)</Title>
          <Space>
            <Form.Item label="Work Time">
              <InputNumber
                min={1}
                max={120}
                value={settings.workTime}
                onChange={(value) => handleChange('workTime', value)}
              />
            </Form.Item>
            <Form.Item label="Short Break">
              <InputNumber
                min={1}
                max={30}
                value={settings.shortBreakTime}
                onChange={(value) => handleChange('shortBreakTime', value)}
              />
            </Form.Item>
            <Form.Item label="Long Break">
              <InputNumber
                min={1}
                max={60}
                value={settings.longBreakTime}
                onChange={(value) => handleChange('longBreakTime', value)}
              />
            </Form.Item>
          </Space>
        </div>

        <div>
          <Title level={5}>Auto-start Settings</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item label="Auto-start breaks">
              <Switch
                checked={settings.autoStartBreaks}
                onChange={(checked) => handleChange('autoStartBreaks', checked)}
              />
            </Form.Item>
            <Form.Item label="Auto-start pomodoros">
              <Switch
                checked={settings.autoStartPomodoros}
                onChange={(checked) => handleChange('autoStartPomodoros', checked)}
              />
            </Form.Item>
          </Space>
        </div>

        <div>
          <Title level={5}>Notifications</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item label="Sound notifications">
              <Switch
                checked={settings.soundEnabled}
                onChange={(checked) => handleChange('soundEnabled', checked)}
              />
            </Form.Item>
            <Form.Item label="Browser notifications">
              <Switch
                checked={settings.notificationsEnabled}
                onChange={(checked) => handleChange('notificationsEnabled', checked)}
              />
            </Form.Item>
          </Space>
        </div>
      </Space>
    </Card>
  );
}; 