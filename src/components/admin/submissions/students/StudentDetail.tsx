/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

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
import moment from 'moment';

import { Link } from 'react-router-dom';

/* codePost imports */
import { openSubmission } from '../../other/AdminUtils';

import { AssignmentType, sortAssignments } from '../../../../infrastructure/assignment';
import { CourseType } from '../../../../infrastructure/course';
import { SubmissionInfoType } from '../../../../infrastructure/submission';

import { TableDetail } from '../../other/TableDetail';

import UploadSubmissionDialog from '../../assignments/assignments/SubmissionUpload/UploadSubmissionDialog';

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import { IStudentSubmissionsDataTable } from '../../../../types/common';

import { Environment } from '../../../../infrastructure/autograder/environment';
import { SubmissionTestResultType } from '../../../../infrastructure/autograder/runTypes';

import { FileType } from '../../../../infrastructure/file';
import { awaitTestResult } from '../../assignments/tests/autograderPollingUtils';

const confirm = Modal.confirm;
/**********************************************************************************************************************/

interface IProps {
  course: CourseType;
  onBack?: () => void;
  students: string[];
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  assignments: AssignmentType[];
  graders: string[];
  submissions: IStudentSubmissionsDataTable;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: FileType[]) => Promise<SubmissionInfoType>;
  addFilesToSubmission: (submission: SubmissionInfoType, files: FileType[]) => Promise<SubmissionInfoType>;

  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  changeSubmissionGrader: (submission: SubmissionInfoType, grader: string | undefined) => Promise<void>;
  student: string;

  baseURL: string;
}

interface IState {
  uploadSubmissionVisible: boolean;
  selectedSubmission: string /* stores the name of the assignment associated with the submission */;

  assignmentToUpload?: AssignmentType;

  submissionsMap: {
    [assignmentID: number]: SubmissionInfoType;
  };

  subsRunning: number[];
}

class StudentDetail extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    uploadSubmissionVisible: false,
    selectedSubmission: '',
    submissionsMap: this.props.submissions[this.props.student],
    subsRunning: [],
  };

  // ******************************************** API changes **************************************************

  public removeSubmission = (toRemove: SubmissionInfoType) => {
    confirm({
      title: 'Are you sure you want to remove this submission?',
      content: `The following students are associated with this submission: ${toRemove.students.join(',')}.`,
      onOk: () => {
        return this.props.deleteSubmission(toRemove);
      },
      okText: 'Remove',
    });
  };

  public callback = (sub: SubmissionInfoType, _result: SubmissionTestResultType) => {
    this.setState((prevState, _) => ({ subsRunning: prevState.subsRunning.filter((id) => id !== sub.id) }));
    message.success('Test run completed!');
  };

  public runTests = async (assignment: AssignmentType, sub: SubmissionInfoType) => {
    if (assignment.environment) {
      this.setState((prevState, _) => ({ subsRunning: [...prevState.subsRunning, sub.id] }));
      const payload = {
        id: assignment.environment,
        submission: sub.id,
        simulate: false,
      };
      const result = await Environment.run(payload);
      awaitTestResult(result.task, this.callback.bind({}, sub));
    }
  };

  public reUploadSubmission = (toRemove: SubmissionInfoType) => {
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
            {toRemove.students.map((student: string) => {
              return <li>{student}</li>;
            })}
          </ul>
        </div>
      ),
      onOk: () => {
        this.props.deleteSubmission(toRemove).then(() => {
          this.toggleUploadSubmissionVisible(toRemove.assignment);
        });
      },
      okText: 'Remove',
    });
  };

  public uploadSubmission = (assignment: AssignmentType, partners: string[], files: FileType[]) => {
    const submission = this.state.submissionsMap[assignment.id];
    if (submission) {
      return this.props.addFilesToSubmission(submission, files);
    } else {
      return this.props.uploadSubmission(assignment, partners, files);
    }
  };

  public changeGrader = (submission: SubmissionInfoType, newGrader: string | undefined) => {
    this.props.changeSubmissionGrader(submission, newGrader).then(() => {
      message.success('Updated grader');
    });
  };

  // ******************************************** State changes **************************************************

  public toggleUploadSubmissionVisible = (assignmentToUpload?: number) => {
    if (assignmentToUpload === undefined) {
      this.setState({ uploadSubmissionVisible: false });
    } else {
      const toUpload = this.props.assignments.find((el) => {
        return el.id === assignmentToUpload;
      });
      if (toUpload !== undefined) {
        this.setState({
          uploadSubmissionVisible: true,
          assignmentToUpload: toUpload,
        });
      }
    }
  };

  public changeActiveSubmission = (assignment: string) => {
    this.setState({ selectedSubmission: assignment });
  };

  // ******************************************** Render helpers **************************************************

  public getViewIcon = (submission: SubmissionInfoType, student: string) => {
    if (!(submission.id in this.props.viewsBySubmission) || !submission.isFinalized) {
      // case: No history object or unfinalized
      return '--';
    } else if (student in this.props.viewsBySubmission[submission.id]) {
      // case: submission has been viewed
      return (
        <CPTooltip title={moment(this.props.viewsBySubmission[submission.id][student]).format('llll')}>
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

  public getStatus = (submission: SubmissionInfoType | undefined) => {
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

  public render() {
    // const graderOptions = this.props.graders.map((el: string) => {
    //   return { label: el, value: el };
    // });

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

    if (this.props.course !== undefined && this.props.course.lateDayCreditsAllowable !== null) {
      columns.splice(columns.length - 1, 0, {
        title: 'Late Day Credits Used',
        dataIndex: 'lateDayCreditsUsed',
        key: 'lateDayCreditsUsed',
        align: aligner,
      });
    }

    const data = sortAssignments(this.props.assignments).map((assignment) => {
      const submission = this.state.submissionsMap[assignment.id];
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
            onClick: this.reUploadSubmission.bind(this, submission),
          },
          {
            key: '2',
            label: (
              <>
                <FileAddOutlined /> Add / Update files
              </>
            ),
            onClick: this.toggleUploadSubmissionVisible.bind(this, assignment.id),
          },
          ...(assignment.environment
            ? [
              {
                key: '3',
                label: (
                  <>
                    {this.state.subsRunning.includes(submission.id) ? <LoadingOutlined /> : <CaretRightOutlined />}{' '}
                    Run Tests
                  </>
                ),
                disabled: this.state.subsRunning.includes(submission.id),
                onClick: this.runTests.bind(this, assignment, submission),
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
            onClick: this.removeSubmission.bind(this, submission),
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
            onClick: this.toggleUploadSubmissionVisible.bind(this, assignment.id),
          },
        ];

      let graderElement;
      if (submission && assignment.name === this.state.selectedSubmission) {
        const undefinedOption = (
          <Select.Option key={0} value={undefined}>
            No grader
          </Select.Option>
        );
        graderElement = (
          <div>
            <Select
              style={{ width: 200 }}
              defaultValue={submission.grader ? submission.grader : undefined}
              onChange={this.changeGrader.bind(this, submission)}
            >
              {[
                ...this.props.graders
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
              <EditOutlined onClick={this.changeActiveSubmission.bind(this, '')} />
            </CPTooltip>
          </div>
        );
      } else if (submission) {
        graderElement = (
          <div>
            <span>{submission.grader ? submission.grader : '--'}</span>&nbsp;
            <CPTooltip title={tooltips.admin.studentSubmissions.assignGrader} hideThisOnHideTips={true}>
              <EditOutlined onClick={this.changeActiveSubmission.bind(this, assignment.name)} />
            </CPTooltip>
          </div>
        );
      } else {
        graderElement = '--';
      }

      return {
        key: assignment.name,
        assignment: submission ? (
          <span
            onClick={openSubmission.bind(this, submission.id)}
            className="text-link"
            style={{ cursor: 'pointer' }}
          >
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
              {moment(submission.dateUploaded).format('MMM D, h:mm A')}
            </Typography.Text>
          ) : (
            '--'
          ),
        partners: submission
          ? submission.students
            .filter((student) => {
              return student !== this.props.student;
            })
            .join(',')
          : '--',
        grade: gradeString,
        grader: graderElement,
        status: this.getStatus(submission),
        lateDayCreditsUsed: submission !== undefined ? submission.lateDayCreditsUsed : '',
        viewed: submission ? this.getViewIcon(submission, this.props.student) : '--',
        actions: (
          <div style={{ whiteSpace: 'nowrap' }}>
            {submission && (
              <Tooltip title="Open submission">
                <Button
                  shape="circle"
                  icon={<CodeOutlined />}
                  onClick={openSubmission.bind(this, submission.id)}
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
              Submissions: {this.props.student}
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
                    <Link to={this.props.baseURL}>Students</Link>
                  ),
                  // onClick: this.props.onBack,
                },
                { title: this.props.student },
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
          isVisible={this.state.uploadSubmissionVisible}
          onCancel={this.toggleUploadSubmissionVisible.bind(this, undefined)}
          assignments={this.props.assignments}
          selectedStudents={[this.props.student]}
          students={this.props.students}
          submissions={this.props.submissions}
          uploadSubmission={this.uploadSubmission}
          selectedAssignment={this.state.assignmentToUpload}
          onSuccess={openSubmission}
          disableStudentSelect={
            this.state.assignmentToUpload && this.state.submissionsMap[this.state.assignmentToUpload.id] ? true : false
          }
          title={
            this.state.assignmentToUpload &&
            this.state.submissionsMap[this.state.assignmentToUpload.id] &&
            'Add / update files'
          }
          infoMessage={
            this.state.assignmentToUpload &&
            this.state.submissionsMap[this.state.assignmentToUpload.id] && (
              <div>
                <div>
                  If you upload a file that already exists in the submission, the older versions (including comments)
                  wil be visible in the submission history.
                </div>
                <br />
                <div>
                  If you want all existing files to be deleted before upload, click <b>Replace Files</b> in the
                  submission menu instead.
                </div>
              </div>
            )
          }
        />
      </div>
    );
  }
}

export default StudentDetail;
