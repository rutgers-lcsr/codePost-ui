// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React, { useCallback, useState } from 'react';
import { Badge, DatePicker, Input, Popover, Select, Tag, Tooltip, Typography } from 'antd';
import { CloseCircleOutlined, FilterOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

const { Text } = Typography;

import CPButton from '../../core/CPButton';
import { colors } from '../../../theme/colors';

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

export type StatusFilter = 'all' | 'draft' | 'visible' | 'preview' | 'published' | 'closed' | 'archived';
export type ProgressFilter = 'all' | 'not_started' | 'in_progress' | 'complete';
export type VisibilityFilter = 'all' | 'visible' | 'hidden';
export type FeedbackFilter = 'all' | 'released' | 'not_released';

export interface AssignmentFilters {
  searchText: string;
  status: StatusFilter;
  progress: ProgressFilter;
  visibility: VisibilityFilter;
  feedback: FeedbackFilter;
  dateRange: [Dayjs | null, Dayjs | null] | null;
}

export const DEFAULT_FILTERS: AssignmentFilters = {
  searchText: '',
  status: 'all',
  progress: 'all',
  visibility: 'all',
  feedback: 'all',
  dateRange: null,
};

interface IProps {
  filters: AssignmentFilters;
  onFiltersChange: (filters: AssignmentFilters) => void;
  totalCount: number;
  filteredCount: number;
}

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

const SEARCH_INPUT_WIDTH = 240;
const STATUS_SELECT_WIDTH = 330;
const MORE_FILTERS_WIDTH = 360;

// The filters that live behind the "More filters" button (search and status stay inline).
const MORE_FILTER_KEYS: (keyof AssignmentFilters)[] = ['progress', 'visibility', 'feedback', 'dateRange'];

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft — hidden from students', value: 'draft' },
  { label: 'Visible — students see it, no files or submitting', value: 'visible' },
  { label: 'Preview — students can read files, not submit', value: 'preview' },
  { label: 'Published — students can start work', value: 'published' },
  { label: 'Closed — no longer accepting submissions', value: 'closed' },
  { label: 'Archived — retired, hidden from students', value: 'archived' },
];

const PROGRESS_OPTIONS = [
  { label: 'All grading progress', value: 'all' },
  { label: 'Not started — no submissions graded', value: 'not_started' },
  { label: 'In progress — some submissions graded', value: 'in_progress' },
  { label: 'Complete — all submissions graded', value: 'complete' },
];

const VISIBILITY_OPTIONS = [
  { label: 'Any visibility', value: 'all' },
  { label: 'Visible — shown in student console', value: 'visible' },
  { label: 'Hidden — not shown to students', value: 'hidden' },
];

const FEEDBACK_OPTIONS = [
  { label: 'Any feedback state', value: 'all' },
  { label: 'Released — grades, comments, and rubric are out', value: 'released' },
  { label: 'Not released — grades are private', value: 'not_released' },
];

// Short display labels used in active-filter tags (avoids long option text in pills)
const STATUS_SHORT: Record<string, string> = {
  draft: 'Draft',
  visible: 'Visible',
  preview: 'Preview',
  published: 'Published',
  closed: 'Closed',
  archived: 'Archived',
};
const PROGRESS_SHORT: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
};
const VISIBILITY_SHORT: Record<string, string> = { visible: 'Visible', hidden: 'Hidden' };
const FEEDBACK_SHORT: Record<string, string> = { released: 'Released', not_released: 'Not released' };

// Tooltips explaining each filter
const FILTER_TOOLTIPS = {
  status:
    'Draft = hidden from students entirely. Visible = students see the name and due date only. Preview = students can also read the assignment files but not submit. Published = students can start work. Closed = submissions are no longer accepted (automatic once the deadline passes, or set manually). Archived = retired and hidden from students. Grade/feedback visibility is a separate setting controlled by the Feedback filter.',
  progress: 'Filters by grading progress across all submissions. Complete means every submission has been finalized.',
  visibility: 'Filters by whether the assignment appears in the Student Console.',
  feedback:
    'Filters by whether feedback is fully released. Live and per-student flows count as not released here — they reveal continuously rather than globally.',
  dateRange: 'Show only assignments whose student upload due date falls within this range.',
};

/**********************************************************************************************************************/
/* Helpers
/**********************************************************************************************************************/

const isDefault = (key: keyof AssignmentFilters, value: unknown): boolean => {
  if (key === 'dateRange') return value === null;
  if (key === 'searchText') return value === '';
  return value === DEFAULT_FILTERS[key];
};

const countActiveFilters = (filters: AssignmentFilters, keys: (keyof AssignmentFilters)[]): number =>
  keys.filter((key) => !isDefault(key, filters[key])).length;

/** Return a human-readable label for a filter value, used in active filter tags. */
const getFilterLabel = (key: keyof AssignmentFilters, value: unknown): string => {
  switch (key) {
    case 'searchText':
      return `Name: "${value}"`;
    case 'status':
      return `Status: ${STATUS_SHORT[value as string] ?? value}`;
    case 'progress':
      return `Progress: ${PROGRESS_SHORT[value as string] ?? value}`;
    case 'visibility':
      return `Visibility: ${VISIBILITY_SHORT[value as string] ?? value}`;
    case 'feedback':
      return `Feedback: ${FEEDBACK_SHORT[value as string] ?? value}`;
    case 'dateRange': {
      const range = value as [Dayjs | null, Dayjs | null] | null;
      if (!range) return '';
      const from = range[0] ? range[0].format('MMM D') : '…';
      const to = range[1] ? range[1].format('MMM D') : '…';
      return `Due date: ${from} – ${to}`;
    }
    default:
      return String(value);
  }
};

/** A labeled wrapper for a filter control with an optional info tooltip */
const FilterField: React.FC<{ label: string; tooltip?: string; children: React.ReactNode }> = ({
  label,
  tooltip,
  children,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Text
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        color: colors.neutralSecondaryText,
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {label}
      {tooltip && (
        <Tooltip title={tooltip} placement="top">
          <InfoCircleOutlined style={{ fontSize: 11, cursor: 'help', opacity: 0.7 }} />
        </Tooltip>
      )}
    </Text>
    {children}
  </div>
);

/**********************************************************************************************************************/
/* Component
/**********************************************************************************************************************/

const AssignmentsFilterBar: React.FC<IProps> = ({ filters, onFiltersChange, totalCount, filteredCount }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const activeFilterCount = countActiveFilters(filters, Object.keys(DEFAULT_FILTERS) as (keyof AssignmentFilters)[]);
  const moreActiveCount = countActiveFilters(filters, MORE_FILTER_KEYS);
  const isFiltered = activeFilterCount > 0;

  const update = useCallback(
    (patch: Partial<AssignmentFilters>) => {
      onFiltersChange({ ...filters, ...patch });
    },
    [filters, onFiltersChange],
  );

  const clearAll = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  const clearFilter = useCallback(
    (key: keyof AssignmentFilters) => {
      onFiltersChange({ ...filters, [key]: DEFAULT_FILTERS[key] });
    },
    [filters, onFiltersChange],
  );

  /* Build active-filter tag list (omit keys that are at default) */
  const activeTags: { key: keyof AssignmentFilters; label: string }[] = [];
  (Object.keys(DEFAULT_FILTERS) as (keyof AssignmentFilters)[]).forEach((key) => {
    const value = filters[key];
    if (!isDefault(key, value)) {
      activeTags.push({ key, label: getFilterLabel(key, value) });
    }
  });

  // The four less-used filters, stacked in a popover so the bar stays one row above the table.
  const moreFilters = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: MORE_FILTERS_WIDTH, maxWidth: '80vw' }}>
      <FilterField label="Grading progress" tooltip={FILTER_TOOLTIPS.progress}>
        <Select<ProgressFilter>
          value={filters.progress}
          onChange={(val) => update({ progress: val })}
          options={PROGRESS_OPTIONS}
          style={{ width: '100%' }}
          aria-label="Filter by grading progress"
        />
      </FilterField>

      <FilterField label="Student visibility" tooltip={FILTER_TOOLTIPS.visibility}>
        <Select<VisibilityFilter>
          value={filters.visibility}
          onChange={(val) => update({ visibility: val })}
          options={VISIBILITY_OPTIONS}
          style={{ width: '100%' }}
          aria-label="Filter by student visibility"
        />
      </FilterField>

      <FilterField label="Feedback" tooltip={FILTER_TOOLTIPS.feedback}>
        <Select<FeedbackFilter>
          value={filters.feedback}
          onChange={(val) => update({ feedback: val })}
          options={FEEDBACK_OPTIONS}
          style={{ width: '100%' }}
          aria-label="Filter by feedback released state"
        />
      </FilterField>

      <FilterField label="Due date range" tooltip={FILTER_TOOLTIPS.dateRange}>
        <DatePicker.RangePicker
          value={filters.dateRange as [Dayjs, Dayjs] | null}
          onChange={(range) => update({ dateRange: range ? [range[0] ?? null, range[1] ?? null] : null })}
          placeholder={['Start date', 'End date']}
          allowEmpty={[true, true]}
          format="MMM D, YYYY"
          style={{ width: '100%' }}
          aria-label="Filter by student upload due date range"
        />
      </FilterField>

      {moreActiveCount > 0 && (
        <CPButton
          cpType="secondary"
          size="small"
          icon={<CloseCircleOutlined />}
          onClick={() => {
            const reset: Partial<AssignmentFilters> = {};
            MORE_FILTER_KEYS.forEach((key) => {
              (reset as Record<string, unknown>)[key] = DEFAULT_FILTERS[key];
            });
            update(reset);
          }}
        >
          Reset these filters
        </CPButton>
      )}
    </div>
  );

  return (
    <div
      style={{
        background: colors.neutralBackground,
        borderRadius: 8,
        padding: '10px 16px',
        marginBottom: 16,
        border: `1px solid ${colors.neutralDivider}`,
      }}
      role="search"
      aria-label="Assignment filters"
    >
      {/* Filter controls row: search and status inline, everything else behind one button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <FilterField label="Search">
          <Input.Search
            value={filters.searchText}
            placeholder="Search by assignment name…"
            allowClear
            onChange={(e) => update({ searchText: e.target.value })}
            onSearch={(val) => update({ searchText: val })}
            style={{ width: SEARCH_INPUT_WIDTH }}
            aria-label="Search assignments by name"
          />
        </FilterField>

        <FilterField label="Status" tooltip={FILTER_TOOLTIPS.status}>
          <Select<StatusFilter>
            value={filters.status}
            onChange={(val) => update({ status: val })}
            options={STATUS_OPTIONS}
            style={{ width: STATUS_SELECT_WIDTH, maxWidth: '100%' }}
            aria-label="Filter by publishing status"
          />
        </FilterField>

        <Popover
          trigger="click"
          placement="bottomLeft"
          open={moreOpen}
          onOpenChange={setMoreOpen}
          title="More filters"
          content={moreFilters}
        >
          <Badge count={moreActiveCount} size="small" offset={[-4, 4]}>
            <CPButton
              cpType="secondary"
              icon={<FilterOutlined />}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
              aria-label={moreActiveCount > 0 ? `More filters, ${moreActiveCount} active` : 'More filters'}
            >
              More filters
            </CPButton>
          </Badge>
        </Popover>

        {isFiltered && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', paddingBottom: 4 }}>
            <span
              style={{ fontSize: 12, color: colors.neutralSecondaryText, whiteSpace: 'nowrap' }}
              aria-live="polite"
              aria-atomic="true"
            >
              Showing{' '}
              <strong style={{ color: filteredCount === 0 ? colors.actionRed : colors.neutralMainText }}>
                {filteredCount}
              </strong>{' '}
              of <strong style={{ color: colors.neutralMainText }}>{totalCount}</strong> assignments
            </span>
            <CPButton
              cpType="secondary"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={clearAll}
              aria-label="Clear all filters"
            >
              Clear all
            </CPButton>
          </div>
        )}
      </div>

      {/* Row 2: active filter tags (only when any active) */}
      {activeTags.length > 0 && (
        <div
          style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}
          role="list"
          aria-label="Active filters"
        >
          {activeTags.map(({ key, label }) => (
            <Tag
              key={key}
              closable
              onClose={() => clearFilter(key)}
              style={{
                borderColor: colors.brandPrimary,
                color: colors.brandPrimary,
                background: colors.brandLight,
                borderRadius: 4,
                fontSize: 12,
              }}
              aria-label={`Remove filter: ${label}`}
              role="listitem"
            >
              {label}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
};

// We export types only — the main export is the component
export default AssignmentsFilterBar;
