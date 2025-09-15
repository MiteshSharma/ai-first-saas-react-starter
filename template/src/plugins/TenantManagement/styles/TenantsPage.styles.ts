import styled from 'styled-components';
import { Layout } from 'antd';

const { Content } = Layout;

export const PageContainer = styled(Content)`
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
`;

export const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export const PageTitle = styled.div`
  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: #262626;
  }

  p {
    margin: 4px 0 0 0;
    color: #8c8c8c;
    font-size: 16px;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const TenantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

export const SidePanel = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;

  @media (max-width: 1200px) {
    order: -1;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .anticon {
    font-size: 64px;
    color: #d9d9d9;
    margin-bottom: 16px;
  }

  h3 {
    color: #262626;
    margin-bottom: 8px;
  }

  p {
    color: #8c8c8c;
    margin-bottom: 24px;
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;