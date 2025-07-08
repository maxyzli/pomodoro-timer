import React, { useState } from 'react';
import { Card, Form, InputNumber, Switch, Space, Typography, Button, Row, Col, Divider } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface SettingsPageProps {
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
  onSave: (settings: any) => void;
  onCancel: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSave,
  onCancel,
}) => {
  const [formSettings, setFormSettings] = useState(settings);

  const handleChange = (key: string, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    onSave(formSettings);
  };

  const handleCancel = () => {
    setFormSettings(settings); // Reset to original settings
    onCancel();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            Timer Settings
          </Title>
          <Space>
            <Button icon={<CloseOutlined />} onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              Save Settings
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card size="small" title="Timer Durations">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Form.Item label="Work Time (minutes)">
                  <InputNumber
                    min={1}
                    max={120}
                    value={formSettings.workTime}
                    onChange={(value) => handleChange('workTime', value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Short Break (minutes)">
                  <InputNumber
                    min={1}
                    max={30}
                    value={formSettings.shortBreakTime}
                    onChange={(value) => handleChange('shortBreakTime', value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Long Break (minutes)">
                  <InputNumber
                    min={1}
                    max={60}
                    value={formSettings.longBreakTime}
                    onChange={(value) => handleChange('longBreakTime', value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Sessions before Long Break">
                  <InputNumber
                    min={1}
                    max={10}
                    value={formSettings.longBreakInterval}
                    onChange={(value) => handleChange('longBreakInterval', value)}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card size="small" title="Auto-start Settings">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Form.Item label="Auto-start breaks">
                  <Switch
                    checked={formSettings.autoStartBreaks}
                    onChange={(checked) => handleChange('autoStartBreaks', checked)}
                  />
                </Form.Item>
                <Form.Item label="Auto-start pomodoros">
                  <Switch
                    checked={formSettings.autoStartPomodoros}
                    onChange={(checked) => handleChange('autoStartPomodoros', checked)}
                  />
                </Form.Item>
              </Space>
            </Card>

            <Divider />

            <Card size="small" title="Notifications">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Form.Item label="Sound notifications">
                  <Switch
                    checked={formSettings.soundEnabled}
                    onChange={(checked) => handleChange('soundEnabled', checked)}
                  />
                </Form.Item>
                <Form.Item label="Browser notifications">
                  <Switch
                    checked={formSettings.notificationsEnabled}
                    onChange={(checked) => handleChange('notificationsEnabled', checked)}
                  />
                </Form.Item>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}; 