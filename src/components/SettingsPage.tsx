import React, { useState } from 'react';
import { Card, Form, InputNumber, Switch, Space, Typography, Button, Row, Col, Divider, Upload, Alert } from 'antd';
import { CloudDownloadOutlined, UploadOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { AuthModal } from './AuthModal';
import { useAuth } from '../contexts/AuthContext';

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
  onBackupExport?: () => void;
  onBackupImport?: (file: File) => boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSave,
  onBackupExport,
  onBackupImport,
}) => {
  const [formSettings, setFormSettings] = useState(settings);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut } = useAuth();

  const handleChange = (key: string, value: any) => {
    const updated = {
      ...formSettings,
      [key]: value,
    };
    setFormSettings(updated);
    onSave(updated); // Auto-save on change
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Authentication Section - Moved to top */}
      <Card title="Account & Sync" style={{ marginBottom: 16 }}>
        {user ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Signed In"
              description={`You are signed in as ${user.email}. Your data is being synced to the cloud.`}
              type="success"
              showIcon
            />
            <Button 
              icon={<LogoutOutlined />}
              onClick={signOut}
              type="default"
            >
              Sign Out
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Not Signed In"
              description="Sign in to sync your data across devices and keep it backed up safely."
              type="info"
              showIcon
            />
            <Button 
              icon={<UserOutlined />}
              onClick={() => setShowAuthModal(true)}
              type="primary"
            >
              Sign In
            </Button>
          </Space>
        )}
      </Card>

      <Card>
        {/* Remove Cancel/Save buttons */}
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

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card size="small" title="Data Backup & Restore">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <Typography.Text>
                    Backup your entire Pomodoro history including all daily data, todos, and session artifacts.
                  </Typography.Text>
                </div>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Button
                      type="primary"
                      icon={<CloudDownloadOutlined />}
                      onClick={onBackupExport}
                      block
                      size="large"
                    >
                      Export Backup
                    </Button>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Upload
                      accept=".json"
                      beforeUpload={onBackupImport}
                      showUploadList={false}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        block
                        size="large"
                      >
                        Import Backup
                      </Button>
                    </Upload>
                  </Col>
                </Row>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Backup files contain all your historical data and can be imported on any device.
                  Import will give you the option to merge with existing data or replace it entirely.
                </Typography.Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>


      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}; 