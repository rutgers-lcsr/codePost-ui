/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Badge, Breadcrumb, Dropdown, Icon, Menu } from 'antd';

/* other library imports */

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../infrastructure/submission';

import TableDetail from '../../other/TableDetail';

import { IAssignmentToSubmissionsMap } from '../../../../types/common';

/**********************************************************************************************************************/

interface IProps {
  onBack: () => void;
  grader: string;
  submissionsByAssignment: IAssignmentToSubmissionsMap;
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  assignments: AssignmentType[];
  graders: string[];
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  changeSubmissionGrader: (submission: SubmissionType, grader: string | undefined) => Promise<void>;
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

  public render() {
    const { selectedAssignment } = this.state;
    const aligner: 'left' | 'center' | 'right' = 'center';

    if (!selectedAssignment) {
      const columns = [
        {
          title: 'Expand',
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

      const data = this.props.assignments.map((assignment) => {
        const graded = this.props.submissionsByAssignment[assignment.id];
        const menu = (
          <Menu>
            <Menu.Item onClick={this.changeActiveAssignment.bind(this, assignment)}>
              <Icon type="zoom-in" />
              Expand
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
          expand: <Icon type="zoom-in" onClick={this.changeActiveAssignment.bind(this, assignment)} />,
          assignment: assignment.name,
          claimed: graded ? graded.length : 0,
          finalized: numFinalized,
          unfinalized: numUnfinalized,
          graderAverage: numFinalized > 0 ? `${avgGrade.toFixed(1)}/${assignment.points}` : '--',
          assignmentAverage: assignment.mean ? `${assignment.mean.toFixed(1)}/${assignment.points}` : '--',
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
                  <a href="#">Graders</a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
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
            <Menu.Item>
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
          key: submission.id,
          assignment: selectedAssignment.name,
          status: this.getStatus(submission),
          students: submission.students.join(', '),
          grade: gradeString,
          viewed: 'BUMP',
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
                  <a href="#">Graders</a>
                </Breadcrumb.Item>
                <Breadcrumb.Item onClick={this.changeActiveAssignment.bind(this, undefined)}>
                  <a>{this.props.grader}</a>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
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
