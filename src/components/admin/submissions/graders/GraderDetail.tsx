/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Badge, Breadcrumb, Dropdown, Icon, Menu, Modal } from 'antd';

/* other library imports */
import moment from 'moment';

/* codePost imports */
import { AssignmentType, sortAssignments } from '../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../infrastructure/submission';

import { TableDetail } from '../../other/TableDetail';

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import { IAssignmentToSubmissionsMap } from '../../../../types/common';

import { openSubmission } from '../../other/AdminUtils';

const confirm = Modal.confirm;

/**********************************************************************************************************************/

interface IProps {
  onBack: () => void;
  grader: string;
  submissionsByAssignment: IAssignmentToSubmissionsMap;
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  assignments: AssignmentType[];
  graders: string[];
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  means: { [assignmentID: number]: string | null };
}

interface IState {
  selectedAssignment: AssignmentType | undefined;
}

class GraderDetail extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    selectedAssignment: undefined,
  };

  public changeActiveAssignment = (assignment: AssignmentType | undefined) => {
    this.setState({ selectedAssignment: assignment });
  };

  public removeSubmission = (toRemove: SubmissionType) => {
    confirm({
      title: 'Are you sure you want to delete this submission?',
      content: `The following students are associated with this submission: ${toRemove.students.join(',')}.`,
      onOk: () => {
        return this.props.deleteSubmission(toRemove);
      },
      okText: 'Remove',
    });
  };

  public getStatus = (submission: SubmissionType | undefined) => {
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
      <span>
        <Badge status={badgeStatus} />
        {cellText}
      </span>
    );
  };

  public getViewIcon = (submission: SubmissionType) => {
    if (!(submission.id in this.props.viewsBySubmission) || !submission.isFinalized) {
      // case: No history object or unfinalized
      return '--';
    } else {
      const viewed = this.props.viewsBySubmission[submission.id];

      // case: submission has been viewed
      if (Object.keys(viewed).length > 0) {
        const tooltipText = submission.students
          .map((student) => {
            if (Object.keys(viewed).indexOf(student) > -1) {
              return `${student}: ${moment(viewed[student]).format('llll')}`;
            } else {
              return `${student}: unviewed`;
            }
          })
          .join('\n');
        return (
          <CPTooltip title={tooltipText}>
            <div>
              <Icon type="eye" theme="filled" />
            </div>
          </CPTooltip>
        );
      } else {
        // case: submission has not been viewed
        const tooltipText =
          submission.students.length > 1
            ? 'No students have viewed this submission yet'
            : `${submission.students[0]} has not viewed this submission yet`;
        return (
          <CPTooltip title={tooltipText}>
            <div>
              <Icon type="eye-invisible" />
            </div>
          </CPTooltip>
        );
      }
    }
  };

  public render() {
    const { selectedAssignment } = this.state;
    const aligner: 'left' | 'center' | 'right' = 'center';

    if (!selectedAssignment) {
      const columns = [
        {
          title: 'Zoom in',
          dataIndex: 'expand',
          key: 'expand',
          align: aligner,
        },
        {
          title: 'Assignment',
          dataIndex: 'assignment',
          key: 'assignment',
        },
        {
          title: 'Claimed',
          dataIndex: 'claimed',
          key: 'claimed',
          align: aligner,
        },
        {
          title: 'Finalized',
          dataIndex: 'finalized',
          key: 'finalized',
          align: aligner,
        },
        {
          title: 'Unfinalized',
          dataIndex: 'unfinalized',
          key: 'unfinalized',
          align: aligner,
        },
        {
          title: 'Avg. Grade',
          dataIndex: 'graderAverage',
          key: 'graderAverage',
          align: aligner,
        },
        {
          title: 'Assignment Avg.',
          dataIndex: 'assignmentAverage',
          key: 'assignmentAverage',
          align: aligner,
        },
        {
          title: 'Actions',
          dataIndex: 'actions',
          key: 'actions',
          align: aligner,
        },
      ];

      const data = sortAssignments(this.props.assignments).map((assignment) => {
        const graded = this.props.submissionsByAssignment[assignment.id];
        const menu = (
          <Menu>
            <Menu.Item onClick={this.changeActiveAssignment.bind(this, assignment)}>
              <Icon type="folder-open" />
              Zoom in
            </Menu.Item>
          </Menu>
        );

        const numFinalized = graded
          ? graded.filter((sub) => {
              return sub.isFinalized;
            }).length
          : 0;

        const numClaimed = graded ? graded.length : 0;
        const numUnfinalized = numClaimed - numFinalized;

        let avgGrade = 0;
        if (graded) {
          avgGrade =
            graded.reduce((acc, sub) => {
              return acc + (sub.grade !== null ? sub.grade : 0);
            }, 0) / graded.length;
        }

        return {
          key: assignment.name,
          expand: (
            <div onClick={this.changeActiveAssignment.bind(this, assignment)} style={{ cursor: 'pointer' }}>
              <CPTooltip title={tooltips.admin.graderSubmissions.expandAssignment} hideThisOnHideTips={true}>
                <Icon type="folder-open" />
              </CPTooltip>
            </div>
          ),
          assignment: assignment.name,
          claimed: graded ? graded.length : 0,
          finalized: numFinalized,
          unfinalized: numUnfinalized,
          graderAverage: numFinalized > 0 ? `${avgGrade.toFixed(1)}/${assignment.points}` : '--',
          assignmentAverage: assignment.mean
            ? `${assignment.mean.toFixed(1)}/${assignment.points}`
            : this.props.means[assignment.id]
            ? `${this.props.means[assignment.id]}/${assignment.points}`
            : '--',
          actions: (
            <Dropdown overlay={menu} trigger={['click']} placement={'bottomRight'}>
              <Icon type="menu" />
            </Dropdown>
          ),
        };
      });

      return (
        <div>
          <TableDetail
            loadComplete={true}
            title={`Submissions graded by: ${this.props.grader}`}
            breadcrumbs={
              <Breadcrumb>
                <Breadcrumb.Item onClick={this.props.onBack}>Submissions</Breadcrumb.Item>
                <Breadcrumb.Item onClick={this.props.onBack}>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#">Graders</a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#">{this.props.grader}</a>
                </Breadcrumb.Item>
              </Breadcrumb>
            }
            isEmpty={false}
            emptyNode={null}
            columns={columns}
            data={data}
            actions={[]}
          />
        </div>
      );
    } else {
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
          title: 'Students',
          dataIndex: 'students',
          key: 'students',
        },
        {
          title: 'Status',
          dataIndex: 'status',
          key: 'status',
          align: aligner,
        },
        {
          title: 'Grade',
          dataIndex: 'grade',
          key: 'grade',
          align: aligner,
        },
        {
          title: 'Viewed',
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

      const submissions = this.props.submissionsByAssignment[selectedAssignment.id];
      const data = submissions.map((submission) => {
        const menu = (
          <Menu>
            <Menu.Item onClick={openSubmission.bind(this, submission.id)}>
              <Icon type="code" />
              Open
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item style={{ color: 'red' }} onClick={this.removeSubmission.bind(this, submission)}>
              <Icon type="delete" />
              Delete
            </Menu.Item>
          </Menu>
        );

        let gradeString: string;
        if (submission.isFinalized) {
          gradeString = `${String(submission.grade)}/${selectedAssignment.points}`;
        } else {
          gradeString = 'Unfinalized';
        }

        return {
          open: <Icon type="code" onClick={openSubmission.bind(this, submission.id)} />,
          key: submission.id,
          assignment: selectedAssignment.name,
          status: this.getStatus(submission),
          students: submission.students.join(', '),
          grade: gradeString,
          viewed: this.getViewIcon(submission),
          actions: (
            <Dropdown overlay={menu} trigger={['click']} placement={'bottomRight'}>
              <Icon type="menu" />
            </Dropdown>
          ),
        };
      });

      return (
        <div>
          <TableDetail
            loadComplete={true}
            title={`Submissions graded by: ${this.props.grader} for ${selectedAssignment.name}`}
            breadcrumbs={
              <Breadcrumb>
                <Breadcrumb.Item onClick={this.props.onBack}>Submissions</Breadcrumb.Item>
                <Breadcrumb.Item onClick={this.props.onBack}>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a href="#">Graders</a>
                </Breadcrumb.Item>
                <Breadcrumb.Item onClick={this.changeActiveAssignment.bind(this, undefined)}>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a>{this.props.grader}</a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                  {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                  <a>{selectedAssignment.name}</a>
                </Breadcrumb.Item>
              </Breadcrumb>
            }
            isEmpty={false}
            emptyNode={null}
            columns={columns}
            data={data}
            actions={[]}
          />
        </div>
      );
    }
  }
}

export default GraderDetail;
