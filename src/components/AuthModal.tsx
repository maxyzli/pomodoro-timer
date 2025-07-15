import React, { useState } from 'react'
import { Modal, Input, Button, message, Typography, Space } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'

const { Text } = Typography

interface AuthModalProps {
  visible: boolean
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleMagicLink = async () => {
    if (!email) {
      message.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      })

      if (error) throw error

      setEmailSent(true)
      message.success('Magic link sent! Check your email.')
    } catch (error: any) {
      message.error(error.message || 'Error sending magic link')
    } finally {
      setLoading(false)
    }
  }

  const handleSkipAuth = () => {
    // Continue without authentication (anonymous mode)
    onClose()
  }

  return (
    <Modal
      title="Sign in to sync your data"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Text type="secondary">
          Sign in to sync your pomodoro data across devices and keep it backed up safely.
        </Text>

        {!emailSent ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onPressEnter={handleMagicLink}
              size="large"
            />
            
            <Button
              type="primary"
              onClick={handleMagicLink}
              loading={loading}
              size="large"
              block
            >
              Send Magic Link
            </Button>
          </Space>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <Text>
              We've sent a magic link to <strong>{email}</strong>
            </Text>
            <br />
            <Text type="secondary">
              Click the link in your email to sign in. This window will automatically detect when you're signed in.
            </Text>
          </div>
        )}

        <Button
          type="link"
          onClick={handleSkipAuth}
          block
        >
          Continue without signing in
        </Button>
      </Space>
    </Modal>
  )
}