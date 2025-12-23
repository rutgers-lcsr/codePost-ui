/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { CodeOutlined, DeleteOutlined, EyeFilled, EyeInvisibleOutlined, MenuOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Dropdown, Modal, Tag, Button, Tooltip, Typography } from 'antd';

/* other library imports */
import moment from 'moment';

import { Link } from 'react-router-dom';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { SubmissionInfoType } from '../../../../infrastructure/submission';

import { TableDetail } from '../../other/TableDetail';

import CPTooltip from '../../../../components/core/CPTooltip';

import { openSubmission, openSubmissionInSameTab } from '../../other/AdminUtils';

const confirm = Modal.confirm;

/**********************************************************************************************************************/

interface IProps {
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  graders: string[];
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  means: { [assignmentID: number]: string | null };

  grader: string;


  baseURL: string;

  selectedAssignment: AssignmentType;
  submissions: SubmissionInfoType[];
}

class GraderAssignmentDetail extends React.Component<IProps> {
  public removeSubmission = (toRemove: SubmissionInfoType) => {
    confirm({
      title: 'Are you sure you want to delete this submission?',
      content: `The following students are associated with this submission: ${toRemove.students.join(',')}.`,
      onOk: () => {
        return this.props.deleteSubmission(toRemove);
      },
      okText: 'Remove',
    });
  };

  public getStatus = (submission: SubmissionInfoType | undefined) => {
    let color: 'default' | 'error' | 'success' | 'warning' | 'processing' | undefined;
    let cellText;
    if (submission) {
      if (submission.isFinalized) {
        color = 'success';
        cellText = 'Finalized';
      } else if (submission.grader) {
        color = 'processing';
        cellText = 'Unfinalized';
      } else {
        color = 'warning';
        cellText = 'Unclaimed';
      }
    } else {
      color = 'default';
      cellText = 'Missing';
    }
    return <Tag color={color}>{cellText}</Tag>;
  };

  public getViewIcon = (submission: SubmissionInfoType) => {
    if (!(submission.id in this.props.viewsBySubmission) || !submission.isFinalized) {
      // case: No history object or unfinalized
      return <span style={{ color: '#999' }}>--</span>;
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
              <EyeFilled />
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
              <EyeInvisibleOutlined />
            </div>
          </CPTooltip>
        );
      }
    }
  };

  public render() {
    const aligner: 'left' | 'center' | 'right' = 'center';

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


    const selectedAssignment = this.props.selectedAssignment;

    if (selectedAssignment) {
      // Deduplicate submissions by ID to handle potential duplicate data
      const uniqueSubmissions = Array.from(new Map(this.props.submissions.map((s) => [s.id, s])).values());
      const data = uniqueSubmissions.map((submission, index) => {
        const open = () => {
          if (localStorage.getItem('source') === 'codePost') {
            openSubmission(submission.id);
          } else {
            openSubmissionInSameTab(submission.id);
          }
        };
        const menuItems = [

          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            label: (
              <>
                <DeleteOutlined /> Delete
              </>
            ),
            danger: true,
            onClick: this.removeSubmission.bind(this, submission),
          },
        ];

        let gradeString: string;
        if (submission.isFinalized) {
          gradeString = `${String(submission.grade)}/${selectedAssignment.points}`;
        } else {
          gradeString = 'Unfinalized';
        }

        return {

          key: `${submission.id}-${index}`,
          assignment: <Typography.Text strong>{selectedAssignment.name}</Typography.Text>,
          status: this.getStatus(submission),
          students: (
            <Typography.Text strong>
              {submission.students.map((student, i) => {
                const root = this.props.baseURL.split('/submissions/by_grader')[0];
                const link = `${root}/submissions/by_student/${student}`;
                return (
                  <span key={student}>
                    {i > 0 && ', '}
                    <Link to={link} className="text-link">
                      {student}
                    </Link>
                  </span>
                );
              })}
            </Typography.Text>
          ),
          grade: gradeString,
          viewed: this.getViewIcon(submission),
          actions: (
            <div style={{ whiteSpace: 'nowrap' }}>
              <Tooltip title="Open Submission">
                <Button shape="circle" icon={<CodeOutlined />} onClick={open} style={{ marginRight: 8 }} />
              </Tooltip>
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
                Submissions graded by: {this.props.grader} for {selectedAssignment.name}
              </Typography.Title>
            }
            breadcrumbs={
              <Breadcrumb
                items={[
                  { title: 'Submissions' },
                  {
                    title: (
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid
                      <Link to={this.props.baseURL}>By Grader</Link>
                    ),
                  },
                  {
                    title: (
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid
                      <Link to={this.props.baseURL}>{this.props.grader}</Link>
                    ),
                  },
                  {
                    title: (
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid
                      <a>{selectedAssignment.name}</a>
                    ),
                  },
                ]}
              />
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

export default GraderAssignmentDetail;
