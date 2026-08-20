// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * The sections × graders assignment matrix: rows are graders, one checkbox column per
 * section. Edits batch locally (see sectionLeaderPlanner) and save as one leaders-only
 * PATCH per changed section, with per-section failure isolation.
 */
import * as React from 'react';
import { Alert, Breadcrumb, Button, Checkbox, Empty, Modal, Progress, Tag, Tooltip, Typography } from 'antd';
import { ArrowLeftOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { message } from 'antd';
import { IManageSectionsProps } from '../ManageSections';
import { ITableDetailColumn, TableDetail } from '../../other/TableDetail';
import {
  LeaderMap,
  buildLeaderMap,
  diffLeaderPlan,
  distributeEvenly,
  effectiveLeaders,
  leadCounts,
  toggleLeader,
  unledSections,
} from './sectionLeaderPlanner';

const { Text } = Typography;

const AssignGradersMatrix: React.FC<IManageSectionsProps> = (props) => {
  const navigate = useNavigate();
  const [edits, setEdits] = React.useState<LeaderMap>(new Map());
  const [saving, setSaving] = React.useState(false);
  const [saveProgress, setSaveProgress] = React.useState<{ done: number; total: number } | null>(null);

  const sections = React.useMemo(
    () => [...props.sections].sort((a, b) => a.name.localeCompare(b.name)),
    [props.sections],
  );
  const initial = React.useMemo(() => buildLeaderMap(sections), [sections]);

  const diff = diffLeaderPlan(initial, edits);
  const counts = leadCounts(sections, initial, edits);
  const unled = unledSections(sections, initial, edits);

  const handleToggle = (sectionId: number, email: string) => {
    setEdits((e) => toggleLeader(sectionId, email, initial, e));
  };

  const handleDistribute = () => {
    Modal.confirm({
      title: 'Distribute graders evenly?',
      content:
        `Assigns one grader to each of the ${unled.length} section${unled.length === 1 ? '' : 's'} ` +
        'currently without a leader, round-robin starting from the least-loaded graders. ' +
        'Nothing is saved until you click Save.',
      okText: 'Distribute',
      onOk: () => setEdits((e) => distributeEvenly(props.graders, sections, initial, e)),
    });
  };

  const handleSave = async () => {
    const plan = diffLeaderPlan(initial, edits);
    if (plan.length === 0) return;
    setSaving(true);
    setSaveProgress({ done: 0, total: plan.length });
    const remaining = new Map(edits);
    let failed = 0;
    for (let i = 0; i < plan.length; i++) {
      const { sectionId, leaders } = plan[i];
      try {
        await props.updateSectionLeaders(sectionId, leaders);
        remaining.delete(sectionId);
      } catch {
        failed++;
        const name = sections.find((s) => s.id === sectionId)?.name ?? `#${sectionId}`;
        message.error(`Failed to save leaders for section "${name}"`);
      }
      setSaveProgress({ done: i + 1, total: plan.length });
    }
    setEdits(remaining);
    setSaving(false);
    setSaveProgress(null);
    if (failed === 0) {
      message.success(`Saved leaders for ${plan.length} section${plan.length === 1 ? '' : 's'}.`);
    }
  };

  const columns: ITableDetailColumn[] = React.useMemo(() => {
    const sectionColumns: ITableDetailColumn[] = sections
      .filter((s) => s.id != null)
      .map((section) => {
        const leaderCount = effectiveLeaders(section.id!, initial, edits).size;
        return {
          title: (
            <Tooltip title={`${section.name} — ${leaderCount} leader${leaderCount === 1 ? '' : 's'}`}>
              <span style={{ whiteSpace: 'nowrap' }}>
                {leaderCount === 0 && <WarningOutlined style={{ color: '#f5222d', marginRight: 4 }} />}
                {section.name} <Text type="secondary">({leaderCount})</Text>
              </span>
            </Tooltip>
          ),
          key: `section-${section.id}`,
          width: 110,
          align: 'center' as const,
          render: (_: unknown, record: Record<string, unknown>) => {
            const email = record.grader as string;
            return (
              <Checkbox
                aria-label={`${email} leads ${section.name}`}
                checked={effectiveLeaders(section.id!, initial, edits).has(email)}
                disabled={saving}
                onChange={() => handleToggle(section.id!, email)}
              />
            );
          },
        };
      });
    return [
      {
        title: 'Grader',
        dataIndex: 'grader',
        key: 'primary',
        fixed: 'left' as const,
        width: 220,
        defaultSortOrder: 'ascend' as const,
        sorter: (a: { grader: string }, b: { grader: string }) => a.grader.localeCompare(b.grader),
      },
      {
        title: 'Sections',
        dataIndex: '_count',
        key: 'count',
        width: 90,
        align: 'center' as const,
        sorter: (a: { _count: number }, b: { _count: number }) => a._count - b._count,
        render: (count: number, record: Record<string, unknown>) => {
          const delta = count - (record._initialCount as number);
          return (
            <span>
              {count}
              {delta !== 0 && (
                <Tag color={delta > 0 ? 'green' : 'orange'} style={{ marginLeft: 6, fontSize: 10 }}>
                  {delta > 0 ? `+${delta}` : delta}
                </Tag>
              )}
            </span>
          );
        },
      },
      ...sectionColumns,
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, initial, edits, saving]);

  const initialCounts = React.useMemo(() => leadCounts(sections, initial, new Map()), [sections, initial]);
  const data = React.useMemo(
    () =>
      props.graders.map((grader) => ({
        key: grader,
        grader,
        _count: counts.get(grader) ?? 0,
        _initialCount: initialCounts.get(grader) ?? 0,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.graders, edits, initial, sections],
  );

  const beforeTable = (
    <>
      {saveProgress && (
        <Progress
          percent={Math.round((saveProgress.done / saveProgress.total) * 100)}
          format={() => `${saveProgress.done}/${saveProgress.total}`}
          style={{ marginBottom: 12 }}
        />
      )}
      <Alert
        type={unled.length > 0 ? 'warning' : 'success'}
        showIcon
        style={{ marginBottom: 12 }}
        message={
          unled.length > 0
            ? `${unled.length} section${unled.length === 1 ? ' has' : 's have'} no leader` +
              (diff.length > 0 ? ` · ${diff.length} unsaved change${diff.length === 1 ? '' : 's'}` : '')
            : `Every section has a leader${diff.length > 0 ? ` · ${diff.length} unsaved change${diff.length === 1 ? '' : 's'}` : ''}`
        }
      />
    </>
  );

  // '..' alone resolves per ROUTE level (the flat 'sections/assign' route's parent is
  // /roster) — relative: 'path' makes it resolve per URL segment → /roster/sections.
  const goBack = () => navigate('..', { relative: 'path' });

  const actions = [
    <Button key="back" icon={<ArrowLeftOutlined />} onClick={goBack} disabled={saving}>
      Back to Sections
    </Button>,
    <Button
      key="distribute"
      onClick={handleDistribute}
      disabled={saving || unled.length === 0 || props.graders.length === 0}
    >
      Distribute evenly
    </Button>,
    <Button key="cancel" onClick={() => setEdits(new Map())} disabled={saving || diff.length === 0}>
      Cancel
    </Button>,
    <Button key="save" type="primary" onClick={handleSave} loading={saving} disabled={diff.length === 0}>
      Save{diff.length > 0 ? ` (${diff.length} section${diff.length === 1 ? '' : 's'})` : ''}
    </Button>,
  ];

  return (
    <TableDetail
      title="Assign Graders to Sections"
      loadComplete={props.loadComplete && props.sectionsLoadComplete}
      isEmpty={sections.length === 0 || props.graders.length === 0}
      emptyNode={
        <Empty
          description={
            sections.length === 0
              ? 'No sections yet — create sections on the Sections page first.'
              : 'No graders on the roster yet — add graders first.'
          }
        >
          <Button onClick={goBack}>Back to Sections</Button>
        </Empty>
      }
      columns={columns}
      data={data}
      actions={actions}
      beforeTable={beforeTable}
      tableProps={{ scroll: { x: 'max-content' } }}
      breadcrumbs={
        <Breadcrumb items={[{ title: 'Roster' }, { title: 'Sections' }, { title: 'Assign Graders' }]} />
      }
    />
  );
};

export default AssignGradersMatrix;
