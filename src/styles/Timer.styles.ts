import styled from 'styled-components';

export const TimerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 16px;
  max-height: calc(100vh - 200px);
`;

export const ModeTabs = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
  gap: 16px;
`;

export const ModeTab = styled.button<{ active?: boolean }>`
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 10px 32px;
  border-radius: 24px;
  background: ${({ active }) => (active ? '#fff' : 'transparent')};
  color: ${({ active }) => (active ? '#b04a4a' : '#fff')};
  border: 2px solid #fff;
  transition: background 0.2s, color 0.2s;
  box-shadow: ${({ active }) => (active ? '0 2px 8px rgba(0,0,0,0.10)' : 'none')};
  cursor: pointer;
  outline: none;
  margin: 0 4px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const TimerDisplay = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

export const TimeText = styled.div`
  font-size: 6rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 16px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.10);
  white-space: nowrap;
  line-height: 1;
`;

export const StartButton = styled.button`
  background: #fff;
  color: #b04a4a;
  border: none;
  font-size: 2rem;
  font-weight: 900;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  transition: background 0.2s;
  width: 240px;
  height: 72px;
  margin: 32px 0 24px 0;
  letter-spacing: 2px;
  cursor: pointer;
  
  &:hover, &:focus {
    background: #ffeaea;
    color: #b04a4a;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const CurrentTask = styled.div`
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
  font-size: 1.2rem;
  border-radius: 12px;
  padding: 16px 32px;
  min-width: 320px;
  text-align: center;
`;