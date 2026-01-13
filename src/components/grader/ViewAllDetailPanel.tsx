/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* ant imports */
import type { SelectProps } from 'antd';
import { Breadcrumb, Select, Switch, Table, Typography } from 'antd';

/* codePost imports */
import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { Course, CourseType } from '../../infrastructure/course';

import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

import { AnonymousSubmissionInfoType, SubmissionInfoType } from '../../infrastructure/submission';
import { SubmissionHistoryType } from '../../infrastructure/submissionHistory';

import { formatSub, getViewIcon, ISubDataBasic, sortByGrade } from './GraderUtils';

import { compare } from '../utils/SortUtils';

import { Component } from 'react';
import CPAdminDetail from '../admin/other/CPAdminDetail';
import Link from 'antd/es/typography/Link';

type alignType = 'left' | 'right' | 'center';

const { Option } = Select;

/**********************************************************************************************************************/

interface IViewAllProps {
  course: CourseType;
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
    this.setState({ isLoading: true });
    Assignment.readPaginatedSubmissions(this.props.assignment.id, this.onLoadNewSubmissions);
    Assignment.readPaginatedSubmissionHistories(this.props.assignment.id, this.onLoadNewHistories);

    const roster = await Course.readRoster(this.props.course.id);
    this.setState({
      graders: roster.graders,
      isLoading: false,
    });
  }

  public componentDidMount() {
    this.initialLoad();
  }

  public componentDidUpdate(oldProps: IViewAllProps, _prevProps: IViewAllState) {
    if (oldProps.assignment !== this.props.assignment) {
      this.initialLoad();
    }
  }

  //************************** Pagination callbacks *****************************

  public onLoadNewSubmissions = (newSubs: SubmissionInfoType[]) => {
    this.setState((prevState, _prevProps) => {
      return {
        submissions: [...prevState.submissions, ...newSubs],
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
  //   const histories = await Assignment.readSubmissionHistories(this.props.assignment.id);
  //   const viewsBySubmission: any = {};
  //   histories.forEach((history: SubmissionHistoryType) => {
  //     const submissionID = history.submission;
  //     if (!(submissionID in viewsBySubmission)) {
  //       viewsBySubmission[submissionID] = {};
  //     }
  //     if (history.hasViewed) {
  //       viewsBySubmission[submissionID][history.student] = history.dateViewed;
  //     }
  //   });
  //   return viewsBySubmission;
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
      <div style={{ display: 'inline-block', padding: '0px 20px' }}>
        Reveal students: &nbsp;
        <Switch
          defaultChecked={showingEmails}
          onChange={this.toggleShowStudentEmails}
          key="toggleShowStudents"
          style={{ display: 'inline-block' }}
        />
      </div>
    ) : (
      <div />
    );

    const graderSelect = (
      <div>
        <Select
          placeholder="Select Graders..."
          mode="multiple"
          onSelect={this.handleSelect}
          onDeselect={this.handleDeselect}
          style={{ width: 500, marginBottom: 20 }}
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
        <Table columns={columns} dataSource={data} loading={this.state.isLoading} />
      </div>
    );

    return (
      <CPAdminDetail
        breadcrumbs={<Breadcrumb items={[...this.props.breadcrumbs, { title: this.props.assignment.name }]} />}
        goBack={null}
        title={`All submissions: ${this.props.assignment.name}`}
        actions={[anonymousToggle]}
        content={content}
        gutterSize={0}
        titleInfo={tooltips.grader.allSubmissions.title}
      />
    );
  }
}

export default ViewAllDetailPanel;
