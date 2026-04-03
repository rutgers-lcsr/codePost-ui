// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React from 'react';
import { Space, Typography } from 'antd';

const { Title, Text } = Typography;

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, subtitle, actions }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 16,
    }}
  >
    <div>
      <Title level={2} style={{ margin: 0, fontSize: 22 }}>
        {title}
      </Title>
      {subtitle && (
        <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: 'block' }}>
          {subtitle}
        </Text>
      )}
    </div>
    {actions && <Space>{actions}</Space>}
  </div>
);

export default AdminPageHeader;
