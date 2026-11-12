// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * AutoDetectStatus Component
 *
 * The packages of an auto-detect environment and the history of its image:
 * - a box to add packages, then the packages built into the image by where each came from,
 *   with remove and restore
 * - packages student runs needed that are still being counted, or were refused
 * - version, last build and run counts in one line
 * - version history named by what each build changed, with roll back and switch
 * - clean up images and convert to manual
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
  InfoCircleOutlined,
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
import {
  BRAND_GREEN_DEEP,
  BRAND_GREEN_WASH,
  DANGER_RED_HOVER,
  INK,
  INK_SECONDARY,
  PAGE_GREY,
} from '../../../../../../theme/tokens';
import { prefersReducedMotion } from './environmentStatus';

interface AutoDetectStatusProps {
  environment: EnvironmentType;
  onRefresh: () => void;
}

export interface VersionEntry {
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

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 24,
  paddingLeft: 8,
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 500,
  background: BRAND_GREEN_WASH,
  color: BRAND_GREEN_DEEP,
};
const plainChip: React.CSSProperties = { ...chip, paddingRight: 8, background: PAGE_GREY, color: INK };

// One row per kind of package: what it is on the left, the packages on the right.
const rows: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 260px) minmax(0, 1fr)',
  columnGap: 16,
  rowGap: 12,
  alignItems: 'start',
  margin: 0,
};
const rowLabel: React.CSSProperties = { margin: 0, fontSize: 12, fontWeight: 500, color: INK, lineHeight: '24px' };
const rowNote: React.CSSProperties = { display: 'block', fontWeight: 400, color: INK_SECONDARY, lineHeight: 1.5 };
const rowValue: React.CSSProperties = { margin: 0, minWidth: 0 };

export const requirementLines = (requirements: string | undefined) =>
  (requirements || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

// One complete requirement with no spaces in it, so a pasted "numpy pandas scipy" can be split.
const SINGLE_REQUIREMENT =
  /^[A-Za-z0-9][A-Za-z0-9._-]*(\[[A-Za-z0-9,._-]+\])?((==|>=|<=|~=|!=|<|>)[A-Za-z0-9.*+!_-]+)?$/;

/** "numpy pandas" is two packages; "numpy >= 1.26, < 3" is one. */
export const splitRequirements = (text: string): string[] => {
  const parts = text.split(/\s+/).filter(Boolean);
  return parts.length > 1 && parts.every((part) => SINGLE_REQUIREMENT.test(part)) ? parts : [text.trim()];
};

const listed = (items: string[]) =>
  items.length > 4 ? `${items.slice(0, 4).join(', ')} and ${items.length - 4} more` : items.join(', ');

/** What a build changed against the one before it, in words: the name instructors pick a version by. */
export const versionChange = (entry: VersionEntry, previous: VersionEntry | undefined): string => {
  const lines = requirementLines(entry.requirements);
  if (!previous) return lines.length ? `first build, with ${listed(lines)}` : 'first build, no packages';
  const before = requirementLines(previous.requirements);
  const added = lines.filter((line) => !before.includes(line));
  const removed = before.filter((line) => !lines.includes(line));
  const parts = [added.length ? `added ${listed(added)}` : '', removed.length ? `removed ${listed(removed)}` : ''];
  return parts.filter(Boolean).join('; ') || 'same packages as the version before';
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
  const previous = currentIndex >= 1 ? history[currentIndex - 1] : null;
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

  const handleRollback = (version: number) =>
    runAction(
      'rollback',
      () =>
        autograderApi.environmentsRollbackCreate({
          environmentId: environment.id,
          environmentRollbackRequest: { version },
        }),
      `Now using version ${version}.`,
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

  const counting = pending.filter((pkg) => pkg.status === EnvironmentPendingPackageStatusEnum.Counting);
  const refused = pending.filter((pkg) => pkg.status !== EnvironmentPendingPackageStatusEnum.Counting);

  const packageList = (
    <div>
      <div style={{ maxWidth: 480, marginBottom: 20 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            aria-label="Package to add"
            aria-describedby="env-package-help"
            aria-invalid={Boolean(addError)}
            status={addError ? 'error' : undefined}
            placeholder="e.g. scikit-learn"
            value={newPackage}
            onChange={(e) => {
              setNewPackage(e.target.value);
              setAddError(null);
            }}
            onPressEnter={handleAddPackages}
          />
          <Button
            icon={<PlusOutlined aria-hidden />}
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
          style={{ fontSize: 12, marginTop: 4, color: addError ? DANGER_RED_HOVER : INK_SECONDARY }}
        >
          {addError || 'Add a version if you need one: numpy==1.26.4. Separate several packages with spaces.'}
        </div>
      </div>

      {packages.length === 0 && excluded.length === 0 && pending.length === 0 && (
        <Typography.Paragraph style={{ color: INK_SECONDARY, marginBottom: 0 }}>
          Nothing beyond the base {environment.language} image yet. Packages your files, tests or students need appear
          here.
        </Typography.Paragraph>
      )}

      <dl style={rows}>
        {ORIGIN_GROUPS.map(({ origin, label }) => {
          const group = packages.filter((pkg) => pkg.origin === origin);
          if (group.length === 0) return null;
          return (
            <React.Fragment key={origin}>
              <dt style={rowLabel}>{label}</dt>
              <dd style={rowValue}>
                <Space wrap size={[6, 6]}>
                  {group.map((pkg) => (
                    <span key={pkg.name} style={chip} data-testid="env-package">
                      {pkg.requirement}
                      <Button
                        type="text"
                        size="small"
                        aria-label={`Remove ${pkg.name}`}
                        icon={<CloseOutlined aria-hidden style={{ fontSize: 10 }} />}
                        loading={actionLoading === `package:${pkg.name}`}
                        style={{ width: 24, height: 24, color: BRAND_GREEN_DEEP }}
                        onClick={() => handleRemove(pkg.name)}
                      />
                    </span>
                  ))}
                </Space>
              </dd>
            </React.Fragment>
          );
        })}

        {excluded.length > 0 && (
          <>
            <dt style={rowLabel}>
              Removed by you
              <span style={rowNote}>Kept out of the image until you restore them.</span>
            </dt>
            <dd style={rowValue}>
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
            </dd>
          </>
        )}

        {counting.length > 0 && (
          <>
            <dt style={rowLabel}>
              Installed during student runs
              <span style={rowNote}>Joins the image once {LEARN_THRESHOLD} submissions need it.</span>
            </dt>
            <dd style={rowValue}>
              <Space wrap size={[6, 6]}>
                {counting.map((pkg) => (
                  <span key={pkg.name} style={plainChip}>
                    {pkg.name}: {pkg.count} of {LEARN_THRESHOLD}
                  </span>
                ))}
              </Space>
            </dd>
          </>
        )}

        {refused.length > 0 && (
          <>
            <dt style={rowLabel}>
              Left out
              <span style={rowNote}>
                Not on the index is usually a misspelled import. Failed to install: add it yourself to try again.
              </span>
            </dt>
            <dd style={rowValue}>
              <Space wrap size={[6, 6]}>
                {refused.map((pkg) => (
                  <Tag key={pkg.name} style={{ ...ORANGE_TAG, marginInlineEnd: 0 }}>
                    {pkg.name}:{' '}
                    {pkg.status === EnvironmentPendingPackageStatusEnum.NotFound
                      ? 'not on the package index'
                      : 'failed to install'}
                  </Tag>
                ))}
              </Space>
            </dd>
          </>
        )}
      </dl>
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
      // A scrolling region has to be reachable without a mouse.
      role="region"
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label="Detected dependency manifest"
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
  const runsNote = 'A run is one executed file, so one submission can count as several runs.';

  return (
    <section aria-labelledby="env-packages-heading">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Typography.Title level={3} id="env-packages-heading" style={{ fontSize: 15, margin: 0 }}>
          {environment.packageListSupported ? `Packages (${packages.length})` : 'Dependencies'}
        </Typography.Title>
        <Button size="small" icon={<HistoryOutlined aria-hidden />} onClick={() => setHistoryVisible(true)}>
          History ({history.length})
        </Button>
      </div>
      <div
        style={{ color: INK_SECONDARY, margin: '4px 0 16px', fontVariantNumeric: 'tabular-nums' }}
        data-testid="env-summary"
      >
        {summary.join(' · ')}
        {/* A button, so the note is reachable by keyboard and not for mouse users only. */}
        <Tooltip title={runsNote} trigger={['hover', 'focus']}>
          <Button
            type="text"
            size="small"
            aria-label={runsNote}
            icon={<InfoCircleOutlined aria-hidden />}
            style={{ marginLeft: 4, color: INK_SECONDARY }}
          />
        </Tooltip>
      </div>

      {/* Pending Convergence Alert */}
      {environment.convergencePending && (
        <Alert
          type="warning"
          icon={<SyncOutlined aria-hidden spin={!prefersReducedMotion()} />}
          title="Convergence Pending"
          description="Environment was auto-updated. Validating with new submissions..."
          style={{ marginBottom: 12 }}
        />
      )}

      {environment.packageListSupported ? packageList : manifestSummary}

      {/* Rare actions, kept quiet. Versions live in History; the way back from the last change is here. */}
      <Space wrap size={8} style={{ marginTop: 24 }}>
        {previous && (
          <Popconfirm
            title={`Roll back to version ${previous.version}?`}
            description="This restores that version's image and package list. Packages added since are moved to Removed by you."
            onConfirm={() => handleRollback(previous.version)}
            okText="Roll back"
            cancelText="Cancel"
          >
            <Button size="small" icon={<RollbackOutlined aria-hidden />} loading={actionLoading === 'rollback'}>
              Roll back to version {previous.version}
            </Button>
          </Popconfirm>
        )}

        <Popconfirm
          title="Clean up old images?"
          description="This deletes images no version points at. The image in use and the 3 most recent versions are kept."
          onConfirm={handleCleanup}
          okText="Clean up"
          cancelText="Cancel"
        >
          <Button size="small" icon={<DeleteOutlined aria-hidden />} loading={actionLoading === 'cleanup'}>
            Clean up images
          </Button>
        </Popconfirm>

        <Popconfirm
          title="Convert to manual configuration?"
          description="Auto-detect stops. You keep the current package list and image, and manage the list yourself from then on. You can switch back, which detects everything again."
          onConfirm={handleConvertToManual}
          okText="Convert"
          cancelText="Cancel"
        >
          <Button size="small" icon={<EditOutlined aria-hidden />} loading={actionLoading === 'convert'}>
            Convert to manual
          </Button>
        </Popconfirm>
      </Space>

      {/* Version History Modal */}
      <Modal
        title="Version history"
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

                return {
                  color: entry.status === 'success' ? 'green' : entry.status === 'failed' ? 'red' : 'blue',
                  dot: isCurrent ? <CheckCircleOutlined aria-hidden /> : undefined,
                  children: (
                    <div>
                      <Space wrap size={8}>
                        <strong>
                          Version {entry.version}: {versionChange(entry, history[idx - 1])}
                        </strong>
                        {isCurrent && <Tag style={GREEN_TAG}>In use</Tag>}
                        {entry.status === 'failed' && <Tag color="error">Failed</Tag>}
                      </Space>
                      <div style={{ color: INK_SECONDARY, fontSize: 12 }}>
                        {[
                          `Built ${formatBuilt(entry.built_at)}`,
                          entry.reason && BUILD_REASONS[entry.reason],
                          entrySuccessRate !== null &&
                            `${entrySuccessRate}% of ${entry.total_runs} runs had passed when it was built`,
                        ]
                          .filter(Boolean)
                          .join('. ')}
                        .
                      </div>
                      {!isCurrent && (
                        <div style={{ marginTop: 8 }}>
                          <Button
                            size="small"
                            icon={<RollbackOutlined aria-hidden />}
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
