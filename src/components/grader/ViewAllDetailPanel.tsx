// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* ant imports */
import type { SelectProps } from 'antd';
import { Breadcrumb, Select, Switch, Table, Typography } from 'antd';

import { Course } from '../../api-client';
import { assignmentsApi, coursesApi } from '../../api-client/clients';
import {
  AnonymousSubmissionInfoType,
  AssignmentType,
  SubmissionHistoryType,
  SubmissionInfoType,
} from '../../types/models';

import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

import { formatSub, getViewIcon, ISubDataBasic, sortByGrade } from './GraderUtils';

import { compare } from '../utils/SortUtils';

import { Component } from 'react';
import CPAdminDetail from '../admin/other/CPAdminDetail';
import Link from 'antd/es/typography/Link';

type alignType = 'left' | 'right' | 'center';

const { Option } = Select;

/**********************************************************************************************************************/

interface IViewAllProps {
  course: Course;
  assignment: AssignmentType;
  breadcrumbs: Array<{ title: React.ReactNode }>;
}

interface IViewAllState {
  graders: string[];
  submissions: SubmissionInfoType[];
  selectedGraders: string[];
  isLoading: boolean;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  showStudentEmails: boolean;
}

interface ITableRow extends ISubDataBasic {
  key: number;
  student: string | number | React.ReactElement;
  viewIcon?: string | React.ReactElement;
}

class ViewAllDetailPanel extends Component<IViewAllProps, IViewAllState> {
  public state: Readonly<IViewAllState> = {
    graders: [],
    submissions: [],
    selectedGraders: [],
    viewsBySubmission: {},
    isLoading: true,
    showStudentEmails: false,
  };

  public async initialLoad() {
    this.setState({
      isLoading: true,
      submissions: [],
      viewsBySubmission: {},
    });

    try {
      const submissionsResponse = await assignmentsApi.submissionsList({ id: this.props.assignment.id });
      const submissions = Array.isArray(submissionsResponse)
        ? submissionsResponse
        : (submissionsResponse.results ?? []);
      this.onLoadNewSubmissions(submissions);
    } catch (error) {
      console.error('Failed to load submissions', error);
    }

    try {
      const historiesResponse = await assignmentsApi.submissionHistoriesList({ id: this.props.assignment.id });
      const histories = Array.isArray(historiesResponse) ? historiesResponse : (historiesResponse.results ?? []);
      this.onLoadNewHistories(histories);
    } catch (error) {
      console.error('Failed to load submission histories', error);
    }

    try {
      const roster = await coursesApi.rosterRetrieve({ id: this.props.course.id });
      this.setState({
        graders: (roster.graders ?? []).filter((grader): grader is string => Boolean(grader)),
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load roster', error);
      this.setState({ isLoading: false });
    }
  }

  public componentDidMount() {
    this.initialLoad();
  }

  public componentDidUpdate(oldProps: IViewAllProps, _prevProps: IViewAllState) {
    if (oldProps.assignment.id !== this.props.assignment.id) {
      this.initialLoad();
    }
  }

  //************************** Pagination callbacks *****************************

  public onLoadNewSubmissions = (newSubs: SubmissionInfoType[]) => {
    this.setState((prevState, _prevProps) => {
      const mergedById = new Map<number, SubmissionInfoType>();

      prevState.submissions.forEach((sub) => {
        mergedById.set(sub.id, sub);
      });

      newSubs.forEach((sub) => {
        mergedById.set(sub.id, sub);
      });

      return {
        submissions: Array.from(mergedById.values()),
      };
    });
  };

  public onLoadNewHistories = (newHistories: SubmissionHistoryType[]) => {
    this.setState((prevState, _prevProps) => {
      const newViewsBySubmission = { ...prevState.viewsBySubmission };
      newHistories.forEach((history: SubmissionHistoryType) => {
        const submissionID = history.submission;
        if (!(submissionID in newViewsBySubmission)) {
          newViewsBySubmission[submissionID] = {};
        }
        if (history.hasViewed && history.dateViewed) {
          newViewsBySubmission[submissionID][history.student] = history.dateViewed;
        }
      });

      return {
        viewsBySubmission: newViewsBySubmission,
      };
    });
  };

  // public loadSubmissionsViews = async () => {
  // Legacy call commented out in original file
  // };

  public toggleShowStudentEmails = () => {
    this.setState({
      showStudentEmails: !this.state.showStudentEmails,
    });
  };

  public handleSelect: SelectProps['onSelect'] = (grader) => {
    const newGraders = [...this.state.selectedGraders, grader];
    this.setState({ selectedGraders: newGraders });
  };
  public handleDeselect: SelectProps['onDeselect'] = (grader) => {
    const newGraders = this.state.selectedGraders.filter((g) => {
      return g !== grader;
    });
    this.setState({ selectedGraders: newGraders });
  };

  public openGradePage = (submission: SubmissionInfoType) => {
    if (localStorage.getItem('source') === 'codePost') {
      window.open(`/code/${submission.id}`);
    } else {
      window.open(`/code/${submission.id}`, '_self');
    }
  };

  public render() {
    const { graders, submissions, selectedGraders } = this.state;
    const { assignment } = this.props;
    const showingEmails = !assignment.anonymousGrading || this.state.showStudentEmails;

    const centerAlign: alignType = 'center';
    const columns = [
      {
        title: 'Student(s)',
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
        title: 'Grader',
        dataIndex: 'grader',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.grader, b.grader),
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
        title: 'Viewed by Student(s)',
        dataIndex: 'viewIcon',
        align: centerAlign,
      },
    ];

    // If select bar is populated, filter by submissions who meet search conditions
    let filteredSubs;
    if (selectedGraders.length === 0) {
      filteredSubs = submissions;
    } else {
      filteredSubs = submissions.filter((sub) => {
        return sub.grader && selectedGraders.indexOf(sub.grader.toLowerCase()) !== -1;
      });
    }
    /***********************************************************************************
     /* Event handlers
     /**********************************************************************************/

    const openGradePage = (submission: AnonymousSubmissionInfoType) => {
      if (localStorage.getItem('source') === 'codePost') {
        window.open(`/code/${submission.id}`);
      } else {
        window.open(`/code/${submission.id}`, '_blank');
      }
    };
    const data = filteredSubs.map((sub) => {
      const students = showingEmails ? sub.students.join(', ') : String(sub.id);
      return {
        ...formatSub(sub, this.props.assignment),
        key: sub.id,
        student: (
          <Link onClick={() => openGradePage(sub)}>
            <Typography.Text strong className="text-link">
              {students}
            </Typography.Text>
          </Link>
        ),
        viewIcon: <div>{getViewIcon(sub, this.state.viewsBySubmission)}</div>,
      };
    });

    // If we're in anonymous grading mode, add a toggle to reveal student emails
    const anonymousToggle = assignment.anonymousGrading ? (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span>Reveal students:</span>
        <Switch defaultChecked={showingEmails} onChange={this.toggleShowStudentEmails} key="toggleShowStudents" />
      </div>
    ) : (
      <div />
    );

    const graderSelect = (
      <div style={{ marginBottom: 20 }}>
        <Select
          placeholder="Filter by grader..."
          mode="multiple"
          onSelect={this.handleSelect}
          onDeselect={this.handleDeselect}
          style={{ width: 500 }}
        >
          {graders.map((grader) => {
            return (
              <Option key={grader} value={grader}>
                {grader}
              </Option>
            );
          })}
        </Select>
        <CPTooltip
          title={tooltips.grader.allSubmissions.filter}
          placement="right"
          infoIcon={true}
          hideThisOnHideTips={true}
          iconStyle={{ paddingLeft: 10 }}
        />
      </div>
    );

    const content = (
      <div>
        {graderSelect}
        <Table columns={columns} dataSource={data} loading={this.state.isLoading} size="middle" />
      </div>
    );

    return (
      <CPAdminDetail
        breadcrumbs={<Breadcrumb items={[...this.props.breadcrumbs, { title: this.props.assignment.name }]} />}
        goBack={null}
        title={<span style={{ letterSpacing: '-0.3px' }}>{`All submissions: ${this.props.assignment.name}`}</span>}
        actions={[anonymousToggle]}
        content={content}
        gutterSize={0}
        titleInfo={tooltips.grader.allSubmissions.title}
      />
    );
  }
}

export default ViewAllDetailPanel;
