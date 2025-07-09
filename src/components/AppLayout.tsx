import React from 'react';
import { Typography } from 'antd';
import { AppLayout as StyledAppLayout, AppHeader, NavBar, NavTab, GlobalStyle } from '../styles/Layout.styles';

const { Title, Text } = Typography;

export type Page = 'timer' | 'settings' | 'todo' | 'stats';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
}

interface AppLayoutProps {
  currentPage: Page;
  navItems: NavItem[];
  onPageChange: (page: Page) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  navItems,
  onPageChange,
  children
}) => {
  return (
    <>
      <GlobalStyle />
      <StyledAppLayout>
        <AppHeader>
          <Title level={2} style={{ color: 'white', margin: 0, textAlign: 'center' }}>
            Pomodoro Timer
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.85)', display: 'block', textAlign: 'center', marginBottom: 8 }}>
            Stay focused, stay productive
          </Text>
          <NavBar>
            {navItems.map(item => (
              <NavTab
                key={item.key}
                active={currentPage === item.key}
                onClick={() => onPageChange(item.key as Page)}
              >
                {item.icon} <span style={{ marginLeft: 6 }}>{item.label}</span>
              </NavTab>
            ))}
          </NavBar>
        </AppHeader>
        {children}
      </StyledAppLayout>
    </>
  );
};