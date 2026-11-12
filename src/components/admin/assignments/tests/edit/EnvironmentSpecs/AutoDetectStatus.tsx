// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AutoDetectStatus Component
 *
 * The packages of an auto-detect environment and the history of its image:
 * - the packages built into the image, grouped by where each came from, with add, remove and restore
 * - packages student runs needed that are still being counted, or were refused
 * - version, last build and run counts in one line
 * - version history with what each build changed, and rollback
 * - cleanup and convert to manual
 *
 * The state of the image itself (building, out of date, failed) is shown by the page, not here.
 */
import React, { useState } from 'react';
import { Alert, Button, Input, Modal, Tag, Timeline, Space, Popconfirm, Tooltip, message, Typography } from 'antd';
import {
  RollbackOutlined,
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  PlusOutlined,
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
import themeVars from '../../../../../../styles/abstracts/_theme.js';
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

// DESIGN.md: ink-secondary, brand-green-wash, page-grey. Secondary text here sits on white.
const INK_SECONDARY = 'rgba(0, 0, 0, 0.6)';
const GREEN_WASH = 'rgba(25, 134, 101, 0.1)';
const PAGE_GREY = '#f2f2f2';

const groupLabel: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: INK_SECONDARY, marginBottom: 4 };
const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 24,
  paddingLeft: 8,
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 500,
  background: GREEN_WASH,
  color: themeVars.theme.green8,
};
const plainChip: React.CSSProperties = { ...chip, paddingRight: 8, background: PAGE_GREY, color: 'rgba(0, 0, 0, 0.8)' };

const requirementLines = (requirements: string | undefined) =>
  (requirements || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

// One complete requirement with no spaces in it, so a pasted "numpy pandas scipy" can be split.
const SINGLE_REQUIREMENT =
  /^[A-Za-z0-9][A-Za-z0-9._-]*(\[[A-Za-z0-9,._-]+\])?((==|>=|<=|~=|!=|<|>)[A-Za-z0-9.*+!_-]+)?$/;

/** "numpy pandas" is two packages; "numpy >= 1.26, < 3" is one. */
const splitRequirements = (text: string): string[] => {
  const parts = text.split(/\s+/).filter(Boolean);
  return parts.length > 1 && parts.every((part) => SINGLE_REQUIREMENT.test(part)) ? parts : [text.trim()];
};

const formatBuilt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;

export const AutoDetectStatus: React.FC<AutoDetectStatusProps> = ({ environment, onRefresh }) => {
  const [historyVisible, setHistoryVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newPackage, setNewPackage] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const history: VersionEntry[] = environment.imageHistory || [];
  const packages: EnvironmentPackage[] = environment.packages || [];
  const excluded = environment.excludedPackages || [];
  const pending = environment.pendingPackages || [];
  const currentIndex = history.map((entry) => entry.image_name).lastIndexOf(environment.imageName || '');
  const totalRuns = environment.totalRuns || 0;

  const changePackage = (action: EnvironmentPackageActionEnum, requirement: string) =>
    autograderApi.environmentsPackagesCreate({
      id: environment.id,
      environmentPackageRequest: { action, requirement },
    });

  const runAction = async (key: string, action: () => Promise<unknown>, success: React.ReactNode, failure: string) => {
    setActionLoading(key);
    try {
      await action();
      message.success({ key: 'environment-action', duration: 6, content: success });
      onRefresh();
    } catch (e) {
      message.error((await apiErrorMessageAsync(e)) || failure);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddPackages = async () => {
    const requirements = splitRequirements(newPackage);
    if (!requirements[0]) return;
    setActionLoading('add');
    setAddError(null);
    const added: string[] = [];
    try {
      for (const requirement of requirements) {
        await changePackage(EnvironmentPackageActionEnum.Add, requirement);
        added.push(requirement);
      }
      setNewPackage('');
    } catch (e) {
      // Keep what was not added in the box, next to the reason it was refused.
      setNewPackage(requirements.slice(added.length).join(' '));
      setAddError((await apiErrorMessageAsync(e)) || 'Could not add the package.');
    } finally {
      setActionLoading(null);
    }
    if (added.length) {
      message.success({
        key: 'environment-action',
        content: `Added ${added.join(', ')}. The image rebuilds shortly.`,
      });
      onRefresh();
    }
  };

  const handleRestore = (name: string) =>
    runAction(
      `package:${name}`,
      () => changePackage(EnvironmentPackageActionEnum.Restore, name),
      `Restored ${name}.`,
      'Could not restore the package',
    );

  const handleRemove = (name: string) =>
    runAction(
      `package:${name}`,
      () => changePackage(EnvironmentPackageActionEnum.Remove, name),
      <span>
        Removed {name}. The image rebuilds shortly.{' '}
        <Button
          type="link"
          size="small"
          style={{ padding: 0, height: 'auto' }}
          onClick={() => {
            message.destroy('environment-action');
            void handleRestore(name);
          }}
        >
          Undo
        </Button>
      </span>,
      'Could not remove the package',
    );

  const handleRollback = (version?: number) =>
    runAction(
      'rollback',
      () =>
        autograderApi.environmentsRollbackCreate({
          environmentId: environment.id,
          environmentRollbackRequest: { version },
        }),
      version ? `Now using version ${version}.` : 'Rolled back to the previous version.',
      'Could not switch versions',
    );

  const handleCleanup = () =>
    runAction(
      'cleanup',
      () => autograderApi.environmentsCleanupCreate({ environmentId: environment.id }),
      'Cleanup started.',
      'Cleanup failed',
    );

  const handleConvertToManual = () =>
    runAction(
      'convert',
      () => autograderApi.environmentsConvertToManualCreate({ environmentId: environment.id }),
      'Converted to manual configuration.',
      'Conversion failed',
    );

  const rollbackBlocked =
    history.length < 2
      ? 'There is no earlier version yet. Each successful build is kept as one.'
      : currentIndex < 1
        ? 'The oldest kept version is already in use. Open History to switch to a newer one.'
        : null;

  const refused = pending.filter((pkg) => pkg.status !== EnvironmentPendingPackageStatusEnum.Counting);

  const packageList = (
    <div>
      {packages.length === 0 && (
        <Typography.Paragraph style={{ color: INK_SECONDARY, marginBottom: 12 }}>
          Nothing beyond the base {environment.language} image yet. Packages your files, tests or students need are
          added here.
        </Typography.Paragraph>
      )}
      {ORIGIN_GROUPS.map(({ origin, label }) => {
        const group = packages.filter((pkg) => pkg.origin === origin);
        if (group.length === 0) return null;
        return (
          <div key={origin} style={{ marginBottom: 12 }}>
            <div style={groupLabel}>{label}</div>
            <Space wrap size={[6, 6]}>
              {group.map((pkg) => (
                <span key={pkg.name} style={chip} data-testid="env-package">
                  {pkg.requirement}
                  <Button
                    type="text"
                    size="small"
                    aria-label={`Remove ${pkg.name}`}
                    icon={<CloseOutlined style={{ fontSize: 10 }} />}
                    loading={actionLoading === `package:${pkg.name}`}
                    style={{ width: 24, height: 24, color: themeVars.theme.green8 }}
                    onClick={() => handleRemove(pkg.name)}
                  />
                </span>
              ))}
            </Space>
          </div>
        );
      })}

      <div style={{ maxWidth: 480, marginTop: 4 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            aria-label="Package to add"
            aria-describedby="env-package-help"
            aria-invalid={Boolean(addError)}
            status={addError ? 'error' : undefined}
            placeholder="scipy"
            value={newPackage}
            onChange={(e) => {
              setNewPackage(e.target.value);
              setAddError(null);
            }}
            onPressEnter={handleAddPackages}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddPackages}
            loading={actionLoading === 'add'}
            disabled={!newPackage.trim()}
          >
            Add package
          </Button>
        </Space.Compact>
        <div
          id="env-package-help"
          role={addError ? 'alert' : undefined}
          style={{ fontSize: 12, marginTop: 4, color: addError ? '#a8071a' : INK_SECONDARY }}
        >
          {addError ||
            'A package name, with a version if you need one: numpy==1.26.4. Separate several with spaces. The image rebuilds once, shortly after.'}
        </div>
      </div>

      {excluded.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={groupLabel}>Removed by you. These stay out of the image until you restore them.</div>
          <Space wrap size={[12, 6]}>
            {excluded.map((name) => (
              <Space key={name} size={4}>
                <span style={plainChip}>{name}</span>
                <Button
                  size="small"
                  aria-label={`Restore ${name}`}
                  loading={actionLoading === `package:${name}`}
                  onClick={() => handleRestore(name)}
                >
                  Restore
                </Button>
              </Space>
            ))}
          </Space>
        </div>
      )}

      {pending.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={groupLabel}>
            Installed while student code ran. A package joins the image once {LEARN_THRESHOLD} submissions need it.
          </div>
          <Space wrap size={[6, 6]}>
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
                    {pkg.name}: failed to install
                  </Tag>
                );
              }
              return (
                <span key={pkg.name} style={plainChip}>
                  {pkg.name}: {pkg.count} of {LEARN_THRESHOLD} submissions
                </span>
              );
            })}
          </Space>
          {refused.length > 0 && (
            <div style={{ fontSize: 12, marginTop: 4, color: INK_SECONDARY }}>
              A package that is not on the index is usually a misspelled import in student code. One that failed to
              install was left out so the build could finish; add it yourself to try it again.
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Languages with a whole-file manifest (package.json, pom.xml) have no package list.
  const manifestSummary = environment.requirements ? (
    <pre
      style={{
        margin: 0,
        padding: 12,
        maxHeight: 220,
        overflow: 'auto',
        fontSize: 12,
        background: PAGE_GREY,
        borderRadius: 4,
      }}
    >
      {environment.requirements}
    </pre>
  ) : (
    <Typography.Text style={{ color: INK_SECONDARY }}>
      No dependencies detected yet. Upload a manifest such as package.json or pom.xml with the assignment files.
    </Typography.Text>
  );

  const summary = [
    environment.language || 'Language not detected yet',
    environment.imageName ? `Version ${environment.currentBuildVersion || 1}` : null,
    environment.imageName && formatBuilt(environment.lastBuilt) ? `Built ${formatBuilt(environment.lastBuilt)}` : null,
    totalRuns > 0 ? `${totalRuns} runs, ${environment.successRate || 0}% passed` : 'No runs yet',
  ].filter(Boolean);

  return (
    <section aria-labelledby="env-packages-heading">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Typography.Title level={3} id="env-packages-heading" style={{ fontSize: 16, margin: 0 }}>
          {environment.packageListSupported ? `Packages (${packages.length})` : 'Dependencies'}
        </Typography.Title>
        <Button size="small" icon={<HistoryOutlined />} onClick={() => setHistoryVisible(true)}>
          History ({history.length})
        </Button>
      </div>
      <div
        style={{ color: INK_SECONDARY, margin: '4px 0 16px', fontVariantNumeric: 'tabular-nums' }}
        data-testid="env-summary"
      >
        {summary.join(' · ')}
        <CPTooltip
          title="A run is one executed file, so one submission can count as several runs."
          infoIcon={true}
          iconStyle={{ marginLeft: 8 }}
        />
      </div>

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

      {environment.packageListSupported ? packageList : manifestSummary}

      {/* Admin Actions */}
      <Space wrap style={{ marginTop: 24 }}>
        <Popconfirm
          title="Roll back to the previous version?"
          description="This restores the previous image and its package list. Packages added since are moved to Removed by you."
          onConfirm={() => handleRollback()}
          okText="Roll back"
          cancelText="Cancel"
          disabled={Boolean(rollbackBlocked)}
        >
          <Tooltip title={rollbackBlocked}>
            <Button
              icon={<RollbackOutlined />}
              loading={actionLoading === 'rollback'}
              disabled={Boolean(rollbackBlocked)}
            >
              Roll back
            </Button>
          </Tooltip>
        </Popconfirm>

        <Popconfirm
          title="Clean up old images?"
          description="This deletes images no version points at. The image in use and the 3 most recent versions are kept."
          onConfirm={handleCleanup}
          okText="Clean up"
          cancelText="Cancel"
        >
          <Button icon={<DeleteOutlined />} loading={actionLoading === 'cleanup'}>
            Clean up images
          </Button>
        </Popconfirm>

        <Popconfirm
          title="Convert to manual configuration?"
          description="Auto-detect stops. You keep the current package list and manage it yourself from then on."
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
                        {isCurrent && <Tag style={GREEN_TAG}>In use</Tag>}
                        {entry.status === 'failed' && <Tag color="error">Failed</Tag>}
                      </Space>
                      <div style={{ color: INK_SECONDARY, fontSize: 12 }}>
                        Built {formatBuilt(entry.built_at)}
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
                        <div style={{ fontSize: 12, color: INK_SECONDARY }}>{lines.join(', ')}</div>
                      )}
                      {entrySuccessRate !== null && (
                        <div style={{ fontSize: 12 }}>
                          Success rate when built: {entrySuccessRate}% ({entry.successful_runs}/{entry.total_runs} runs)
                        </div>
                      )}
                      {!isCurrent && (
                        <div style={{ marginTop: 8 }}>
                          <Button
                            size="small"
                            icon={<RollbackOutlined />}
                            onClick={() => {
                              handleRollback(entry.version);
                              setHistoryVisible(false);
                            }}
                          >
                            {idx < currentIndex ? 'Roll back' : 'Switch'} to version {entry.version}
                          </Button>
                        </div>
                      )}
                    </div>
                  ),
                };
              })
              .reverse()}
          />
        )}
      </Modal>
    </section>
  );
};

export default AutoDetectStatus;
