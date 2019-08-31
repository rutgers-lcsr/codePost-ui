/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import {
  Badge,
  Breadcrumb,
  Dropdown,
  Icon,
  Menu,
  message,
  Modal,
  Select,
} from 'antd';

/* other library imports */
import moment from 'moment';

/* codePost imports */
import { openSubmission } from '../../other/AdminUtils';

import { AssignmentType } from '../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../infrastructure/submission';

import { TableDetail } from '../../other/TableDetail';

import UploadSubmissionDialog from '../../assignments/assignments/UploadSubmissionDialog';

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import { IStudentSubmissionsDataTable } from '../../../../types/common';

const confirm = Modal.confirm;

/**********************************************************************************************************************/

interface IProps {
  onBack: () => void;
  student: string;
  students: string[];
  submissionsMap: {
    [assignmentID: number]: SubmissionType;
  };
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  assignments: AssignmentType[];
  graders: string[];
  submissions: IStudentSubmissionsDataTable;
  uploadSubmission: (
    assignment: AssignmentType,
    partners: string[],
    files: any[],
  ) => Promise<void>;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  changeSubmissionGrader: (
    submission: SubmissionType,
    grader: string | undefined,
  ) => Promise<void>;
}

interface IState {
  uploadSubmissionVisible: boolean;
  selectedSubmission: string /* stores the name of the assignment associated with the submission */;

  assignmentToUpload?: AssignmentType;
}

class StudentDetail extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    uploadSubmissionVisible: false,
    selectedSubmission: '',
  };

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

  public changeGrader = (
    submission: SubmissionType,
    newGrader: string | undefined,
  ) => {
    this.props.changeSubmissionGrader(submission, newGrader).then(() => {
      message.success('Updated grader');
    });
  };

  public removeSubmission = (toRemove: SubmissionType) => {
    confirm({
      title: 'Are you sure you want to remove this submission?',
      content: `The following students are associated with this submission: ${toRemove.students.join(
        ',',
      )}.`,
      onOk: () => {
        return this.props.deleteSubmission(toRemove);
      },
      okText: 'Remove',
    });
  };

  public getViewIcon = (submission: SubmissionType, student: string) => {
    if (
      !(submission.id in this.props.viewsBySubmission) ||
      !submission.isFinalized
    ) {
      // case: No history object or unfinalized
      return '--';
    } else if (student in this.props.viewsBySubmission[submission.id]) {
      // case: submission has been viewed
      return (
        <CPTooltip
          title={moment(
            this.props.viewsBySubmission[submission.id][student],
          ).format('llll')}>
          <div>
            <Icon type='eye' theme='filled' />
          </div>
        </CPTooltip>
      );
    } else {
      // case: submission has not been viewed
      return <Icon type='eye' />;
    }
  };

  public getStatus = (submission: SubmissionType | undefined) => {
    let badgeStatus:
      | 'default'
      | 'error'
      | 'success'
      | 'warning'
      | 'processing'
      | undefined;
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
      <span>
        <Badge status={badgeStatus} />
        {cellText}
      </span>
    );
  };

  public render() {
    // const graderOptions = this.props.graders.map((el: string) => {
    //   return { label: el, value: el };
    // });

    const aligner: 'left' | 'center' | 'right' = 'center';
    const columns = [
      {
        title: 'Open',
        dataIndex: 'open',
        key: 'open',
        align: aligner,
      },
      {
        title: 'Assignment',
        dataIndex: 'assignment',
        key: 'assignment',
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
            <CPTooltip
              title={tooltips.admin.studentSubmissions.viewed}
              infoIcon={true}
              hideThisOnHideTips={true}
            />
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

    const data = this.props.assignments.map((assignment) => {
      const submission = this.props.submissionsMap[assignment.id];
      let gradeString = 'Not submitted';
      // colorClass is to color the text based on status of submission
      if (submission && submission.isFinalized) {
        gradeString = `${String(submission.grade)}/${assignment.points}`;
      } else if (submission) {
        gradeString = 'Unfinalized';
      }

      const menu = submission ? (
        <Menu>
          <Menu.Item key='0' onClick={openSubmission.bind(this, submission.id)}>
            <span>
              <Icon type='code' /> Open submission
            </span>
          </Menu.Item>

          <Menu.Divider />
          <Menu.Item
            key='4'
            style={{ color: 'red' }}
            onClick={this.removeSubmission.bind(this, submission)}>
            <Icon type='delete' />
            Delete submission
          </Menu.Item>
        </Menu>
      ) : (
        <Menu>
          <Menu.Item key='0'>
            <span
              onClick={this.toggleUploadSubmissionVisible.bind(
                this,
                assignment.id,
              )}>
              <Icon type='upload' /> Upload submission
            </span>
          </Menu.Item>
        </Menu>
      );

      let graderElement;
      if (submission && assignment.name === this.state.selectedSubmission) {
        graderElement = (
          <div>
            <Select
              style={{ width: 200 }}
              defaultValue={submission.grader ? submission.grader : undefined}
              onChange={this.changeGrader.bind(this, submission)}>
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
                <Select.Option key={0} value={undefined}>
                  No grader
                </Select.Option>,
              ]}
            </Select>
            &nbsp;{' '}
            <CPTooltip
              title={tooltips.admin.studentSubmissions.lockAssignGrader}
              hideThisOnHideTips={true}>
              <Icon
                type='edit'
                onClick={this.changeActiveSubmission.bind(this, '')}
              />
            </CPTooltip>
          </div>
        );
      } else if (submission) {
        graderElement = (
          <div>
            {submission.grader ? submission.grader : '--'}&nbsp;
            <CPTooltip
              title={tooltips.admin.studentSubmissions.assignGrader}
              hideThisOnHideTips={true}>
              <Icon
                type='edit'
                onClick={this.changeActiveSubmission.bind(
                  this,
                  assignment.name,
                )}
              />
            </CPTooltip>
          </div>
        );
      } else {
        graderElement = '--';
      }

      return {
        key: assignment.name,
        open: submission ? (
          <Icon
            type='code'
            onClick={openSubmission.bind(this, submission.id)}
          />
        ) : (
          '--'
        ),
        assignment: assignment.name,
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
        viewed: submission
          ? this.getViewIcon(submission, this.props.student)
          : '--',
        actions: (
          <Dropdown
            overlay={menu}
            trigger={['click']}
            placement={'bottomRight'}>
            <Icon type='menu' />
          </Dropdown>
        ),
      };
    });

    return (
      <div>
        <TableDetail
          loadComplete={true}
          title={`Submissions: ${this.props.student}`}
          breadcrumbs={
            <Breadcrumb>
              <Breadcrumb.Item onClick={this.props.onBack}>
                <a>Submissions</a>
              </Breadcrumb.Item>
              <Breadcrumb.Item onClick={this.props.onBack}>
                <a>Students</a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>{this.props.student}</Breadcrumb.Item>
            </Breadcrumb>
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
          uploadSubmission={this.props.uploadSubmission}
          selectedAssignment={this.state.assignmentToUpload}
        />
      </div>
    );
  }
}

export default StudentDetail;
