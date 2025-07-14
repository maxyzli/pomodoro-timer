import styled, { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #b04a4a;
    height: 100vh;
    overflow-x: hidden;
    color: #333;
    margin: 0;
    padding: 0;
  }
  
  html {
    height: 100%;
    overflow-x: hidden;
  }
`;

export const AppLayout = styled.div`
  height: 100vh;
  width: 100vw;
  background: #b04a4a;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  overflow-x: hidden;
`;

export const AppHeader = styled.header`
  width: 100%;
  background: transparent;
  box-shadow: none;
  border: none;
  padding: 32px 0 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const NavBar = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px 0 0 0;
  width: 100%;
`;

export const NavTab = styled.div<{ active?: boolean }>`
  background: ${({ active }) => (active ? '#fff' : 'transparent')};
  color: ${({ active }) => (active ? '#b04a4a' : '#fff')};
  border-radius: 20px;
  margin: 0 4px;
  padding: 0 18px;
  font-weight: ${({ active }) => (active ? 900 : 700)};
  box-shadow: ${({ active }) => (active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none')};
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  height: 40px;
`;

export const PageContainer = styled.div`
  width: 600px;
  max-width: 90%;
  margin: 40px auto;
  background: rgba(255,255,255,0.04);
  border-radius: 16px;
  padding: 32px;
`;

export const StatsPageContainer = styled.div`
  width: 600px;
  max-width: 90%;
  margin: 40px auto;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
`;