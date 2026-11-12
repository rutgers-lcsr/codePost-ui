// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AutoDetectStatus Component
 *
 * Displays environment auto-detect status including:
 * - Success rate and run counts
 * - Current version info
 * - The packages in the image, where each came from, and controls to add or remove one
 * - Packages student runs needed that are still being counted
 * - Version history with rollback options
 * - Admin actions (cleanup, rollback, convert to manual)
 */
import React, { useEffect, useState } from 'react';
import {
  Card,
  Statistic,
  Alert,
  Button,
  Input,
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
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { EnvironmentType } from '../../../../../../types/models';
import {
  EnvironmentPackage,
  EnvironmentPackageActionEnum,
  EnvironmentPackageOriginEnum,
  EnvironmentPendingPackageStatusEnum,
} from '../../../../../../api-client/index.js';
import { autograderApi } from '../../../../../../api-client/clients.js';
import { apiErrorMessageAsync } from '../../../../../../lib/apiError';
import { GREEN_TAG, ORANGE_TAG } from '../../../../../../theme/tagStyles';
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
  reason?: string;
  successful_runs?: number;
  total_runs?: number;
}

const BUILDING = 1;
// A package is added to the image once this many different submissions needed it.
const LEARN_THRESHOLD = 3;

const ORIGIN_GROUPS: { origin: EnvironmentPackageOriginEnum; label: string }[] = [
  { origin: EnvironmentPackageOriginEnum.Detected, label: 'From your files and tests' },
  { origin: EnvironmentPackageOriginEnum.Learned, label: 'From student runs' },
  { origin: EnvironmentPackageOriginEnum.Pinned, label: 'Added by you' },
];

const BUILD_REASONS: Record<string, string> = {
  learned: 'Students needed new packages',
  detected: 'Your files or tests changed',
  instructor: 'You changed the packages',
  rollback: 'Rebuilt after a rollback',
  'out of date': 'The image was behind its package list',
  'one-time rebuild': 'Rebuilt to match its package list',
};

const requirementLines = (requirements: string | undefined) =>
  (requirements || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const AutoDetectStatus: React.FC<AutoDetectStatusProps> = ({ environment, onRefresh }) => {
  const [historyVisible, setHistoryVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newPackage, setNewPackage] = useState('');

  const successRate = environment.successRate || 0;
  const hasRuns = (environment.totalRuns || 0) > 0;
  const history: VersionEntry[] = environment.imageHistory || [];
  const packages: EnvironmentPackage[] = environment.packages || [];
  const excluded = environment.excludedPackages || [];
  const pending = environment.pendingPackages || [];
  const building = environment.buildStatus === BUILDING;
  const rebuildComing = building || environment.rebuildScheduled;
  const currentIndex = history.map((entry) => entry.image_name).lastIndexOf(environment.imageName || '');

  // A queued rebuild starts on its own shortly; keep the panel current until it lands.
  useEffect(() => {
    if (!rebuildComing) return undefined;
    const timer = setInterval(onRefresh, 5000);
    return () => clearInterval(timer);
  }, [rebuildComing, onRefresh]);

  const getStatusColor = (rate: number) => {
    if (rate >= 80) return '#52c41a';
    if (rate >= 50) return '#faad14';
    return '#f5222d';
  };

  const runAction = async (key: string, action: () => Promise<unknown>, success: string, failure: string) => {
    setActionLoading(key);
    try {
      await action();
      message.success(success);
      onRefresh();
      return true;
    } catch (e) {
      message.error((await apiErrorMessageAsync(e)) || failure);
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const changePackage = (action: EnvironmentPackageActionEnum, requirement: string, success: string) =>
    runAction(
      `package:${requirement}`,
      () =>
        autograderApi.environmentsPackagesCreate({
          id: environment.id,
          environmentPackageRequest: { action, requirement },
        }),
      success,
      'Could not change the package',
    );

  const handleAddPackage = async () => {
    const requirement = newPackage.trim();
    if (!requirement) return;
    const added = await changePackage(
      EnvironmentPackageActionEnum.Add,
      requirement,
      `Added ${requirement}. The image will rebuild shortly.`,
    );
    if (added) setNewPackage('');
  };

  const handleRollback = (version?: number) =>
    runAction(
      'rollback',
      () =>
        autograderApi.environmentsRollbackCreate({
          environmentId: environment.id,
          environmentRollbackRequest: { version },
        }),
      'Rolled back successfully',
      'Rollback failed',
    );

  const handleCleanup = () =>
    runAction(
      'cleanup',
      () => autograderApi.environmentsCleanupCreate({ environmentId: environment.id }),
      'Cleanup started',
      'Cleanup failed',
    );

  const handleConvertToManual = () =>
    runAction(
      'convert',
      () => autograderApi.environmentsConvertToManualCreate({ environmentId: environment.id }),
      'Converted to manual configuration',
      'Conversion failed',
    );

  const handleRebuild = () =>
    runAction(
      'rebuild',
      () => autograderApi.environmentsBuildPartialUpdate({ id: environment.id, patchedEnvironmentBuildRequest: {} }),
      'Rebuild started',
      'Could not start the rebuild',
    );

  const packageList = (
    <div>
      {packages.length === 0 && <Typography.Text type="secondary">No packages beyond the base image.</Typography.Text>}
      {ORIGIN_GROUPS.map(({ origin, label }) => {
        const group = packages.filter((pkg) => pkg.origin === origin);
        if (group.length === 0) return null;
        return (
          <div key={origin} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', marginBottom: 4 }}>{label}</div>
            <Space wrap size={[4, 4]}>
              {group.map((pkg) => (
                <Tag
                  key={pkg.name}
                  data-testid="env-package"
                  closable
                  closeIcon={<span aria-label={`Remove ${pkg.name}`}>×</span>}
                  onClose={(e) => {
                    e.preventDefault();
                    changePackage(
                      EnvironmentPackageActionEnum.Remove,
                      pkg.name,
                      `Removed ${pkg.name}. The image will rebuild shortly.`,
                    );
                  }}
                >
                  {pkg.requirement}
                </Tag>
              ))}
            </Space>
          </div>
        );
      })}

      <Space.Compact style={{ marginTop: 4, width: '100%', maxWidth: 420 }}>
        <Input
          aria-label="Package to add"
          placeholder="scipy or numpy==1.26.4"
          value={newPackage}
          onChange={(e) => setNewPackage(e.target.value)}
          onPressEnter={handleAddPackage}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddPackage}
          loading={actionLoading === `package:${newPackage.trim()}`}
          disabled={!newPackage.trim()}
        >
          Add package
        </Button>
      </Space.Compact>

      {excluded.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', marginBottom: 4 }}>
            Removed by you. These stay out of the image until you restore them.
          </div>
          <Space wrap size={[4, 4]}>
            {excluded.map((name) => (
              <Tag key={name}>
                <span style={{ textDecoration: 'line-through' }}>{name}</span>
                <Button
                  type="link"
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={() => changePackage(EnvironmentPackageActionEnum.Restore, name, `Restored ${name}.`)}
                >
                  Restore
                </Button>
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', marginBottom: 4 }}>
            Installed while student code ran. A package joins the image once {LEARN_THRESHOLD} submissions need it.
          </div>
          <Space wrap size={[4, 4]}>
            {pending.map((pkg) => {
              if (pkg.status === EnvironmentPendingPackageStatusEnum.NotFound) {
                return (
                  <Tag key={pkg.name} style={ORANGE_TAG}>
                    {pkg.name}: not on the package index
                  </Tag>
                );
              }
              if (pkg.status === EnvironmentPendingPackageStatusEnum.BuildFailed) {
                return (
                  <Tag key={pkg.name} style={ORANGE_TAG}>
                    {pkg.name}: could not be installed
                  </Tag>
                );
              }
              return (
                <Tag key={pkg.name}>
                  {pkg.name}: {pkg.count} of {LEARN_THRESHOLD} submissions
                </Tag>
              );
            })}
          </Space>
        </div>
      )}
    </div>
  );

  // Languages with a whole-file manifest (package.json, pom.xml) have no package list.
  const manifestSummary = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Statistic
          title="Requirements"
          value={environment.requirements ? 'Present' : 'None'}
          styles={{ content: { fontSize: 16 } }}
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
                mask: { closable: true },
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
    </>
  );

  return (
    <Card
      title={
        <Space>
          <SyncOutlined spin={rebuildComing} />
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
          {/* No runs yet is not a 0% success rate. */}
          <Statistic
            title="Success Rate"
            value={hasRuns ? successRate : 'No runs yet'}
            suffix={hasRuns ? '%' : undefined}
            styles={{ content: { color: hasRuns ? getStatusColor(successRate) : undefined, fontSize: 20 } }}
          />
        </Col>
        <Col span={6}>
          {hasRuns && (
            <Progress type="circle" percent={successRate} size={50} strokeColor={getStatusColor(successRate)} />
          )}
        </Col>
      </Row>

      {/* Image state */}
      {building && (
        <Alert
          type="info"
          icon={<SyncOutlined spin />}
          showIcon
          title="Rebuilding the image"
          description="Runs that start now wait for the new image."
          style={{ marginBottom: 12 }}
        />
      )}
      {!building && environment.rebuildScheduled && (
        <Alert
          type="info"
          showIcon
          title="A rebuild is queued"
          description="It starts on its own shortly, so several changes become one build."
          style={{ marginBottom: 12 }}
        />
      )}
      {!rebuildComing && environment.imageOutOfDate && (
        <Alert
          type="warning"
          showIcon
          title="The image does not match this package list"
          description="Until it is rebuilt, each run installs the missing packages itself, which is slow."
          action={
            <Button size="small" onClick={handleRebuild} loading={actionLoading === 'rebuild'}>
              Rebuild now
            </Button>
          }
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Pending Convergence Alert */}
      {environment.convergencePending && (
        <Alert
          type="warning"
          icon={<SyncOutlined spin />}
          title="Convergence Pending"
          description="Environment was auto-updated. Validating with new submissions..."
          style={{ marginBottom: 12 }}
        />
      )}

      <Divider style={{ margin: '12px 0' }} />

      {/* Detected Configuration */}
      <Typography.Text strong>Detected Configuration</Typography.Text>
      <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 4 }}>
        <Row gutter={16}>
          <Col span={environment.packageListSupported ? 6 : 12}>
            <Statistic
              title="Language"
              value={environment.language || 'Pending Detection...'}
              styles={{ content: { fontSize: 16 } }}
            />
          </Col>
          <Col span={environment.packageListSupported ? 18 : 12}>
            {environment.packageListSupported ? (
              <>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>
                  Packages ({packages.length})
                </div>
                {packageList}
              </>
            ) : (
              manifestSummary
            )}
          </Col>
        </Row>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Admin Actions */}
      <Space>
        <Popconfirm
          title="Rollback to previous version?"
          description="This restores the previous image and its package list."
          onConfirm={() => handleRollback()}
          okText="Rollback"
          cancelText="Cancel"
          disabled={currentIndex < 1}
        >
          <Button icon={<RollbackOutlined />} loading={actionLoading === 'rollback'} disabled={currentIndex < 1}>
            Rollback
          </Button>
        </Popconfirm>

        <Popconfirm
          title="Cleanup old images?"
          description="This deletes old images, keeping the image in use and the 3 most recent versions."
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
          <Alert title="No version history yet. Each build from now on is kept here." type="info" />
        ) : (
          <Timeline
            items={history
              .map((entry, idx) => {
                const isCurrent = idx === currentIndex;
                const entrySuccessRate =
                  entry.total_runs && entry.total_runs > 0
                    ? Math.round(((entry.successful_runs || 0) / entry.total_runs) * 100)
                    : null;
                const lines = requirementLines(entry.requirements);
                const before = idx > 0 ? requirementLines(history[idx - 1].requirements) : null;
                const added = before ? lines.filter((line) => !before.includes(line)) : [];
                const removed = before ? before.filter((line) => !lines.includes(line)) : [];

                return {
                  color: entry.status === 'success' ? 'green' : entry.status === 'failed' ? 'red' : 'blue',
                  dot: isCurrent ? <CheckCircleOutlined /> : undefined,
                  children: (
                    <div>
                      <Space>
                        <strong>Version {entry.version}</strong>
                        {isCurrent && <Tag color="blue">In use</Tag>}
                        {entry.status === 'failed' && <Tag color="red">Failed</Tag>}
                      </Space>
                      <div style={{ color: 'rgba(0,0,0,0.65)', fontSize: 12 }}>
                        Built: {new Date(entry.built_at).toLocaleString()}
                        {entry.reason && BUILD_REASONS[entry.reason] ? `. ${BUILD_REASONS[entry.reason]}.` : ''}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        {lines.length === 0
                          ? 'No packages'
                          : `${lines.length} ${lines.length === 1 ? 'package' : 'packages'}`}
                        {before && added.length === 0 && removed.length === 0 && ', same as the version before'}
                      </div>
                      {(added.length > 0 || removed.length > 0) && (
                        <Space wrap size={[4, 4]} style={{ marginTop: 4 }}>
                          {added.map((line) => (
                            <Tag key={`+${line}`} style={GREEN_TAG}>
                              + {line}
                            </Tag>
                          ))}
                          {removed.map((line) => (
                            <Tag key={`-${line}`} style={ORANGE_TAG}>
                              − {line}
                            </Tag>
                          ))}
                        </Space>
                      )}
                      {!before && lines.length > 0 && (
                        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{lines.join(', ')}</div>
                      )}
                      {entrySuccessRate !== null && (
                        <div style={{ fontSize: 12 }}>
                          Success rate when built: {entrySuccessRate}% ({entry.successful_runs}/{entry.total_runs} runs)
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
              })
              .reverse()}
          />
        )}
      </Modal>
    </Card>
  );
};

export default AutoDetectStatus;
