/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Select, Switch, Table } from 'antd';
const { Option } = Select;

/* codePost imports */
import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { Course, CourseType } from '../../infrastructure/course';

import { SubmissionType } from '../../infrastructure/submission';
import { SubmissionHistoryType } from '../../infrastructure/submissionHistory';

import { formatSub, getViewIcon, ISubDataBasic } from './GraderUtils';

import { compare } from '../Utils/SortUtils';
type alignType = 'left' | 'right' | 'center';

import CPAdminDetail from '../admin/other/CPAdminDetail';

/**********************************************************************************************************************/

interface IViewAllProps {
  currentCourse: CourseType;
  currentAssignment: AssignmentType;
}
interface IViewAllState {
  graders: string[];
  submissions: SubmissionType[];
  selectedGraders: string[];
  isLoading: boolean;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  showStudentEmails: boolean;
}

interface ITableRow extends ISubDataBasic {
  key: number;
  student: string | number;
  viewIcon?: string | React.ReactElement;
}

class ViewAllPanel extends React.Component<IViewAllProps, IViewAllState> {
  public state: Readonly<IViewAllState> = {
    graders: [],
    submissions: [],
    selectedGraders: [],
    viewsBySubmission: {},
    isLoading: true,
    showStudentEmails: false,
  };

  public async componentDidMount() {
    const [submissions, viewsBySubmission, roster] = await Promise.all([
      await Assignment.readSubmissions(this.props.currentAssignment.id),
      await this.loadSubmissionsViews(),
      await Course.readRoster(this.props.currentCourse.id),
    ]);

    this.setState({ graders: roster.graders, viewsBySubmission, submissions, isLoading: false });
  }

  public loadSubmissionsViews = async () => {
    const histories = await Assignment.readSubmissionHistories(this.props.currentAssignment.id);
    const viewsBySubmission = {};
    histories.forEach((history: SubmissionHistoryType) => {
      const submissionID = history.submission;
      if (!(submissionID in viewsBySubmission)) {
        viewsBySubmission[submissionID] = {};
      }
      if (history.hasViewed) {
        viewsBySubmission[submissionID][history.student] = history.dateViewed;
      }
    });
    return viewsBySubmission;
  };

  public toggleShowStudentEmails = () => {
    this.setState({
      showStudentEmails: !this.state.showStudentEmails,
    });
  };

  public handleSelect = (grader: string) => {
    const newGraders = [...this.state.selectedGraders, grader];
    this.setState({ selectedGraders: newGraders });
  };

  public handleDeselect = (grader: string) => {
    const newGraders = this.state.selectedGraders.filter((g) => {
      return g !== grader;
    });
    this.setState({ selectedGraders: newGraders });
  };

  public render() {
    const { graders, submissions, selectedGraders } = this.state;
    const { currentAssignment } = this.props;
    const showingEmails = !this.props.currentAssignment.anonymousGrading || this.state.showStudentEmails;

    const centerAlign: alignType = 'center';
    const columns = [
      {
        title: 'Student(s)',
        dataIndex: 'student',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.student, b.student),
      },
      {
        title: 'Grade',
        dataIndex: 'grade',
        sorter: (a: ITableRow, b: ITableRow) => {
          return a.gradeToSort - b.gradeToSort;
        },
        align: centerAlign,
      },
      {
        title: 'Grader',
        dataIndex: 'grader',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.grader, b.grader),
      },
      {
        title: 'Finalized',
        dataIndex: 'finalized',
        align: centerAlign,
      },
      {
        title: 'Last Edited',
        dataIndex: 'lastEdited',
        align: centerAlign,
      },
      {
        title: 'Viewed by Student(s)',
        dataIndex: 'viewed',
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

    const data = filteredSubs.map((sub) => {
      const students = showingEmails ? sub.students.join() : String(sub.id);
      return {
        ...formatSub(sub, this.props.currentAssignment),
        key: sub.id,
        student: students,
        viewIcon: <div>{getViewIcon(sub, this.state.viewsBySubmission)}</div>,
      };
    });

    // If we're in anonymous grading mode, add a toggle to reveal student emails
    const anonymousToggle = currentAssignment.anonymousGrading ? (
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
      <Select
        placeholder="Select Graders..."
        mode="multiple"
        onSelect={this.handleSelect}
        onDeselect={this.handleDeselect}
        style={{ width: 500, marginBottom: 20 }}
      >
        {graders.map((grader) => {
          return <Option key={grader}>{grader}</Option>;
        })}
      </Select>
    );

    const content = (
      <div>
        {graderSelect}
        <Table columns={columns} dataSource={data} pagination={false} loading={this.state.isLoading} />
      </div>
    );

    return (
      <CPAdminDetail
        goBack={null}
        title={`All submissions: ${this.props.currentAssignment.name}`}
        actions={[anonymousToggle]}
        content={content}
      />
    );
  }
}

export default ViewAllPanel;
