import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Space } from 'antd';

const { TextArea } = Input;

interface FocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (focusTask: string) => void;
}

export const FocusModal: React.FC<FocusModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [focusTask, setFocusTask] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFocusTask('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (focusTask.trim()) {
      onStart(focusTask.trim());
    }
  };

  const handleCancel = () => {
    setFocusTask('');
    onClose();
  };

  return (
    <Modal
      title="What do you want to focus on?"
      open={isOpen}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          disabled={!focusTask.trim()}
        >
          Start Focus Session
        </Button>,
      ]}
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <TextArea
          placeholder="Enter your focus task here... (e.g., 'Complete the React component', 'Write the documentation', 'Review the code')"
          value={focusTask}
          onChange={(e) => setFocusTask(e.target.value)}
          autoFocus
          rows={4}
          autoSize={{ minRows: 4, maxRows: 6 }}
        />
      </Space>
    </Modal>
  );
}; 