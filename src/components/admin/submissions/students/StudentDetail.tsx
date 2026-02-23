// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useState, useCallback } from 'react';

import {
  CaretRightOutlined,
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeFilled,
  EyeInvisibleOutlined,
  FileAddOutlined,
  LoadingOutlined,
  MenuOutlined,
  RedoOutlined,
  UploadOutlined,
} from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Dropdown, message, Modal, Select, Tag, Typography, Button, Tooltip } from 'antd';

/* other library imports */
// Using dayjs instead of moment for consistency with modern codebase
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { Link } from 'react-router-dom';

/* codePost imports */
import { openSubmission } from '../../other/AdminUtils';

import type { Course } from '../../../../api-client';
import type { EnvironmentsRunPartialUpdateRequest } from '../../../../api-client/apis/AutograderApi';
import { autograderApi } from '../../../../api-client/clients';
import type {
  Assignment,
  IStudentSubmissionsDataTable,
  SubmissionInfoType,
  UploadFile,
} from '../../../../types/common';
import { sortAssignments } from '../../../../utils/assignments';

import { TableDetail } from '../../other/TableDetail';

import UploadSubmissionDialog from '../../assignments/assignments/SubmissionUpload/UploadSubmissionDialog';

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import { awaitTestResult } from '../../assignments/tests/autograderPollingUtils';

dayjs.extend(localizedFormat);

const confirm = Modal.confirm;
/**********************************************************************************************************************/

interface IProps {
  course: Course;
  onBack?: () => void;
  students: string[];
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  assignments: Assignment[];
  graders: string[];
  submissions: IStudentSubmissionsDataTable;
  uploadSubmission: (assignment: Assignment, partners: string[], files: UploadFile[]) => Promise<SubmissionInfoType>;
  addFilesToSubmission: (submission: SubmissionInfoType, files: UploadFile[]) => Promise<SubmissionInfoType>;

  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  changeSubmissionGrader: (submission: SubmissionInfoType, grader: string | undefined) => Promise<void>;
  student: string;

  baseURL: string;
}

const StudentDetail: React.FC<IProps> = (props) => {
  const [uploadSubmissionVisible, setUploadSubmissionVisible] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState('');
  const [assignmentToUpload, setAssignmentToUpload] = useState<Assignment | undefined>(undefined);
  const [subsRunning, setSubsRunning] = useState<number[]>([]);

  // Derive submissionsMap directly from props to ensure it's always up to date
  const submissionsMap = props.submissions[props.student] || {};

  // ******************************************** State changes **************************************************

  const toggleUploadSubmissionVisible = useCallback(
    (assignmentID?: number) => {
      if (assignmentID === undefined) {
        setUploadSubmissionVisible(false);
      } else {
        const toUpload = props.assignments.find((el) => {
          return el.id === assignmentID;
        });
        if (toUpload !== undefined) {
          setUploadSubmissionVisible(true);
          setAssignmentToUpload(toUpload);
        }
      }
    },
    [props.assignments],
  );

  const changeActiveSubmission = useCallback((assignment: string) => {
    setSelectedSubmission(assignment);
  }, []);

  // ******************************************** API changes **************************************************

  const removeSubmission = useCallback(
    (toRemove: SubmissionInfoType) => {
      confirm({
        title: 'Are you sure you want to remove this submission?',
        content: `The following students are associated with this submission: ${toRemove.students.join(',')}.`,
        onOk: () => {
          return props.deleteSubmission(toRemove);
        },
        okText: 'Remove',
      });
    },
    [props.deleteSubmission],
  );

  const callback = useCallback((sub: SubmissionInfoType, _result: unknown) => {
    setSubsRunning((prev) => prev.filter((id) => id !== sub.id));
    message.success('Test run completed!');
  }, []);

  const runTests = useCallback(
    async (assignment: Assignment, sub: SubmissionInfoType) => {
      if (assignment.environment) {
        setSubsRunning((prev) => [...prev, sub.id]);
        const payload: NonNullable<EnvironmentsRunPartialUpdateRequest['patchedEnvironmentRunRequest']> = {
          submission: sub.id,
          simulate: false,
        };
        try {
          const result = await autograderApi.environmentsRunPartialUpdate({
            id: assignment.environment,
            patchedEnvironmentRunRequest: payload,
          });
          awaitTestResult(result.task, callback.bind({}, sub));
        } catch (error) {
          console.error('Error running tests:', error);
          setSubsRunning((prev) => prev.filter((id) => id !== sub.id));
          message.error('Failed to start tests');
        }
      }
    },
    [callback],
  );

  const reUploadSubmission = useCallback(
    (toRemove: SubmissionInfoType) => {
      confirm({
        title: 'Are you sure you want to re-upload files for this submission?',
        content: (
          <div>
            <br />
            <div>
              This action <b>cannot</b> be undone and will delete all existing files and comments for this
              submission.{' '}
            </div>
            <br />
            <div>The following students are associated with this submission:</div>
            <ul>
              {toRemove.students.map((student, index) => {
                return <li key={index}>{student}</li>;
              })}
            </ul>
          </div>
        ),
        onOk: () => {
          props.deleteSubmission(toRemove).then(() => {
            toggleUploadSubmissionVisible(toRemove.assignment);
          });
        },
        okText: 'Remove',
      });
    },
    [props.deleteSubmission, toggleUploadSubmissionVisible],
  );

  const handleUploadSubmission = useCallback(
    (assignment: Assignment, partners: string[], files: UploadFile[], _sendConfirmationEmail?: boolean) => {
      const submission = submissionsMap[assignment.id];
      if (submission) {
        return props.addFilesToSubmission(submission, files);
      } else {
        return props.uploadSubmission(assignment, partners, files);
      }
    },
    [submissionsMap, props.addFilesToSubmission, props.uploadSubmission],
  );

  const changeGrader = useCallback(
    (submission: SubmissionInfoType, newGrader: string | undefined) => {
      props.changeSubmissionGrader(submission, newGrader).then(() => {
        message.success('Updated grader');
      });
    },
    [props.changeSubmissionGrader],
  );

  // ******************************************** Render helpers **************************************************

  const getViewIcon = (submission: SubmissionInfoType, student: string) => {
    if (!(submission.id in props.viewsBySubmission) || !submission.isFinalized) {
      // case: No history object or unfinalized
      return '--';
    } else if (student in props.viewsBySubmission[submission.id]) {
      // case: submission has been viewed
      return (
        <CPTooltip title={dayjs(props.viewsBySubmission[submission.id][student]).format('llll')}>
          <div>
            <EyeFilled />
          </div>
        </CPTooltip>
      );
    } else {
      // case: submission has not been viewed
      return <EyeInvisibleOutlined />;
    }
  };

  const getStatus = (submission: SubmissionInfoType | undefined) => {
    let badgeStatus: 'default' | 'error' | 'success' | 'warning' | 'processing' | undefined;
    let cellText;
    if (submission) {
      if (submission.isFinalized) {
        badgeStatus = 'success';
        cellText = 'Finalized';
      } else if (submission.grader) {
        badgeStatus = 'processing';
        cellText = 'Unfinalized';
      } else {
        badgeStatus = 'warning';
        cellText = 'Unclaimed';
      }
    } else {
      badgeStatus = 'default';
      cellText = 'Missing';
    }
    return (
      <Tag color={badgeStatus} style={{ minWidth: 80, textAlign: 'center' }}>
        {cellText}
      </Tag>
    );
  };

  const aligner: 'left' | 'center' | 'right' = 'center';
  const columns = [
    {
      title: 'Assignment',
      dataIndex: 'assignment',
      key: 'assignment',
    },
    {
      title: 'Submitted',
      dataIndex: 'submitted',
      key: 'submitted',
      align: aligner,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Partners',
      dataIndex: 'partners',
      key: 'partners',
      align: aligner,
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      align: aligner,
    },
    {
      title: 'Grader',
      dataIndex: 'grader',
      key: 'grader',
      align: aligner,
    },
    {
      title: (
        <div>
          Viewed &nbsp;
          <CPTooltip title={tooltips.admin.studentSubmissions.viewed} infoIcon={true} hideThisOnHideTips={true} />
        </div>
      ),
      dataIndex: 'viewed',
      key: 'viewed',
      align: aligner,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: aligner,
    },
  ];

  if (props.course !== undefined && props.course.lateDayCreditsAllowable !== null) {
    columns.splice(columns.length - 1, 0, {
      title: 'Late Day Credits Used',
      dataIndex: 'lateDayCreditsUsed',
      key: 'lateDayCreditsUsed',
      align: aligner,
    });
  }

  const data = sortAssignments(props.assignments).map((assignment) => {
    const submission = submissionsMap[assignment.id];
    let gradeString = 'Not submitted';
    // colorClass is to color the text based on status of submission
    if (submission && submission.isFinalized) {
      gradeString = `${String(submission.grade)}/${assignment.points}`;
    } else if (submission) {
      gradeString = 'Unfinalized';
    }

    const menuItems = submission
      ? [
          {
            key: '1',
            label: (
              <>
                <RedoOutlined /> Replace files
              </>
            ),
            onClick: () => reUploadSubmission(submission),
          },
          {
            key: '2',
            label: (
              <>
                <FileAddOutlined /> Add / Update files
              </>
            ),
            onClick: () => toggleUploadSubmissionVisible(assignment.id),
          },
          ...(assignment.environment
            ? [
                {
                  key: '3',
                  label: (
                    <>{subsRunning.includes(submission.id) ? <LoadingOutlined /> : <CaretRightOutlined />} Run Tests</>
                  ),
                  disabled: subsRunning.includes(submission.id),
                  onClick: () => runTests(assignment, submission),
                },
              ]
            : []),
          {
            type: 'divider' as const,
          },
          {
            key: '4',
            label: (
              <>
                <DeleteOutlined /> Delete submission
              </>
            ),
            danger: true,
            onClick: () => removeSubmission(submission),
          },
        ]
      : [
          {
            key: '0',
            label: (
              <>
                <UploadOutlined /> Upload submission
              </>
            ),
            onClick: () => toggleUploadSubmissionVisible(assignment.id),
          },
        ];

    let graderElement;
    const NO_GRADER = 'NO_GRADER';
    if (submission && assignment.name === selectedSubmission) {
      const undefinedOption = (
        <Select.Option key="no_grader" value={NO_GRADER}>
          No grader
        </Select.Option>
      );
      graderElement = (
        <div>
          <Select
            style={{ width: 200 }}
            defaultValue={submission.grader ? submission.grader : NO_GRADER}
            onChange={(val) => changeGrader(submission, val === NO_GRADER ? undefined : val)}
          >
            {[
              ...props.graders
                .sort((a, b) => a.localeCompare(b))
                .map((grader) => {
                  return (
                    <Select.Option key={grader} value={grader}>
                      {grader}
                    </Select.Option>
                  );
                }),
              undefinedOption,
            ]}
          </Select>
          &nbsp;{' '}
          <CPTooltip title={tooltips.admin.studentSubmissions.lockAssignGrader} hideThisOnHideTips={true}>
            <EditOutlined onClick={() => changeActiveSubmission('')} />
          </CPTooltip>
        </div>
      );
    } else if (submission) {
      graderElement = (
        <div>
          <span>{submission.grader ? submission.grader : '--'}</span>&nbsp;
          <CPTooltip title={tooltips.admin.studentSubmissions.assignGrader} hideThisOnHideTips={true}>
            <EditOutlined onClick={() => changeActiveSubmission(assignment.name)} />
          </CPTooltip>
        </div>
      );
    } else {
      graderElement = '--';
    }

    return {
      key: assignment.name,
      assignment: submission ? (
        <span onClick={() => openSubmission(submission.id)} className="text-link" style={{ cursor: 'pointer' }}>
          <Typography.Text strong className="text-link">
            {assignment.name}
          </Typography.Text>
        </span>
      ) : (
        <Typography.Text strong>{assignment.name}</Typography.Text>
      ),
      submitted:
        submission && submission.dateUploaded ? (
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(submission.dateUploaded).format('MMM D, h:mm A')}
          </Typography.Text>
        ) : (
          '--'
        ),
      partners: submission
        ? submission.students
            .filter((student) => {
              return student !== props.student;
            })
            .join(',')
        : '--',
      grade: gradeString,
      grader: graderElement,
      status: getStatus(submission),
      lateDayCreditsUsed: submission !== undefined ? submission.lateDayCreditsUsed : '',
      viewed: submission ? getViewIcon(submission, props.student) : '--',
      actions: (
        <div style={{ whiteSpace: 'nowrap' }}>
          {submission && (
            <Tooltip title="Open submission">
              <Button
                shape="circle"
                icon={<CodeOutlined />}
                onClick={() => openSubmission(submission.id)}
                style={{ marginRight: 8 }}
              />
            </Tooltip>
          )}
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement={'bottomRight'}>
            <Button shape="circle" icon={<MenuOutlined />} />
          </Dropdown>
        </div>
      ),
    };
  });

  return (
    <div>
      <TableDetail
        loadComplete={true}
        title={
          <Typography.Title level={4} style={{ margin: 0 }}>
            Submissions: {props.student}
          </Typography.Title>
        }
        breadcrumbs={
          <Breadcrumb
            items={[
              {
                title: (
                  // eslint-disable-next-line jsx-a11y/anchor-is-valid
                  <a>Submissions</a>
                ),
              },
              {
                title: (
                  // eslint-disable-next-line jsx-a11y/anchor-is-valid
                  <Link to={props.baseURL}>Students</Link>
                ),
                // onClick: props.onBack,
              },
              { title: props.student },
            ]}
          />
        }
        isEmpty={false}
        emptyNode={null}
        columns={columns}
        data={data}
        actions={[]}
        tableProps={{ pagination: false }}
      />
      <UploadSubmissionDialog
        key={'0'}
        isVisible={uploadSubmissionVisible}
        onCancel={() => toggleUploadSubmissionVisible(undefined)}
        assignments={props.assignments}
        selectedStudents={[props.student]}
        students={props.students}
        submissions={props.submissions}
        uploadSubmission={handleUploadSubmission}
        selectedAssignment={assignmentToUpload}
        onSuccess={openSubmission}
        disableStudentSelect={assignmentToUpload && submissionsMap[assignmentToUpload.id] ? true : false}
        title={assignmentToUpload && submissionsMap[assignmentToUpload.id] && 'Add / update files'}
        infoMessage={
          assignmentToUpload &&
          submissionsMap[assignmentToUpload.id] && (
            <div>
              <div>
                If you upload a file that already exists in the submission, the older versions (including comments) wil
                be visible in the submission history.
              </div>
              <br />
              <div>
                If you want all existing files to be deleted before upload, click <b>Replace Files</b> in the submission
                menu instead.
              </div>
            </div>
          )
        }
      />
    </div>
  );
};

export default StudentDetail;
