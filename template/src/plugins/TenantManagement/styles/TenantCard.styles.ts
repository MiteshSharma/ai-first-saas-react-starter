import styled from 'styled-components';
import { Card } from 'antd';

export const TenantCard = styled(Card)<{ $isSelected?: boolean }>`
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.$isSelected ? '#1890ff' : 'transparent'};

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .ant-card-body {
    padding: 20px;
  }
`;

export const TenantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

export const TenantTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
`;

export const TenantDescription = styled.p`
  margin: 8px 0;
  color: #8c8c8c;
  font-size: 14px;
  line-height: 1.5;
`;

export const TenantMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
`;

export const TenantStats = styled.div`
  display: flex;
  gap: 16px;
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8c8c8c;

  .anticon {
    color: #1890ff;
  }
`;

export const TenantActions = styled.div`
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${TenantCard}:hover & {
    opacity: 1;
  }
`;