// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AutoDetectStatus Component
 *
 * Displays environment auto-detect status including:
 * - Success rate and run counts
 * - Current version info
 * - Pending modules being tracked
 * - Version history with rollback options
 * - Admin actions (cleanup, rollback, convert to manual)
 */
import React, { useState } from 'react';
import {
  Card,
  Statistic,
  Alert,
  Button,
  Modal,
  Tag,
  Timeline,
  Space,
  Popconfirm,
  message,
  Row,
  Col,
  Progress,
  Divider,
  Typography,
} from 'antd';
import {
  RollbackOutlined,
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { EnvironmentType } from '../../../../../../types/models';
import CPTooltip from '../../../../../core/CPTooltip';

interface AutoDetectStatusProps {
  environment: EnvironmentType;
  onRefresh: () => void;
}

interface VersionEntry {
  version: number;
  image_name: string;
  requirements: string;
  built_at: string;
  status: string;
  successful_runs?: number;
  total_runs?: number;
}

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const AutoDetectStatus: React.FC<AutoDetectStatusProps> = ({ environment, onRefresh }) => {
  const [historyVisible, setHistoryVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const successRate = environment.successRate || 0;
  const pendingModules = Object.keys(environment.convergenceStats || {});
  const history: VersionEntry[] = environment.imageHistory || [];

  const getStatusColor = (rate: number) => {
    if (rate >= 80) return '#52c41a';
    if (rate >= 50) return '#faad14';
    return '#f5222d';
  };

  const handleRollback = async (version?: number) => {
    setActionLoading('rollback');
    try {
      const response = await fetch(`${API_URL}/autograder/environments/${environment.id}/rollback/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ version }),
      });

      if (response.ok) {
        message.success('Rolled back successfully');
        onRefresh();
      } else {
        const data = await response.json();
        message.error(data.error || 'Rollback failed');
      }
    } catch {
      message.error('Failed to rollback');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCleanup = async () => {
    setActionLoading('cleanup');
    try {
      const response = await fetch(`${API_URL}/autograder/environments/${environment.id}/cleanup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ keep_count: 2 }),
      });

      if (response.ok) {
        const data = await response.json();
        message.success(`Cleaned up ${data.deleted_count} old images`);
        onRefresh();
      } else {
        message.error('Cleanup failed');
      }
    } catch {
      message.error('Failed to cleanup');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToManual = async () => {
    setActionLoading('convert');
    try {
      const response = await fetch(`${API_URL}/autograder/environments/${environment.id}/convert-to-manual/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        message.success('Converted to manual configuration');
        onRefresh();
      } else {
        message.error('Conversion failed');
      }
    } catch {
      message.error('Failed to convert');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card
      title={
        <Space>
          <SyncOutlined spin={environment.convergencePending} />
          Auto-Detect Status
          <CPTooltip
            title="Auto-detect status shows the current state of the environment. Runs can be per file"
            infoIcon={true}
            style={{ marginLeft: 8 }}
          />
        </Space>
      }
      size="small"
      extra={
        <Button size="small" icon={<HistoryOutlined />} onClick={() => setHistoryVisible(true)}>
          History ({history.length})
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="Version"
            value={`v${environment.currentBuildVersion || 1}`}
            styles={{ content: { fontSize: 20 } }}
          />
        </Col>
        <Col span={6}>
          <Statistic title="Total Runs" value={environment.totalRuns || 0} styles={{ content: { fontSize: 20 } }} />
        </Col>
        <Col span={6}>
          <Statistic
            title="Success Rate"
            value={successRate}
            suffix="%"
            styles={{ content: { color: getStatusColor(successRate), fontSize: 20 } }}
          />
        </Col>
        <Col span={6}>
          <Progress type="circle" percent={successRate} size={50} strokeColor={getStatusColor(successRate)} />
        </Col>
      </Row>

      {/* Pending Convergence Alert */}
      {environment.convergencePending && (
        <Alert
          type="warning"
          icon={<SyncOutlined spin />}
          message="Convergence Pending"
          description="Environment was auto-updated. Validating with new submissions..."
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Pending Modules */}
      {pendingModules.length > 0 && (
        <Alert
          type="info"
          message="Tracking Missing Modules"
          description={
            <Space wrap>
              {pendingModules.map((mod) => {
                const stats = environment.convergenceStats?.[mod] || {};
                const count = typeof stats === 'object' ? stats.count : stats;
                return (
                  <Tag key={mod} color="processing">
                    {mod} ({count}/3)
                  </Tag>
                );
              })}
            </Space>
          }
          style={{ marginBottom: 12 }}
        />
      )}

      <Divider style={{ margin: '12px 0' }} />

      {/* Detected Configuration */}
      <Typography.Text strong>Detected Configuration</Typography.Text>
      <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 4 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title="Language"
              value={environment.language || 'Pending Detection...'}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
          <Col span={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Statistic
                title="Requirements"
                value={environment.requirements ? 'Present' : 'None'}
                valueStyle={{ fontSize: 16 }}
              />
              {environment.requirements && (
                <Button
                  size="small"
                  type="link"
                  onClick={() =>
                    Modal.info({
                      title: 'Current Requirements',
                      width: 600,
                      content: (
                        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                          <pre>{environment.requirements}</pre>
                        </div>
                      ),
                      maskClosable: true,
                    })
                  }
                >
                  View Full
                </Button>
              )}
            </div>
            {environment.requirements && environment.requirements.length > 0 && (
              <div style={{ fontSize: 12, color: '#888', maxHeight: 100, overflow: 'auto', marginTop: 4 }}>
                <pre style={{ margin: 0 }}>{environment.requirements}</pre>
              </div>
            )}
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Admin Actions */}
      <Space>
        <Popconfirm
          title="Rollback to previous version?"
          description="This will revert the environment to its previous state."
          onConfirm={() => handleRollback()}
          okText="Rollback"
          cancelText="Cancel"
          disabled={history.length < 2}
        >
          <Button icon={<RollbackOutlined />} loading={actionLoading === 'rollback'} disabled={history.length < 2}>
            Rollback
          </Button>
        </Popconfirm>

        <Popconfirm
          title="Cleanup old images?"
          description="This will delete old image versions, keeping only the 2 most recent."
          onConfirm={handleCleanup}
          okText="Cleanup"
          cancelText="Cancel"
        >
          <Button icon={<DeleteOutlined />} loading={actionLoading === 'cleanup'}>
            Cleanup
          </Button>
        </Popconfirm>

        <Popconfirm
          title="Convert to manual configuration?"
          description="Auto-detect will be disabled and you'll manage dependencies manually."
          onConfirm={handleConvertToManual}
          okText="Convert"
          cancelText="Cancel"
        >
          <Button icon={<EditOutlined />} loading={actionLoading === 'convert'}>
            Convert to Manual
          </Button>
        </Popconfirm>
      </Space>

      {/* Version History Modal */}
      <Modal
        title="Version History"
        open={historyVisible}
        onCancel={() => setHistoryVisible(false)}
        footer={null}
        width={600}
      >
        {history.length === 0 ? (
          <Alert message="No version history available" type="info" />
        ) : (
          <Timeline
            items={history
              .slice()
              .reverse()
              .map((entry, idx) => {
                const isCurrent = idx === 0;
                const entrySuccessRate =
                  entry.total_runs && entry.total_runs > 0
                    ? Math.round(((entry.successful_runs || 0) / entry.total_runs) * 100)
                    : null;

                return {
                  color: entry.status === 'success' ? 'green' : entry.status === 'failed' ? 'red' : 'blue',
                  dot: isCurrent ? <CheckCircleOutlined /> : undefined,
                  children: (
                    <div>
                      <Space>
                        <strong>Version {entry.version}</strong>
                        {isCurrent && <Tag color="blue">Current</Tag>}
                        {entry.status === 'failed' && <Tag color="red">Failed</Tag>}
                      </Space>
                      <div style={{ color: '#888', fontSize: 12 }}>
                        Built: {new Date(entry.built_at).toLocaleString()}
                      </div>
                      {entrySuccessRate !== null && (
                        <div style={{ fontSize: 12 }}>
                          Success rate: {entrySuccessRate}% ({entry.successful_runs}/{entry.total_runs} runs)
                        </div>
                      )}
                      {!isCurrent && (
                        <Button
                          size="small"
                          type="link"
                          icon={<RollbackOutlined />}
                          onClick={() => {
                            handleRollback(entry.version);
                            setHistoryVisible(false);
                          }}
                        >
                          Rollback to this version
                        </Button>
                      )}
                    </div>
                  ),
                };
              })}
          />
        )}
      </Modal>
    </Card>
  );
};

export default AutoDetectStatus;
