// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';

/* antd imports */
import {
  Alert,
  Breadcrumb,
  Button,
  Divider,
  Empty,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';

/* antd icons */
import {
  CloseCircleOutlined,
  FilterFilled,
  InboxOutlined,
  InfoCircleOutlined,
  MinusCircleTwoTone,
  PlusCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';

/* codePost imports */
import CPAdminDetail from '../admin/other/CPAdminDetail';
import CPButton from '../core/CPButton';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

import { compare } from '../utils/SortUtils';
import { formatSub, ISubDataBasic, sortByGrade } from './GraderUtils';

import { assignmentsApi, coursesApi, sectionsApi, submissionsApi } from '../../api-client/clients';
import { Course } from '../../api-client';
import { AnonymousSubmissionInfoType, AssignmentType, SectionType, SubmissionType } from '../../types/models';
import { ADMIN } from '../../routes';
import { BUTTON_STATE } from '../../types/common';
import { withQueryParams } from '../../utils/apiClient';
import { apiErrorMessageAsync } from '../../lib/apiError';
import { useCourseCapabilities } from '../../stores/usePermissionsStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { graderKeys } from '../../lib/queryKeys';

type alignType = 'left' | 'right' | 'center';

const { Option } = Select;

// Constants
const LOADING_INTERVAL = 15000; // 15 seconds for automatic reload
const MIN_CLAIM_AMOUNT = 1;
const MAX_CLAIM_AMOUNT = 10;
const DEFAULT_CLAIM_AMOUNT = 1;

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

interface ITableRow extends ISubDataBasic {
  key: number;
  student: string | number | React.ReactElement;
  releaseIcon?: React.ReactElement;
}

interface IProps {
  assignment: AssignmentType;
  course: Course;
  graderEmail: string;
  breadcrumbs: Array<{ title: React.ReactNode }>;
}

/**********************************************************************************************************************/
/* Helper Functions
/**********************************************************************************************************************/

const loadSections = async (course: Course, isAdmin: boolean): Promise<SectionType[]> => {
  try {
    if (isAdmin) {
      const pageSize = 200;
      let page = 1;
      let allSections: SectionType[] = [];

      while (true) {
        const response = await coursesApi.sectionsList({ id: course.id, page, pageSize });
        const results = response.results ?? [];
        allSections = allSections.concat(results);

        if (!response.next) {
          break;
        }

        page += 1;
      }

      return allSections;
    }

    // Graders cannot access /courses/{id}/sections/, so load details from section ids instead.
    const sectionIds = Array.isArray(course.sections) ? course.sections : [];
    if (sectionIds.length === 0) {
      return [];
    }

    const sectionResults = await Promise.allSettled(sectionIds.map((id) => sectionsApi.retrieve({ id })));
    return sectionResults
      .filter((result): result is PromiseFulfilledResult<SectionType> => result.status === 'fulfilled')
      .map((result) => result.value);
  } catch (e) {
    console.error(e);
    return [];
  }
};

// Throws on failure: the query's error state renders a retry, where an empty list would
// read as "nothing claimed".
const loadSubmissions = async (
  currentAssignment: AssignmentType,
  user: string,
): Promise<AnonymousSubmissionInfoType[]> => {
  const submissionsApiWithQuery = withQueryParams(assignmentsApi, {
    grader: user,
    compact: 1,
  });

  const response = await submissionsApiWithQuery.submissionsListRaw({ id: currentAssignment.id });
  const data = (await response.raw.json()) as unknown;

  if (Array.isArray(data)) {
    return data as AnonymousSubmissionInfoType[];
  }

  return ((data as { results?: AnonymousSubmissionInfoType[] } | undefined)?.results ??
    []) as AnonymousSubmissionInfoType[];
};

const getSectionParameters = (sections: SectionType[]): Array<SectionType | undefined> => {
  return sections.length === 0 ? [undefined] : sections;
};

/**********************************************************************************************************************/
/* Main Component
/**********************************************************************************************************************/

const MySubmissionsPanelDetail: React.FC<IProps> = ({ assignment, course, graderEmail, breadcrumbs }) => {
  const courseCaps = useCourseCapabilities(course?.id);
  const capIsAdmin = !!courseCaps.edit_course_settings;
  const queryClient = useQueryClient();

  // State
  const [currentSections, setCurrentSections] = useState<SectionType[]>([]);
  const [buttonState, setButtonState] = useState<BUTTON_STATE>(BUTTON_STATE.Active);
  const [showStudentEmails, setShowStudentEmails] = useState<boolean>(false);
  const [claimAmount, setClaimAmount] = useState<number>(DEFAULT_CLAIM_AMOUNT);

  // Submissions query with 15s polling
  const submissionsQueryKey = graderKeys.submissions(assignment.id, graderEmail);
  const {
    data: submissions = [],
    isLoading: isLoadingSubmissions,
    isError: submissionsFailed,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: submissionsQueryKey,
    queryFn: () => loadSubmissions(assignment, graderEmail),
    refetchInterval: LOADING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const canViewSubmissionInfo = submissions.length > 0 ? typeof submissions[0].students !== 'undefined' : false;

  // Sections query (no polling needed)
  const { data: sections = [] } = useQuery({
    queryKey: graderKeys.sections(course.id),
    queryFn: () => loadSections(course, capIsAdmin),
  });

  // Queue length query with 15s polling
  const sectionIds = currentSections.map((s) => s.id);
  const queueLengthQueryKey = graderKeys.queueLength(assignment.id, sectionIds.length > 0 ? sectionIds : undefined);
  const { data: queueLength = null, isLoading: isLoadingQueueLength } = useQuery({
    queryKey: queueLengthQueryKey,
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (currentSections.length > 0) {
          currentSections.forEach((section) => {
            params.append('section', section.id.toString());
          });
        }
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/assignments/${assignment.id}/queueLength/?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          },
        );
        if (response.ok) {
          const data = await response.json();
          return (data.unclaimed || 0) as number | null;
        }
        return null;
      } catch (error) {
        console.error('Error fetching queue length:', error);
        return null;
      }
    },
    refetchInterval: LOADING_INTERVAL,
    refetchIntervalInBackground: false,
  });

  /***********************************************************************************
  /* API operations
  /**********************************************************************************/

  const fetchSubmission = useCallback(
    async (assignmentId: number, section?: SectionType, amount: number = 1): Promise<SubmissionType[] | undefined> => {
      const drawUnassignedApi = withQueryParams(assignmentsApi, {
        amount,
        section: section?.name,
      });

      const response = await drawUnassignedApi.drawUnassignedListRaw({ id: assignmentId });
      if (response.raw.status === 204) {
        return undefined;
      }

      const json = (await response.raw.json()) as unknown;
      return Array.isArray(json) ? (json as SubmissionType[]) : undefined;
    },
    [],
  );

  const claimSubmission = useCallback(
    async (
      assignmentId: number,
      sections: SectionType[],
      amount: number = 1,
    ): Promise<SubmissionType[] | undefined> => {
      let submission;
      const sectionParameters = getSectionParameters(sections);

      for (const section of sectionParameters) {
        submission = await fetchSubmission(assignmentId, section, amount);
        if (submission) {
          break;
        }
      }

      if (submission) {
        queryClient.setQueryData(submissionsQueryKey, (old: AnonymousSubmissionInfoType[] | undefined) => [
          ...(old ?? []),
          ...submission,
        ]);
      }

      return submission;
    },
    [fetchSubmission, queryClient, submissionsQueryKey],
  );

  const releaseSubmission = useCallback(
    async (submission: SubmissionType): Promise<SubmissionType> => {
      const released = await submissionsApi.partialUpdate({
        id: submission.id,
        patchedSubmission: { grader: null, isFinalized: false },
      });

      queryClient.setQueryData(submissionsQueryKey, (old: AnonymousSubmissionInfoType[] | undefined) =>
        (old ?? []).filter((sub) => sub.id !== released.id),
      );

      return released;
    },
    [queryClient, submissionsQueryKey],
  );

  const updateQueueLength = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queueLengthQueryKey });
  }, [queryClient, queueLengthQueryKey]);

  const getAnotherSubmission = useCallback(async () => {
    setButtonState(BUTTON_STATE.Loading);
    try {
      const claimedSubmission = await claimSubmission(assignment.id, currentSections, claimAmount);
      setButtonState(claimedSubmission ? BUTTON_STATE.Active : BUTTON_STATE.Inactive);
    } catch (e) {
      // Nothing was claimed; the button must not stay spinning.
      setButtonState(BUTTON_STATE.Active);
      message.error((await apiErrorMessageAsync(e)) ?? 'Could not claim a submission. Try again.');
    }
    // Update queue length after claiming
    updateQueueLength();
  }, [assignment.id, currentSections, claimAmount, claimSubmission, updateQueueLength]);

  /***********************************************************************************
  /* Event handlers
  /**********************************************************************************/

  // The grading page opens in a new tab from codePost itself and in the same tab when
  // embedded (Code in Place sets no source).
  const gradeTarget = localStorage.getItem('source') === 'codePost' ? '_blank' : '_self';

  const handleSelect = useCallback(
    (sectionID: string) => {
      const match = sections.find((obj: SectionType) => obj.id === Number(sectionID));
      if (match) {
        // If selected sections change, we want to offer the grader another chance to claim
        // One exception is if currentSections goes from [] --> [x1, ..., xn], since if no submissions
        // are available without section filtering, none will be available with section filtering
        if (currentSections.length === 0) {
          setCurrentSections([match]);
        } else {
          setCurrentSections([...currentSections, match]);
          setButtonState(BUTTON_STATE.Active);
        }
        // Update queue length when section filter changes
        updateQueueLength();
      }
    },
    [sections, currentSections, updateQueueLength],
  );

  const handleDeselect = useCallback(
    (sectionID: string) => {
      const newSections = currentSections.filter((obj) => obj.id !== Number(sectionID));
      setCurrentSections(newSections);
      setButtonState(BUTTON_STATE.Active);
      // Update queue length when section filter changes
      updateQueueLength();
    },
    [currentSections, updateQueueLength],
  );

  const clearSections = useCallback(() => {
    setCurrentSections([]);
    setButtonState(BUTTON_STATE.Active);
    updateQueueLength();
  }, [updateQueueLength]);

  const toggleShowStudentEmails = useCallback(() => {
    setShowStudentEmails((prev) => !prev);
  }, []);

  const onSubmissionRelease = useCallback(
    (sub: SubmissionType) => {
      releaseSubmission(sub)
        .then(() => {
          setButtonState(BUTTON_STATE.Active);
          updateQueueLength();
        })
        .catch(async (e: unknown) => {
          // The row stays claimed; say why.
          message.error((await apiErrorMessageAsync(e)) ?? 'Could not unclaim the submission. Try again.');
        });
    },
    [releaseSubmission, updateQueueLength],
  );

  /***********************************************************************************
  /* Render helpers
  /**********************************************************************************/

  const renderClaimControls = useMemo(() => {
    let claimButton: React.ReactNode;
    let refreshButton: React.ReactNode;

    switch (buttonState) {
      case BUTTON_STATE.Active: {
        claimButton = (
          <Space.Compact className="cp-claim-controls">
            <CPTooltip title={tooltips.grader.mySubmissions.claim} hideThisOnHideTips={true}>
              <CPButton
                cpType="primary"
                icon={<PlusCircleOutlined aria-hidden />}
                onClick={getAnotherSubmission}
                fallbackIcon={<PlusCircleOutlined aria-label="Claim" />}
                style={{ display: 'inline-block' }}
              >
                Claim
              </CPButton>
            </CPTooltip>
            <InputNumber
              min={MIN_CLAIM_AMOUNT}
              max={MAX_CLAIM_AMOUNT}
              value={claimAmount}
              onChange={(value) => setClaimAmount(value || DEFAULT_CLAIM_AMOUNT)}
              aria-label="How many submissions to claim"
              style={{ width: 60 }}
            />
          </Space.Compact>
        );
        break;
      }
      case BUTTON_STATE.Inactive: {
        claimButton = (
          <CPButton
            cpType="disabled"
            icon={<InboxOutlined aria-hidden />}
            fallbackIcon={<InboxOutlined aria-label="Queue empty" />}
            style={{ display: 'inline-block' }}
          >
            Queue empty
          </CPButton>
        );
        refreshButton = (
          <CPButton
            cpType="secondary"
            icon={<RedoOutlined aria-hidden />}
            onClick={() => {
              setButtonState(BUTTON_STATE.Active);
              updateQueueLength();
            }}
            fallbackIcon={<RedoOutlined aria-label="Refresh" />}
          >
            Refresh
          </CPButton>
        );
        break;
      }
      case BUTTON_STATE.Loading: {
        claimButton = (
          <CPButton cpType="primary" loading={true} style={{ display: 'inline-block' }}>
            Claim
          </CPButton>
        );
        break;
      }
    }

    // Queue length display; a live region, so the count's changes are announced.
    const queueLengthDisplay =
      queueLength !== null ? (
        <span aria-live="polite">
          <Tag
            color="blue"
            icon={<InfoCircleOutlined aria-hidden />}
            style={{ borderRadius: 4, fontWeight: 500, fontSize: 12 }}
          >
            {isLoadingQueueLength ? 'Loading...' : `${queueLength} in queue`}
          </Tag>
        </span>
      ) : null;

    return (
      <Space size="small">
        {claimButton}
        {refreshButton}
        {queueLengthDisplay}
      </Space>
    );
  }, [buttonState, claimAmount, getAnotherSubmission, queueLength, isLoadingQueueLength, updateQueueLength]);

  // The section filter is the select itself (a one-item "Filter ▸ By section" menu was a
  // wasted click); it exists only when the course has sections.
  const renderFilterComponent = useMemo(() => {
    if (sections.length === 0) {
      return null;
    }
    return (
      <Space size="small">
        <CPTooltip title={tooltips.grader.mySubmissions.filter} hideThisOnHideTips={true}>
          <SelectSection
            sections={sections}
            currentSections={currentSections}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
            disabled={isLoadingSubmissions}
          />
        </CPTooltip>
        {currentSections.length > 0 && (
          <Button
            type="text"
            size="small"
            aria-label="Clear section filter"
            icon={<CloseCircleOutlined aria-hidden />}
            onClick={clearSections}
          />
        )}
      </Space>
    );
  }, [sections, currentSections, handleSelect, handleDeselect, isLoadingSubmissions, clearSections]);

  // One toolbar for every state (list, empty, failed).
  const toolbar = (
    <Space size="middle" align="center" wrap>
      {assignment.anonymousGrading && canViewSubmissionInfo && (
        <Space size="small">
          <span>Reveal students:</span>
          <Switch aria-label="Reveal students" checked={showStudentEmails} onChange={toggleShowStudentEmails} />
        </Space>
      )}
      <Divider orientation="vertical" />
      {renderClaimControls}
      {renderFilterComponent}
    </Space>
  );

  let content: React.ReactNode;
  let actions: Array<React.ReactNode> = [];

  if (submissionsFailed) {
    actions = [toolbar];
    content = (
      <Alert
        type="error"
        showIcon
        message="Couldn't load your claimed submissions."
        description="Your claims are untouched; this page just couldn't read them."
        action={
          <Button size="small" onClick={() => refetchSubmissions()}>
            Retry
          </Button>
        }
      />
    );
  } else if (submissions.length > 0 || isLoadingSubmissions) {
    const centerAlign: alignType = 'center';
    const columns = [
      {
        title: 'Student',
        dataIndex: 'student',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.student, b.student),
      },
      {
        title: 'Grade',
        dataIndex: 'gradeText',
        sorter: (a: ITableRow, b: ITableRow) => {
          return sortByGrade(
            { grade: a.grade, isFinalized: a.isFinalized },
            { grade: b.grade, isFinalized: b.isFinalized },
          );
        },
        // The column filter is the "what is left" view: unfinalized rows only.
        filters: [
          { text: 'Unfinalized', value: 'unfinalized' },
          { text: 'Finalized', value: 'finalized' },
        ],
        // The trigger takes its name from the icon; antd's default reads "filter".
        filterIcon: (filtered: boolean) => (
          <FilterFilled aria-label="Filter by grade status" style={{ color: filtered ? '#198665' : undefined }} />
        ),
        onFilter: (value: unknown, row: ITableRow) => (value === 'finalized') === !!row.isFinalized,
        align: centerAlign,
      },
      {
        title: 'Last Edited',
        dataIndex: 'lastEdited',
        align: centerAlign,
        sorter: (a: ITableRow, b: ITableRow) => {
          const date1 = new Date(a.lastEdited);
          const date2 = new Date(b.lastEdited);
          return date2.valueOf() - date1.valueOf();
        },
      },
      {
        title: (
          <span>
            Unclaim &nbsp;
            <CPTooltip
              title="Remove yourself as the grader of this submission, and return the submission to the ungraded queue."
              hideThisOnHideTips={true}
              infoIcon={true}
            />
          </span>
        ),
        dataIndex: 'release',
        align: centerAlign,
      },
    ];

    const showingEmails = !assignment.anonymousGrading || showStudentEmails;

    const data = submissions.map((sub) => {
      const students = showingEmails && sub.students ? sub.students.join(', ') : sub.id;
      return {
        ...formatSub(sub, assignment),
        key: sub.id,
        student: (
          // A real link, so middle-click, Ctrl+click and "open in new tab" all work.
          <a
            href={`/code/${sub.id}`}
            target={gradeTarget}
            rel={gradeTarget === '_blank' ? 'noopener' : undefined}
            aria-label={`Open submission ${students}${sub.isFinalized ? ' (finalized)' : ''}`}
            title={gradeTarget === '_blank' ? 'Opens the grading page in a new tab' : undefined}
            className="text-link"
          >
            <Typography.Text strong className="text-link">
              {students}
            </Typography.Text>
          </a>
        ),
        release: (
          <Popconfirm
            title={sub.isFinalized ? 'Unclaim this finalized submission?' : 'Unclaim this submission?'}
            description={
              sub.isFinalized
                ? 'It goes back to the queue and is no longer finalized. Your comments stay on it.'
                : 'It goes back to the queue. Your comments stay on it.'
            }
            onConfirm={() => onSubmissionRelease(sub as SubmissionType)}
            okText={sub.isFinalized ? 'Unclaim and unfinalize' : 'Unclaim'}
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
            placement="left"
          >
            <Button
              shape="circle"
              aria-label={`Unclaim submission ${students}`}
              icon={<MinusCircleTwoTone twoToneColor="#eb2f96" />}
            />
          </Popconfirm>
        ),
      };
    });

    actions = [toolbar];
    content = (
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
        loading={isLoadingSubmissions}
        size="middle"
      />
    );
  } else {
    let emptyMessage: string | React.ReactElement = 'No submissions yet. Click claim to start grading!';
    if (capIsAdmin) {
      emptyMessage = (
        <span>
          This is where you can claim submissions to grade. If you're looking to manage your course, head to the{' '}
          <Link to={`${ADMIN}/${course.name}/${course.period}`}>Admin Console</Link>
        </span>
      );
    }

    content = (
      <Empty
        styles={{
          image: {
            height: 60,
          },
        }}
        description={emptyMessage}
      >
        <Space orientation="vertical" size="middle" align="center">
          {renderClaimControls}
          {renderFilterComponent}
        </Space>
      </Empty>
    );
  }

  return (
    <CPAdminDetail
      goBack={null}
      breadcrumbs={<Breadcrumb items={[...breadcrumbs, { title: assignment.name }]} />}
      title={<div style={{ letterSpacing: '-0.3px' }}>{`Claimed by Me: ${assignment.name}`}</div>}
      titleInfo={tooltips.grader.mySubmissions.title}
      actions={actions}
      content={content}
      gutterSize={0}
    />
  );
};

/**********************************************************************************************************************/
/* SelectSection Component
/**********************************************************************************************************************/

interface ISelectSectionProps {
  sections: SectionType[];
  currentSections: SectionType[];
  onSelect: (sectionID: string) => void;
  onDeselect: (sectionID: string) => void;
  disabled: boolean;
}

export const SelectSection: React.FC<ISelectSectionProps> = ({
  sections,
  currentSections,
  onSelect,
  onDeselect,
  disabled,
}) => {
  const selectorItems = useMemo(
    () =>
      sections.map((section) => (
        <Option key={section.id} value={section.id}>
          {section.name}
        </Option>
      )),
    [sections],
  );

  if (sections.length === 0) {
    return null;
  }

  return (
    <Select
      placeholder="Filter by section"
      aria-label="Filter by section"
      mode="multiple"
      value={currentSections.map((section) => section.id)}
      onSelect={(value) => onSelect(String(value))}
      onDeselect={(value) => onDeselect(String(value))}
      style={{ width: 250 }}
      disabled={disabled}
    >
      {selectorItems}
    </Select>
  );
};

export default MySubmissionsPanelDetail;
