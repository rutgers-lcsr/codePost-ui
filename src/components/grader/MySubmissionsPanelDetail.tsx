/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* antd imports */
import {
  Breadcrumb,
  Button,
  Divider,
  Dropdown,
  Empty,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';

/* antd icons */
import {
  CloseCircleOutlined,
  CodeOutlined,
  FilterOutlined,
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

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { Section, SectionType } from '../../infrastructure/section';
import { AnonymousSubmissionInfoType, Submission, SubmissionType } from '../../infrastructure/submission';
import { ADMIN } from '../../routes';
import { BUTTON_STATE } from '../../types/common';

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
  student: string | number;
  releaseIcon?: React.ReactElement;
}

enum FILTER_TYPE {
  NONE,
  BY_SECTION,
}

interface IProps {
  assignment: AssignmentType;
  course: CourseType;
  graderEmail: string;
  isAdmin: boolean;
  breadcrumbs: Array<{ title: React.ReactNode }>;
}

/**********************************************************************************************************************/
/* Helper Functions
/**********************************************************************************************************************/

const loadSections = async (course: CourseType): Promise<SectionType[]> => {
  const sections = await Promise.all(course.sections.map((id) => Section.read(id)));
  return sections.filter((section): section is SectionType => section !== undefined);
};

const loadSubmissions = (currentAssignment: AssignmentType, user: string): Promise<AnonymousSubmissionInfoType[]> => {
  return Assignment.readSubmissionsAnonymous(currentAssignment.id, {
    grader: user,
    compact: '1',
  });
};

const getSectionParameters = (sections: SectionType[]): Array<SectionType | undefined> => {
  return sections.length === 0 ? [undefined] : sections;
};

/**********************************************************************************************************************/
/* Main Component
/**********************************************************************************************************************/

const MySubmissionsPanelDetail: React.FC<IProps> = ({ assignment, course, graderEmail, isAdmin, breadcrumbs }) => {
  // State
  const [currentSections, setCurrentSections] = useState<SectionType[]>([]);
  const [sections, setSections] = useState<SectionType[]>([]);
  const [submissions, setSubmissions] = useState<AnonymousSubmissionInfoType[]>([]);
  const [buttonState, setButtonState] = useState<BUTTON_STATE>(BUTTON_STATE.Active);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<FILTER_TYPE>(FILTER_TYPE.NONE);
  const [showStudentEmails, setShowStudentEmails] = useState<boolean>(false);
  const [canViewSubmissionInfo, setCanViewSubmissionInfo] = useState<boolean>(false);
  const [claimAmount, setClaimAmount] = useState<number>(DEFAULT_CLAIM_AMOUNT);
  const [queueLength, setQueueLength] = useState<number | null>(null);
  const [isLoadingQueueLength, setIsLoadingQueueLength] = useState<boolean>(false);

  const intervalRef = useRef<number | null>(null);

  /***********************************************************************************
  /* API operations
  /**********************************************************************************/

  const changeAssignment = useCallback(
    (newAssignment: AssignmentType) => {
      setIsLoadingSubmissions(true);

      loadSubmissions(newAssignment, graderEmail).then((subs) => {
        setSubmissions(subs);
        setCanViewSubmissionInfo(subs.length > 0 ? typeof subs[0].students !== 'undefined' : false);
        setIsLoadingSubmissions(false);
      });

      loadSections(course).then((secs) => {
        setSections(secs);
      });
    },
    [graderEmail, course],
  );

  // Fetch queue length
  const fetchQueueLength = useCallback(
    async (assignmentId: number, sections?: SectionType[]): Promise<number | null> => {
      try {
        const params = new URLSearchParams();
        if (sections && sections.length > 0) {
          sections.forEach((section) => {
            params.append('section', section.id.toString());
          });
        }

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/assignments/${assignmentId}/queueLength/?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          return data.queueLength || 0;
        }
        return null;
      } catch (error) {
        console.error('Error fetching queue length:', error);
        return null;
      }
    },
    [],
  );

  const fetchSubmission = useCallback(
    async (assignmentId: number, section?: SectionType, amount: number = 1): Promise<SubmissionType[] | undefined> => {
      const params = new URLSearchParams();
      if (section) {
        params.append('section', section.id.toString());
      }
      params.append('amount', amount.toString());

      return await fetch(
        `${process.env.REACT_APP_API_URL}/assignments/${assignmentId}/drawUnassigned/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      )
        .then((res) => {
          if (res.status === 204) {
            return undefined;
          }
          return res.json();
        })
        .then((json) => json);
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

      // Note that calling fetchSubmission with section=undefined performs
      // the fetchSubmission operation without a section filter
      for (const section of sectionParameters) {
        submission = await fetchSubmission(assignmentId, section, amount);
        if (submission) {
          break;
        }
      }

      if (submission) {
        setSubmissions((prev) => [...prev, ...submission]);
      }

      return submission;
    },
    [fetchSubmission],
  );

  const releaseSubmission = useCallback(async (submission: SubmissionType): Promise<SubmissionType> => {
    const payload = {
      id: submission.id,
      grader: '',
      isFinalized: false,
    };

    const releasedSubmission = await Submission.update(payload);

    setSubmissions((prev) => prev.filter((sub) => sub.id !== releasedSubmission.id));

    return releasedSubmission;
  }, []);

  const updateQueueLength = useCallback(async () => {
    setIsLoadingQueueLength(true);
    const length = await fetchQueueLength(assignment.id, currentSections.length > 0 ? currentSections : undefined);
    setQueueLength(length);
    setIsLoadingQueueLength(false);
  }, [assignment.id, currentSections, fetchQueueLength]);

  const getAnotherSubmission = useCallback(async () => {
    setButtonState(BUTTON_STATE.Loading);
    const claimedSubmission = await claimSubmission(assignment.id, currentSections, claimAmount);
    if (!claimedSubmission) {
      setButtonState(BUTTON_STATE.Inactive);
    } else {
      setButtonState(BUTTON_STATE.Active);
    }
    // Update queue length after claiming
    await updateQueueLength();
  }, [assignment.id, currentSections, claimAmount, claimSubmission, updateQueueLength]);

  /***********************************************************************************
  /* Event handlers
  /**********************************************************************************/

  const openGradePage = useCallback((submission: AnonymousSubmissionInfoType) => {
    if (localStorage.getItem('source') === 'codePost') {
      window.open(`/code/${submission.id}`);
    } else {
      window.open(`/code/${submission.id}`, '_self');
    }
  }, []);

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

  const handleSetFilterType = useCallback(
    (newFilterType: FILTER_TYPE) => {
      setFilterType(newFilterType);
      setCurrentSections([]);
      // Update queue length when filter type changes
      updateQueueLength();
    },
    [updateQueueLength],
  );

  const toggleShowStudentEmails = useCallback(() => {
    setShowStudentEmails((prev) => !prev);
  }, []);

  const onSubmissionRelease = useCallback(
    (sub: SubmissionType) => {
      releaseSubmission(sub).then(() => {
        setButtonState(BUTTON_STATE.Active);
        updateQueueLength();
      });
    },
    [releaseSubmission, updateQueueLength],
  );

  /***********************************************************************************
  /* Effects
  /**********************************************************************************/

  // Initial load and interval setup
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    changeAssignment(assignment);
    updateQueueLength();

    intervalRef.current = window.setInterval(() => {
      changeAssignment(assignment);
      updateQueueLength();
    }, LOADING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [assignment, changeAssignment, updateQueueLength]);

  // Handle assignment changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    changeAssignment(assignment);
    updateQueueLength();
  }, [assignment.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /***********************************************************************************
  /* Render helpers
  /**********************************************************************************/

  const renderClaimControls = useMemo(() => {
    let claimButton: React.ReactNode;
    let refreshButton: React.ReactNode;

    switch (buttonState) {
      case BUTTON_STATE.Active: {
        claimButton = (
          <Space.Compact>
            <CPTooltip title={tooltips.grader.mySubmissions.claim} hideThisOnHideTips={true}>
              <CPButton
                cpType="primary"
                icon={<PlusCircleOutlined />}
                onClick={getAnotherSubmission}
                fallbackIcon={<PlusCircleOutlined />}
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
            icon={<InboxOutlined />}
            fallbackIcon={<InboxOutlined />}
            style={{ display: 'inline-block' }}
          >
            Queue empty
          </CPButton>
        );
        refreshButton = (
          <CPButton
            cpType="secondary"
            icon={<RedoOutlined />}
            onClick={() => {
              setButtonState(BUTTON_STATE.Active);
              updateQueueLength();
            }}
            fallbackIcon={<RedoOutlined />}
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

    // Queue length display
    const queueLengthDisplay =
      queueLength !== null ? (
        <Tag color="blue" icon={<InfoCircleOutlined />}>
          {isLoadingQueueLength ? 'Loading...' : `${queueLength} in queue`}
        </Tag>
      ) : null;

    return (
      <Space size="small">
        {claimButton}
        {refreshButton}
        {queueLengthDisplay}
      </Space>
    );
  }, [buttonState, claimAmount, getAnotherSubmission, queueLength, isLoadingQueueLength, updateQueueLength]);

  const renderFilterComponent = useMemo(() => {
    switch (filterType) {
      case FILTER_TYPE.NONE: {
        const filterMenuItems = [
          {
            key: 'by-section',
            label: 'By section',
            onClick: () => handleSetFilterType(FILTER_TYPE.BY_SECTION),
          },
        ];
        return (
          <CPTooltip title={tooltips.grader.mySubmissions.filter} hideThisOnHideTips={true}>
            <Dropdown menu={{ items: filterMenuItems }} trigger={['click']}>
              <Button icon={<FilterOutlined />}>Filter</Button>
            </Dropdown>
          </CPTooltip>
        );
      }
      case FILTER_TYPE.BY_SECTION: {
        return (
          <Space size="small">
            <SelectSection
              sections={sections}
              currentSections={currentSections}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
              disabled={isLoadingSubmissions}
            />
            <CloseCircleOutlined onClick={() => handleSetFilterType(FILTER_TYPE.NONE)} />
          </Space>
        );
      }
    }
  }, [filterType, sections, currentSections, handleSelect, handleDeselect, isLoadingSubmissions, handleSetFilterType]);

  let content: React.ReactNode;
  let actions: Array<React.ReactNode> = [];

  if (submissions.length > 0 || isLoadingSubmissions) {
    // If we're in anonymous grading mode, add a toggle to reveal student emails
    let anonymousToggle;
    if (assignment.anonymousGrading && canViewSubmissionInfo) {
      anonymousToggle = (
        <Space size="small">
          <span>Reveal students:</span>
          <Switch checked={showStudentEmails} onChange={toggleShowStudentEmails} />
          <Divider type="vertical" style={{ height: 25 }} />
        </Space>
      );
    }

    const centerAlign: alignType = 'center';
    const columns = [
      {
        title: 'Open',
        dataIndex: 'open',
        align: centerAlign,
      },
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
        open: <CodeOutlined onClick={() => openGradePage(sub)} />,
        key: sub.id,
        student: students,
        release: (
          <Popconfirm
            title="Are you sure you want to unclaim this submission?"
            onConfirm={() => onSubmissionRelease(sub as SubmissionType)}
            okText={sub.isFinalized ? 'Unclaim and unfinalize' : 'Unclaim'}
            cancelText="Cancel"
            placement="left"
          >
            <MinusCircleTwoTone twoToneColor="#eb2f96" />
          </Popconfirm>
        ),
      };
    });

    actions = [anonymousToggle, renderClaimControls, renderFilterComponent].filter(Boolean);
    content = <Table columns={columns} dataSource={data} pagination={false} loading={isLoadingSubmissions} />;
  } else {
    let emptyMessage: string | React.ReactElement = 'No submissions yet. Click claim to start grading!';
    if (isAdmin) {
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
        <Space direction="vertical" size="middle" align="center">
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
      title={<div>{`Claimed by Me: ${assignment.name}`}</div>}
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

export const SelectSection: React.FC<ISelectSectionProps> = ({ sections, onSelect, onDeselect, disabled }) => {
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
      mode="multiple"
      onSelect={onSelect}
      onDeselect={onDeselect}
      style={{ width: 250 }}
      disabled={disabled}
    >
      {selectorItems}
    </Select>
  );
};

export default MySubmissionsPanelDetail;
