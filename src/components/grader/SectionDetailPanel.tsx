/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Breadcrumb, Divider, Icon, Select, Spin, Switch, Table } from 'antd';

/* codePost imports */
import { formatSub, getViewIcon, ISubDataBasic, sortByGrade } from './GraderUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { SectionType } from '../../infrastructure/section';
import { Submission, SubmissionInfoType } from '../../infrastructure/submission';

import { tooltips } from '../core/tooltips';

import { compare } from '../utils/SortUtils';

import CPAdminDetail from '../admin/other/CPAdminDetail';

const { Option } = Select;

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

/* for type checking functions that operate on table rows */
interface ITableRow extends ISubDataBasic {
  key: string;
  student: string;
  viewIcon: string | React.ReactElement;
  partners: string;
}

interface IProps {
  course: CourseType;
  assignment: AssignmentType;
  sections: SectionType[];
  breadcrumbs: React.ReactElement[];
  email: string;
}

interface IState {
  /* data */
  activeSection: SectionType;
  submissionsBySection: {
    [sectionID: number]: { [student: string]: SubmissionInfoType | null };
  };
  // Map: key = id, value = array of student emails who have viewed the submission
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };

  /* UI control */
  isLoading: boolean;

  /* Anonymous grading contorl */
  showStudentEmails: boolean;

  selectedSubmissions: number[];
}

class SectionDetailPanel extends React.Component<IProps, IState> {
  /***********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/
  public constructor(props: IProps) {
    super(props);
    this.state = {
      submissionsBySection: {},
      activeSection: this.props.sections[0],
      viewsBySubmission: {},
      showStudentEmails: false,
      isLoading: false,
      selectedSubmissions: [],
    };
  }

  public async initialLoad() {
    this.setState({ isLoading: true });
    const submissionsBySection = await this.loadSubmissionsForSection();
    this.setState({ submissionsBySection, isLoading: false });
    if (this.props.sections.length === 1) {
      this.handleSelect(String(this.props.sections[0].id));
    }
  }

  public componentDidMount() {
    this.initialLoad();
  }

  public componentDidUpdate(oldProps: IProps) {
    if (oldProps.assignment !== this.props.assignment) {
      this.initialLoad();
    }
  }

  public toggleShowStudentEmails = () => {
    this.setState({
      showStudentEmails: !this.state.showStudentEmails,
    });
  };

  /***********************************************************************************
  /* Loading methods
  /**********************************************************************************/

  // load all the sections (in order to get the name and students), and for each
  // student, load that student's submissions for the active assignment
  public loadSubmissionsForSection = async () => {
    const submissionMap: any = {};
    for (const section of this.props.sections) {
      const mapValue: any = {};
      for (const student of section.students) {
        mapValue[student] = await Assignment.readSubmissions(this.props.assignment.id, {
          student,
          ['compact']: '1',
        }).then((submissions) => {
          if (submissions.length === 0) {
            return null;
          } else {
            return submissions[0];
          }
        });
      }
      submissionMap[section.id] = mapValue;
    }

    return submissionMap;
  };

  public claimSubmissions = async () => {
    const promises = this.state.selectedSubmissions.map((id) => {
      return Submission.update({ id: id, isFinalized: false, grader: this.props.email });
    });

    const submissions = await Promise.all(promises);

    this.setState((prevState) => {
      const newSubmissions = { ...prevState.submissionsBySection };
      // Map each student to the new submission
      // We need to go through all sections because of partner submissions
      const sections = Object.keys(newSubmissions);
      submissions.map((sub) => {
        sub.students.forEach((student) => {
          for (const section of sections) {
            const sectionID = parseInt(section, 10);
            if (student in newSubmissions[sectionID]) {
              newSubmissions[sectionID][student] = sub;
              break;
            }
          }
        });
      });
      return {
        submissionsBySection: newSubmissions,
        selectedSubmissions: [],
      };
    });
  };

  /***********************************************************************************
  /* Utility functions
  /**********************************************************************************/

  public handleSelect = (sectionID: string) => {
    const activeSection = this.props.sections.find((section) => {
      return section.id === Number(sectionID);
    });

    if (activeSection) {
      this.setState({ activeSection, selectedSubmissions: [] });
    }
  };

  public openGradePage = (submission: SubmissionInfoType) => {
    window.open(`/code/${submission.id}`);
  };

  /***********************************************************************************
  /* Render
  /**********************************************************************************/

  public render() {
    const { activeSection, isLoading } = this.state;
    const showingEmails = !this.props.assignment.anonymousGrading || this.state.showStudentEmails;

    let columns: any[] = [];
    let data: any[] = [];
    if (!isLoading) {
      /* define table columns */
      const centerAlign: alignType = 'center';
      columns = [
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
          title: 'Partner(s)',
          dataIndex: 'partners',
          sorter: (a: ITableRow, b: ITableRow) => compare(true, a.partners, b.partners),
          align: centerAlign,
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
          sorter: (a: any, b: any) => compare(true, a.grader, b.grader),
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

      /* define table row */
      const submissions = this.state.submissionsBySection[this.state.activeSection.id];
      if (submissions !== undefined) {
        data = Object.keys(submissions).map((student) => {
          const submission = submissions[student];
          const shownStudent = showingEmails || !submission ? student : submission.id;

          let partners = '--';
          if (showingEmails && submission) {
            partners = submission.students
              .filter((obj) => {
                return obj !== student;
              })
              .join(', ');
          }

          const openGradePage = () => {
            // @ts-ignore
            this.openGradePage(submission);
          };

          return {
            ...formatSub(submission, this.props.assignment),
            key: submission ? submission.id : student,
            student: shownStudent,
            partners,
            viewIcon: <div>{getViewIcon(submission, this.state.viewsBySubmission, student)}</div>,
            open: submission !== null ? <Icon type="code" onClick={openGradePage} /> : null,
            disableCheck: !submission || submission.grader,
          };
        });
      }
    }

    if (this.props.sections.length === 0) {
      // Sections haven't been loaded yet
      return <Spin indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} />;
    }

    let selectContent;
    if (this.props.sections.length > 1) {
      const menuItems = this.props.sections.map((section) => {
        return <Option key={section.id}>{section.name} </Option>;
      });
      selectContent = (
        <div>
          <Select
            placeholder="Select section"
            onSelect={this.handleSelect}
            value={this.state.activeSection ? this.state.activeSection.name : undefined}
            loading={this.state.isLoading}
            style={{ width: 200 }}
          >
            {menuItems}
          </Select>
        </div>
      );
    }

    if (this.props.sections.length !== 1 && !activeSection) {
      return <div>{selectContent}</div>;
    }

    // If we're in anonymous grading mode, add a toggle to reveal student emails
    let anonymousToggle;
    if (this.props.assignment.anonymousGrading) {
      anonymousToggle = (
        <div>
          <div style={{ display: 'inline-block' }}>
            Reveal students: &nbsp;
            <Switch
              defaultChecked={showingEmails}
              onChange={this.toggleShowStudentEmails}
              key="toggleShowStudents"
              style={{ display: 'inline-block' }}
            />
          </div>
          <Divider type="vertical" style={{ height: 25 }} />
        </div>
      );
    }

    const claimButton = (
      <Button type="primary" disabled={this.state.selectedSubmissions.length === 0} onClick={this.claimSubmissions}>
        Claim Selected
      </Button>
    );

    const rowSelection = {
      onChange: (selectedRowKeys: any[]) => {
        this.setState({ selectedSubmissions: selectedRowKeys });
      },
      getCheckboxProps: (row: any) => {
        return {
          disabled: row.disableCheck,
        };
      },
      selectedRowKeys: this.state.selectedSubmissions,
    };

    const content = (
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={data}
        pagination={false}
        loading={this.state.isLoading}
      />
    );

    return (
      <CPAdminDetail
        goBack={null}
        breadcrumbs={
          <Breadcrumb>
            {this.props.breadcrumbs}
            <Breadcrumb.Item>{this.props.assignment.name}</Breadcrumb.Item>
          </Breadcrumb>
        }
        title={`Section: ${this.state.activeSection.name}`}
        actions={[anonymousToggle, selectContent, claimButton]}
        content={content}
        gutterSize={0}
        titleInfo={tooltips.grader.section.title}
      />
    );
  }
}

export default SectionDetailPanel;
