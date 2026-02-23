// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useEffect, useState } from 'react';
import { Card, Badge, Space, Button, Tooltip, Typography } from 'antd';
import { RedoOutlined, DatabaseOutlined, ClusterOutlined } from '@ant-design/icons';
import { systemApi } from '../../api-client/clients';
import type { SystemHealthResponse } from '../../api-client';

const { Text } = Typography;

const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await systemApi.healthRetrieve();
      setHealth(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusColor = (status: string) => {
    if (status.includes('Connected') || status.includes('Running')) return 'success';
    if (status.includes('Unknown')) return 'warning';
    return 'error';
  };

  return (
    <Card
      title="System Health"
      size="small"
      extra={
        <Tooltip title="Refresh Status">
          <Button type="text" icon={<RedoOutlined spin={loading} />} onClick={checkHealth} />
        </Tooltip>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <DatabaseOutlined />
            <Text>Database</Text>
          </Space>
          <Badge status={getStatusColor(health?.database || '') as any} text={health?.database || 'Loading...'} />
        </Space>

        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <ClusterOutlined />
            <Text>Task Queue (Celery)</Text>
          </Space>
          <Badge status={getStatusColor(health?.celery || '') as any} text={health?.celery || 'Loading...'} />
        </Space>

        {lastUpdated && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </Space>
    </Card>
  );
};

export default SystemHealth;
