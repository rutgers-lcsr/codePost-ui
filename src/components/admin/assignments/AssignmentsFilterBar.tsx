// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React, { useCallback } from 'react';
import { DatePicker, Input, Select, Tag, Tooltip, Typography } from 'antd';
import { CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

const { Text } = Typography;

import CPButton from '../../core/CPButton';
import { colors } from '../../../theme/colors';

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

export type StatusFilter = 'all' | 'draft' | 'visible' | 'published';
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

const SEARCH_INPUT_WIDTH = 220;
const FILTER_SELECT_WIDTH = 330;

const STATUS_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft — hidden from students', value: 'draft' },
  { label: 'Visible — students can see, not yet published', value: 'visible' },
  { label: 'Published — students can start work', value: 'published' },
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
  { label: 'Released — students can view their grades', value: 'released' },
  { label: 'Not released — grades are private', value: 'not_released' },
];

// Short display labels used in active-filter tags (avoids long option text in pills)
const STATUS_SHORT: Record<string, string> = {
  draft: 'Draft',
  visible: 'Visible',
  published: 'Published',
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
    'Draft = hidden from students entirely. Visible = students can see the assignment but cannot start work. Published (isReleased) = students can start working on it. Note: grade/feedback visibility is a separate setting controlled by the Feedback filter.',
  progress: 'Filters by grading progress across all submissions. Complete means every submission has been finalized.',
  visibility: 'Filters by whether the assignment appears in the Student Console.',
  feedback: 'Filters by whether finalized submission feedback and grades are visible to students.',
  dateRange: 'Show only assignments whose student upload due date falls within this range.',
};

/**********************************************************************************************************************/
/* Helpers
/**********************************************************************************************************************/

const countActiveFilters = (filters: AssignmentFilters): number => {
  let count = 0;
  if (filters.searchText !== '') count++;
  if (filters.status !== 'all') count++;
  if (filters.progress !== 'all') count++;
  if (filters.visibility !== 'all') count++;
  if (filters.feedback !== 'all') count++;
  if (filters.dateRange !== null) count++;
  return count;
};

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
  const activeFilterCount = countActiveFilters(filters);
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
    const defaultValue = DEFAULT_FILTERS[key];
    const isDefault =
      key === 'dateRange' ? value === null : key === 'searchText' ? value === '' : value === defaultValue;
    if (!isDefault) {
      activeTags.push({ key, label: getFilterLabel(key, value) });
    }
  });

  return (
    <div
      style={{
        background: colors.neutralBackground,
        borderRadius: 8,
        padding: '8px 16px',
        marginBottom: 16,
        border: `1px solid ${colors.neutralDivider}`,
      }}
      role="search"
      aria-label="Assignment filters"
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        {/* Result count + clear all */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isFiltered && (
            <span
              style={{ fontSize: 12, color: colors.neutralSecondaryText, whiteSpace: 'nowrap' }}
              aria-live="polite"
              aria-atomic="true"
            >
              Showing{' '}
              <strong style={{ color: filteredCount === 0 ? '#f5222d' : colors.neutralMainText }}>
                {filteredCount}
              </strong>{' '}
              of <strong style={{ color: colors.neutralMainText }}>{totalCount}</strong> assignments
            </span>
          )}
          {isFiltered && (
            <CPButton
              cpType="secondary"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={clearAll}
              aria-label="Clear all filters"
            >
              Clear all
            </CPButton>
          )}
        </div>
      </div>

      {/* Filter controls row — each with a descriptive label */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 4 }}>
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
            style={{ width: FILTER_SELECT_WIDTH }}
            aria-label="Filter by publishing status"
          />
        </FilterField>

        <FilterField label="Grading progress" tooltip={FILTER_TOOLTIPS.progress}>
          <Select<ProgressFilter>
            value={filters.progress}
            onChange={(val) => update({ progress: val })}
            options={PROGRESS_OPTIONS}
            style={{ width: FILTER_SELECT_WIDTH }}
            aria-label="Filter by grading progress"
          />
        </FilterField>

        <FilterField label="Student visibility" tooltip={FILTER_TOOLTIPS.visibility}>
          <Select<VisibilityFilter>
            value={filters.visibility}
            onChange={(val) => update({ visibility: val })}
            options={VISIBILITY_OPTIONS}
            style={{ width: FILTER_SELECT_WIDTH }}
            aria-label="Filter by student visibility"
          />
        </FilterField>

        <FilterField label="Feedback" tooltip={FILTER_TOOLTIPS.feedback}>
          <Select<FeedbackFilter>
            value={filters.feedback}
            onChange={(val) => update({ feedback: val })}
            options={FEEDBACK_OPTIONS}
            style={{ width: FILTER_SELECT_WIDTH }}
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
            aria-label="Filter by student upload due date range"
          />
        </FilterField>
      </div>

      {/* Row 2: active filter tags (only when any active) */}
      {activeTags.length > 0 && (
        <div
          style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}
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
